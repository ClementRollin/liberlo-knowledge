import { IsString, MinLength, IsOptional } from 'class-validator';

export class SearchDto {
  @IsString()
  @MinLength(1)
  query: string;

  @IsOptional()
  @IsString()
  serviceSlug?: string;
}
