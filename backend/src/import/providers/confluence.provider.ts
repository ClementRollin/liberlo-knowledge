import { Injectable } from '@nestjs/common';

export interface ConfluencePage {
  id: string;
  title: string;
  spaceKey: string;
  webUrl: string;
  lastModified: string;
}

@Injectable()
export class ConfluenceProvider {
  async listPages(
    baseUrl: string,
    email: string,
    token: string,
    spaceKey?: string,
  ): Promise<ConfluencePage[]> {
    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const params = new URLSearchParams({ limit: '50', 'body-format': 'storage' });
    if (spaceKey) params.set('space-key', spaceKey);

    const res = await fetch(
      `${baseUrl}/wiki/api/v2/pages?${params.toString()}`,
      { headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' } },
    );

    if (!res.ok) {
      throw new Error(`Confluence API error: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as {
      results: {
        id: string;
        title: string;
        spaceId: string;
        _links: { webui: string };
        version: { createdAt: string };
      }[];
    };

    return data.results.map((p) => ({
      id: p.id,
      title: p.title,
      spaceKey: p.spaceId,
      webUrl: `${baseUrl}${p._links.webui}`,
      lastModified: p.version?.createdAt ?? '',
    }));
  }

  async getPageContent(
    baseUrl: string,
    email: string,
    token: string,
    pageId: string,
  ): Promise<string> {
    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const res = await fetch(
      `${baseUrl}/wiki/api/v2/pages/${pageId}?body-format=storage`,
      { headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' } },
    );

    if (!res.ok) {
      throw new Error(`Confluence API error: ${res.status}`);
    }

    const data = (await res.json()) as {
      body: { storage: { value: string } };
    };

    return this.confluenceStorageToMarkdown(data.body.storage.value);
  }

  private confluenceStorageToMarkdown(html: string): string {
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<ul[^>]*>/gi, '')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '')
      .replace(/<\/ol>/gi, '\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
