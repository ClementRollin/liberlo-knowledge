import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink: string;
}

@Injectable()
export class GoogleDriveProvider {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(private readonly config: ConfigService) {
    this.clientId = this.config.get<string>('GOOGLE_CLIENT_ID', '');
    this.clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET', '');
    this.redirectUri = this.config.get<string>(
      'GOOGLE_REDIRECT_URI',
      'http://localhost:3001/api/import/drive/callback',
    );
  }

  getAuthUrl(): string {
    const oauth2 = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    );
    return oauth2.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.readonly'],
      prompt: 'consent',
    });
  }

  async exchangeCode(
    code: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiry: Date }> {
    const oauth2 = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    );
    const { tokens } = await oauth2.getToken(code);
    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiry: new Date(tokens.expiry_date!),
    };
  }

  async listFiles(
    accessToken: string,
    refreshToken: string,
  ): Promise<DriveFile[]> {
    const oauth2 = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    );
    oauth2.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const drive = google.drive({ version: 'v3', auth: oauth2 });
    const res = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.document' or mimeType='text/plain' or mimeType='text/markdown'",
      fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
      pageSize: 50,
      orderBy: 'modifiedTime desc',
    });

    return (res.data.files ?? []) as DriveFile[];
  }

  async exportAsText(
    fileId: string,
    mimeType: string,
    accessToken: string,
    refreshToken: string,
  ): Promise<string> {
    const oauth2 = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    );
    oauth2.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const drive = google.drive({ version: 'v3', auth: oauth2 });

    if (mimeType === 'application/vnd.google-apps.document') {
      const res = await drive.files.export(
        { fileId, mimeType: 'text/plain' },
        { responseType: 'text' },
      );
      return res.data as string;
    }

    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'text' },
    );
    return res.data as string;
  }
}
