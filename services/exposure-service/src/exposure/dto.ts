import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CheckBreachDto {
  @IsEmail()
  email!: string;

  /** The authenticated user id (set by the BFF/gateway in production). */
  @IsOptional()
  @IsString()
  userId?: string;
}
