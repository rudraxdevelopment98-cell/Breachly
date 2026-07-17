import { sodium } from './sodium';

/** base64 (URL-safe, no padding) helpers — safe for transport + storage. */
export function toBase64(bytes: Uint8Array): string {
  return sodium().to_base64(bytes, sodium().base64_variants.URLSAFE_NO_PADDING);
}

export function fromBase64(b64: string): Uint8Array {
  return sodium().from_base64(b64, sodium().base64_variants.URLSAFE_NO_PADDING);
}

export function toHex(bytes: Uint8Array): string {
  return sodium().to_hex(bytes);
}

export function fromHex(hex: string): Uint8Array {
  return sodium().from_hex(hex);
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function utf8ToBytes(text: string): Uint8Array {
  return encoder.encode(text);
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return decoder.decode(bytes);
}
