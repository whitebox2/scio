import { createHmac, randomBytes } from "node:crypto";

const BASE62_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const DEV_SECRET = "scio-dev-secret";
const DEFAULT_URL_ID_LENGTH = 12;

export interface UrlIdOptions {
  secret?: string;
  length?: number;
}

export function encodeBase62(bytes: Uint8Array): string {
  if (bytes.length === 0) {
    return "";
  }
  const alphabetLength = BASE62_ALPHABET.length;
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) + BigInt(byte);
  }
  if (value === 0n) {
    return BASE62_ALPHABET[0] ?? "0";
  }
  let output = "";
  while (value > 0n) {
    const remainder = Number(value % BigInt(alphabetLength));
    output = `${BASE62_ALPHABET[remainder] ?? "0"}${output}`;
    value /= BigInt(alphabetLength);
  }
  return output;
}

export function generateRandomUrlId(length = DEFAULT_URL_ID_LENGTH): string {
  const bytesNeeded = Math.ceil((length * Math.log(62)) / Math.log(256));
  const entropy = randomBytes(Math.max(bytesNeeded, 9));
  const encoded = encodeBase62(entropy);
  return encoded.slice(0, length);
}

export function deterministicUrlId(input: string, options?: UrlIdOptions): string {
  if (!input) {
    throw new Error("deterministicUrlId input is required");
  }
  const secret = readUrlIdSecret(options?.secret);
  const hmac = createHmac("sha256", secret);
  hmac.update(input);
  const digest = hmac.digest();
  const encoded = encodeBase62(digest);
  const length = Math.max(options?.length ?? DEFAULT_URL_ID_LENGTH, 8);
  return encoded.slice(0, length);
}

export function readUrlIdSecret(override?: string): string {
  if (override && override.length >= 12) {
    return override;
  }
  const envSecret = process.env.SCIO_URL_ID_SECRET;
  if (envSecret && envSecret.length >= 12) {
    return envSecret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("SCIO_URL_ID_SECRET must be set in production environments");
  }
  return DEV_SECRET;
}
