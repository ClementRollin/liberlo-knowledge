import { Injectable, NotFoundException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { GoogleDriveProvider } from './providers/google-drive.provider';
import { ConfluenceProvider } from './providers/confluence.provider';
import type { AnalyzeDocumentDto } from './dto/analyze-document.dto';
import type { ConfirmImportDto } from './dto/confirm-import.dto';
import type { SaveSettingsDto } from './dto/save-settings.dto';

const LIBERLO_SERVICES = ['IT', 'CSM', 'Sales', 'Marketing', 'RH', 'Direction'];

export interface AnalysisResult {
  service: string;
  confidence: number;
  summary: string;
  tags: string[];
}

export interface ImportResult {
  created: number;
  updated: number;
  errors: number;
}

@Injectable()
export class ImportService {
  private readonly anthropic: Anthropic;

  constructor(
    private readonly prisma: PrismaService,
    private readonly embedding: EmbeddingService,
    private readonly driveProvider: GoogleDriveProvider,
    private readonly confluenceProvider: ConfluenceProvider,
    private readonly config: ConfigService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY', ''),
    });
  }

  // ── Settings ────────────────────────────────────────────────────────────────

  async getSettings() {
    const settings = await this.prisma.importSettings.findFirst();
    if (!settings) {
      return {
        driveConnected: false,
        confluenceConnected: false,
        confluenceBaseUrl: null,
        confluenceEmail: null,
      };
    }
    return {
      driveConnected: !!(settings.driveAccessToken && settings.driveRefreshToken),
      confluenceConnected: !!(settings.confluenceBaseUrl && settings.confluenceToken),
      confluenceBaseUrl: settings.confluenceBaseUrl,
      confluenceEmail: settings.confluenceEmail,
    };
  }

  async saveSettings(dto: SaveSettingsDto) {
    const existing = await this.prisma.importSettings.findFirst();
    const data = {
      confluenceBaseUrl: dto.confluenceBaseUrl ?? null,
      confluenceEmail: dto.confluenceEmail ?? null,
      confluenceToken: dto.confluenceToken ?? null,
    };

    if (existing) {
      return this.prisma.importSettings.update({ where: { id: existing.id }, data });
    }
    return this.prisma.importSettings.create({ data });
  }

  // ── Google Drive ─────────────────────────────────────────────────────────────

  getDriveAuthUrl(): string {
    return this.driveProvider.getAuthUrl();
  }

  async handleDriveCallback(code: string) {
    const tokens = await this.driveProvider.exchangeCode(code);
    const existing = await this.prisma.importSettings.findFirst();
    const data = {
      driveAccessToken: tokens.accessToken,
      driveRefreshToken: tokens.refreshToken,
      driveTokenExpiry: tokens.expiry,
    };
    if (existing) {
      await this.prisma.importSettings.update({ where: { id: existing.id }, data });
    } else {
      await this.prisma.importSettings.create({ data });
    }
    return { connected: true };
  }

  async listDriveFiles() {
    const settings = await this.getSettingsOrThrow();
    return this.driveProvider.listFiles(
      settings.driveAccessToken!,
      settings.driveRefreshToken!,
    );
  }

  async getDriveFileContent(fileId: string, mimeType: string): Promise<string> {
    const settings = await this.getSettingsOrThrow();
    return this.driveProvider.exportAsText(
      fileId,
      mimeType,
      settings.driveAccessToken!,
      settings.driveRefreshToken!,
    );
  }

  // ── Confluence ───────────────────────────────────────────────────────────────

  async listConfluencePages() {
    const settings = await this.getSettingsOrThrow();
    return this.confluenceProvider.listPages(
      settings.confluenceBaseUrl!,
      settings.confluenceEmail!,
      settings.confluenceToken!,
    );
  }

  async getConfluencePageContent(pageId: string): Promise<string> {
    const settings = await this.getSettingsOrThrow();
    return this.confluenceProvider.getPageContent(
      settings.confluenceBaseUrl!,
      settings.confluenceEmail!,
      settings.confluenceToken!,
      pageId,
    );
  }

  // ── LLM Analysis ─────────────────────────────────────────────────────────────

  async analyzeDocument(dto: AnalyzeDocumentDto): Promise<AnalysisResult> {
    const truncatedContent = dto.content.slice(0, 4000);

    const message = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Tu es un assistant qui classe des documents internes de l'entreprise Liberlo.
Les services existants sont : ${LIBERLO_SERVICES.join(', ')}.

Voici le document à analyser :
Titre : ${dto.title}
Contenu : ${truncatedContent}

Réponds UNIQUEMENT en JSON valide avec ce format exact :
{
  "service": "IT" | "CSM" | "Sales" | "Marketing" | "RH" | "Direction",
  "confidence": 0.0,
  "summary": "Résumé en 2 phrases maximum",
  "tags": ["tag1", "tag2", "tag3"]
}`,
        },
      ],
    });

    const raw =
      message.content[0].type === 'text' ? message.content[0].text : '{}';
    try {
      const result = JSON.parse(raw) as AnalysisResult;
      if (!LIBERLO_SERVICES.includes(result.service)) result.service = 'IT';
      result.confidence = Math.max(0, Math.min(1, result.confidence));
      return result;
    } catch {
      return { service: 'IT', confidence: 0.5, summary: dto.title, tags: [] };
    }
  }

  // ── Import Confirm ────────────────────────────────────────────────────────────

  async confirmImport(
    dto: ConfirmImportDto,
    authorId: string,
  ): Promise<ImportResult> {
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const item of dto.items) {
      try {
        const service = await this.prisma.service.findFirst({
          where: { slug: item.serviceSlug.toLowerCase() },
        });
        if (!service) {
          errors++;
          continue;
        }

        const existing = item.sourceUrl
          ? await this.prisma.article.findUnique({
              where: { sourceUrl: item.sourceUrl },
            })
          : null;

        let articleId: string;

        if (existing) {
          await this.prisma.article.update({
            where: { id: existing.id },
            data: {
              title: item.title,
              content: item.content,
              summary: item.summary ?? null,
              tags: item.tags ?? [],
            },
          });
          articleId = existing.id;
          updated++;
        } else {
          const article = await this.prisma.article.create({
            data: {
              title: item.title,
              content: item.content,
              summary: item.summary ?? null,
              tags: item.tags ?? [],
              serviceId: service.id,
              authorId,
              status: 'DRAFT',
              sourceUrl: item.sourceUrl ?? null,
            },
          });
          articleId = article.id;
          created++;
        }

        // Génère l'embedding (non bloquant — ignore les erreurs)
        const text = [item.title, item.summary ?? '', item.content, (item.tags ?? []).join(' ')]
          .filter(Boolean)
          .join('\n');
        this.embedding
          .generateEmbedding(text)
          .then(async (vector) => {
            const pgVector = `[${vector.join(',')}]`;
            await this.prisma.$executeRaw`
              UPDATE "Article" SET embedding = ${pgVector}::vector WHERE id = ${articleId}
            `;
          })
          .catch(() => {});
      } catch {
        errors++;
      }
    }

    return { created, updated, errors };
  }

  private async getSettingsOrThrow() {
    const settings = await this.prisma.importSettings.findFirst();
    if (!settings) throw new NotFoundException('Import non configuré.');
    return settings;
  }
}
