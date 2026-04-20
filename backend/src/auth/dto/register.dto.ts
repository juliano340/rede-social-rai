import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Username deve ter no mínimo 3 caracteres' })
  @MaxLength(20, { message: 'Username deve ter no máximo 20 caracteres' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username só pode ter letras, números e underscore' })
  username: string;

  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  @MaxLength(50, { message: 'Senha deve ter no máximo 50 caracteres' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(25, { message: 'Nome deve ter no máximo 25 caracteres' })
  name: string;
}
