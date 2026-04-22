import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReplyDto {
  @ApiProperty({ description: 'Conteúdo da resposta', maxLength: 280, example: 'Concordo!' })
  @IsString()
  @IsNotEmpty({ message: 'Conteúdo é obrigatório' })
  @MaxLength(280, { message: 'Conteúdo deve ter no máximo 280 caracteres' })
  content: string;

  @ApiPropertyOptional({ description: 'ID do reply pai (para respostas aninhadas)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID('4', { message: 'ID do reply pai deve ser um UUID válido' })
  parentId?: string;
}
