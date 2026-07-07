import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AnalyzeDocumentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  sourceUrl?: string;
}
