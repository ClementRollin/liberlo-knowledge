import { Module } from '@nestjs/common';
import { EmbeddingModule } from '../embedding/embedding.module';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { GoogleDriveProvider } from './providers/google-drive.provider';
import { ConfluenceProvider } from './providers/confluence.provider';

@Module({
  imports: [EmbeddingModule],
  controllers: [ImportController],
  providers: [ImportService, GoogleDriveProvider, ConfluenceProvider],
})
export class ImportModule {}
