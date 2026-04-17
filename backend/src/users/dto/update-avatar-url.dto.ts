import { IsString, IsUrl, IsNotEmpty } from 'class-validator';

export class UpdateAvatarUrlDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  url: string;
}