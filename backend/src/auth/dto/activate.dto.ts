import { IsString, IsUUID, MinLength } from 'class-validator';

export class ActivateDto {
  @IsUUID()
  token: string;

  @IsString()
  @MinLength(8)
  password: string;
}
