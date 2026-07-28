import { IsIn, IsString, MaxLength } from 'class-validator';

const TYPES = ['password', 'note', 'card'] as const;

export class UpsertVaultItemDto {
  @IsIn(TYPES)
  type!: (typeof TYPES)[number];

  // Opaque AEAD ciphertext of the whole item (incl. metadata). Server never reads it.
  @IsString()
  @MaxLength(200_000)
  ciphertext!: string;

  @IsString()
  @MaxLength(1000)
  nonce!: string;
}
