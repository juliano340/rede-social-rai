import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUrl, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiProperty({ description: 'Conteúdo do post', maxLength: 280, example: 'Conteúdo atualizado' })
  @IsString()
  @IsNotEmpty({ message: 'Conteúdo é obrigatório' })
  @MaxLength(280, { message: 'Conteúdo deve ter no máximo 280 caracteres' })
  content: string;

  @ApiPropertyOptional({ description: 'URL da mídia', maxLength: 500, example: 'https://example.com/image.jpg', nullable: true })
  @IsOptional()
  @IsUrl({}, { message: 'URL da mídia deve ser válida' })
  @MaxLength(500, { message: 'URL da mídia deve ter no máximo 500 caracteres' })
  mediaUrl?: string | null;

  @ApiPropertyOptional({ description: 'Tipo de mídia', enum: ['image', 'youtube'], example: 'image', nullable: true })
  @IsOptional()
  @IsIn(['image', 'youtube', null], { message: 'Tipo de mídia deve ser "image" ou "youtube"' })
  mediaType?: string | null;

  @ApiPropertyOptional({ description: 'URL do link', maxLength: 500, example: 'https://example.com', nullable: true })
  @IsOptional()
  @IsUrl({}, { message: 'URL do link deve ser válida' })
  @MaxLength(500, { message: 'URL do link deve ter no máximo 500 caracteres' })
  linkUrl?: string | null;
}
