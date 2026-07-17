import { IsBase64, IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email!: string;

  /** base64 auth_key derived client-side via Argon2id — never the password. */
  @IsString()
  authKey!: string;

  /** Argon2id salt (base64) the client used; stored for future logins. */
  @IsString()
  salt!: string;

  /** X25519 public key (base64) for document-share wrapping. */
  @IsString()
  publicKey!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  authKey!: string;

  @IsOptional()
  @IsString()
  @Length(6, 8)
  totp?: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}
