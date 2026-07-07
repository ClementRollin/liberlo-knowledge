import { IsOptional, IsString, IsUrl } from 'class-validator';

export class SaveSettingsDto {
  @IsOptional()
  @IsString()
  @IsUrl()
  confluenceBaseUrl?: string;

  @IsOptional()
  @IsString()
  confluenceEmail?: string;

  @IsOptional()
  @IsString()
  confluenceToken?: string;
}
