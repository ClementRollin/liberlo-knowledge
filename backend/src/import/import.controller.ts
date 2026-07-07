import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ImportService } from './import.service';
import { AnalyzeDocumentDto } from './dto/analyze-document.dto';
import { ConfirmImportDto } from './dto/confirm-import.dto';
import { SaveSettingsDto } from './dto/save-settings.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { User } from '@prisma/client';

@Controller('import')
@UseGuards(JwtGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Get('settings')
  getSettings() {
    return this.importService.getSettings();
  }

  @Put('settings')
  saveSettings(@Body() dto: SaveSettingsDto) {
    return this.importService.saveSettings(dto);
  }

  // ── Google Drive ─────────────────────────────────────────────────────────────

  @Get('drive/auth')
  getDriveAuthUrl() {
    return { url: this.importService.getDriveAuthUrl() };
  }

  @Get('drive/callback')
  @UseGuards() // pas de guard JWT ici — callback OAuth externe
  async handleDriveCallback(@Query('code') code: string) {
    return this.importService.handleDriveCallback(code);
  }

  @Get('drive/files')
  listDriveFiles() {
    return this.importService.listDriveFiles();
  }

  @Get('drive/files/:fileId/content')
  getDriveFileContent(
    @Param('fileId') fileId: string,
    @Query('mimeType') mimeType: string,
  ) {
    return this.importService.getDriveFileContent(
      fileId,
      mimeType ?? 'application/vnd.google-apps.document',
    );
  }

  // ── Confluence ───────────────────────────────────────────────────────────────

  @Get('confluence/pages')
  listConfluencePages() {
    return this.importService.listConfluencePages();
  }

  @Get('confluence/pages/:pageId/content')
  getConfluencePageContent(@Param('pageId') pageId: string) {
    return this.importService.getConfluencePageContent(pageId);
  }

  // ── Analyse & Confirmation ──────────────────────────────────────────────────

  @Post('analyze')
  analyzeDocument(@Body() dto: AnalyzeDocumentDto) {
    return this.importService.analyzeDocument(dto);
  }

  @Post('confirm')
  confirmImport(
    @Body() dto: ConfirmImportDto,
    @Request() req: { user: User },
  ) {
    return this.importService.confirmImport(dto, req.user.id);
  }
}
