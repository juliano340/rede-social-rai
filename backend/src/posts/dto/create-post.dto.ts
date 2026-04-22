import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUrl, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ description: 'Conteúdo do post', maxLength: 280, example: 'Olá, mundo!' })
  @IsString()
  @IsNotEmpty({ message: 'Conteúdo é obrigatório' })
  @MaxLength(280, { message: 'Conteúdo deve ter no máximo 280 caracteres' })
  content: string;

  @ApiPropertyOptional({ description: 'URL da mídia (imagem ou YouTube)', maxLength: 500, example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsUrl({}, { message: 'URL da mídia deve ser válida' })
  @MaxLength(500, { message: 'URL da mídia deve ter no máximo 500 caracteres' })
  mediaUrl?: string;

  @ApiPropertyOptional({ description: 'Tipo de mídia', enum: ['image', 'youtube'], example: 'image' })
  @IsOptional()
  @IsIn(['image', 'youtube'], { message: 'Tipo de mídia deve ser "image" ou "youtube"' })
  mediaType?: string;

  @ApiPropertyOptional({ description: 'URL do link', maxLength: 500, example: 'https://example.com' })
  @IsOptional()
  @IsUrl({}, { message: 'URL do link deve ser válida' })
  @MaxLength(500, { message: 'URL do link deve ter no máximo 500 caracteres' })
  linkUrl?: string;
}
