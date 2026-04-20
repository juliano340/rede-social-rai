import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class CreateReplyDto {
  @IsString()
  @IsNotEmpty({ message: 'Conteúdo é obrigatório' })
  @MaxLength(280, { message: 'Conteúdo deve ter no máximo 280 caracteres' })
  content: string;

  @IsOptional()
  @IsUUID('4', { message: 'ID do reply pai deve ser um UUID válido' })
  parentId?: string;
}
