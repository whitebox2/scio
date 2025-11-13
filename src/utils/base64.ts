import { Buffer } from "node:buffer";

const hasWindowBase64 = typeof globalThis.btoa === "function" && typeof globalThis.atob === "function";

export function encodeBase64(bytes: Uint8Array): string {
  if (hasWindowBase64) {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return globalThis.btoa(binary);
  }
  return Buffer.from(bytes).toString("base64");
}

export function decodeBase64(value: string): Uint8Array {
  if (!value) {
    return new Uint8Array();
  }
  if (hasWindowBase64) {
    const binary = globalThis.atob(value);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(value, "base64"));
}
