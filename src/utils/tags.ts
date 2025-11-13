export const TAG_MIN_LENGTH = 2;
export const TAG_MAX_LENGTH = 32;
export const TAG_MAX_COUNT = 20;
const ASCII_LOWER_A = 97;
const ASCII_LOWER_Z = 122;
const BODY_PATTERN = /^[a-z0-9][a-z0-9/_-]*$/u;

export type TagViolation =
  | "empty"
  | "leading_char"
  | "chars"
  | "length"
  | "duplicate"
  | "count";

export interface TagPolicyOptions {
  maxTags?: number;
}

export class TagValidationError extends Error {
  constructor(message: string, public readonly violations: TagViolation[]) {
    super(message);
    this.name = "TagValidationError";
  }
}

export function normalizeTag(raw: string): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) {
    throw new TagValidationError("Tag cannot be empty", ["empty"]);
  }
  const first = trimmed.codePointAt(0);
  if (!first || first < ASCII_LOWER_A || first > ASCII_LOWER_Z) {
    throw new TagValidationError("Tag must start with a lowercase ASCII letter", ["leading_char"]);
  }
  const normalized = trimmed.normalize("NFKC").toLocaleLowerCase("en-US");
  if (normalized.length < TAG_MIN_LENGTH || normalized.length > TAG_MAX_LENGTH) {
    throw new TagValidationError("Tag must be between 2 and 32 characters", ["length"]);
  }
  if (!BODY_PATTERN.test(normalized)) {
    throw new TagValidationError("Tag contains unsupported characters", ["chars"]);
  }
  return normalized;
}

export function enforceTagList(input: unknown, options?: TagPolicyOptions): string[] {
  const list = coerceTagArray(input);
  const seen = new Set<string>();
  const normalized: string[] = [];
  const max = options?.maxTags ?? TAG_MAX_COUNT;
  for (const raw of list) {
    const safe = normalizeTag(raw);
    if (seen.has(safe)) {
      throw new TagValidationError("Duplicate tags are not allowed", ["duplicate"]);
    }
    normalized.push(safe);
    seen.add(safe);
    if (normalized.length > max) {
      throw new TagValidationError(`Too many tags. Maximum allowed is ${max}`, ["count"]);
    }
  }
  return normalized;
}

export function stringifyTags(tags: string[]): string {
  return tags.map((tag) => tag.trim()).filter(Boolean).join(", ");
}

function coerceTagArray(input: unknown): string[] {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input.filter((value): value is string => typeof value === "string");
  }
  if (typeof input === "string") {
    return input.split(",").map((value) => value.trim()).filter(Boolean);
  }
  if (isPlainObject(input)) {
    return Object.values(input)
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);
  }
  return [];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
