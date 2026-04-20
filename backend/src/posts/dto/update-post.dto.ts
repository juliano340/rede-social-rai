import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUrl, IsIn } from 'class-validator';

export class UpdatePostDto {
  @IsString()
  @IsNotEmpty({ message: 'Conteúdo é obrigatório' })
  @MaxLength(280, { message: 'Conteúdo deve ter no máximo 280 caracteres' })
  content: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL da mídia deve ser válida' })
  @MaxLength(500, { message: 'URL da mídia deve ter no máximo 500 caracteres' })
  mediaUrl?: string | null;

  @IsOptional()
  @IsIn(['image', 'youtube', null], { message: 'Tipo de mídia deve ser "image" ou "youtube"' })
  mediaType?: string | null;

  @IsOptional()
  @IsUrl({}, { message: 'URL do link deve ser válida' })
  @MaxLength(500, { message: 'URL do link deve ter no máximo 500 caracteres' })
  linkUrl?: string | null;
}
