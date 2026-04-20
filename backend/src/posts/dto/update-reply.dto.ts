import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateReplyDto {
  @IsString()
  @IsNotEmpty({ message: 'Conteúdo é obrigatório' })
  @MaxLength(280, { message: 'Conteúdo deve ter no máximo 280 caracteres' })
  content: string;
}
