import { enforceTagList, TagValidationError, type TagPolicyOptions } from "~/utils/tags";

export class PolicyError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "PolicyError";
  }
}

export interface TagPolicyInput extends TagPolicyOptions {
  tags: unknown;
}

export interface PayloadLimitOptions {
  maxBytes?: number;
  context?: string;
}

export const DEFAULT_TAG_POLICY: TagPolicyOptions = {
  maxTags: 20,
};

export const DEFAULT_CRDT_PUSH_LIMIT_BYTES = 512_000;
export const DEFAULT_CRDT_PULL_LIMIT_BYTES = 512_000;

export function enforceTagPolicy(input: TagPolicyInput): string[] {
  try {
    return enforceTagList(input.tags, {
      maxTags: input.maxTags ?? DEFAULT_TAG_POLICY.maxTags,
    });
  } catch (error) {
    if (error instanceof TagValidationError) {
      throw new PolicyError("Tag policy violation", 400, "invalid_tags", { violations: error.violations });
    }
    throw error;
  }
}

export function ensurePayloadLimit(bytes: number, options?: PayloadLimitOptions): void {
  const maxBytes = options?.maxBytes ?? DEFAULT_CRDT_PUSH_LIMIT_BYTES;
  if (bytes > maxBytes) {
    throw new PolicyError(
      `${options?.context ?? "payload"} exceeds ${maxBytes} bytes`,
      413,
      "payload_too_large",
      { maxBytes, actual: bytes },
    );
  }
}
