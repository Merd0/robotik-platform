export const MAX_CODE_RUNTIME_MS = 8_000;
export const MAX_OUTPUT_BYTES = 64 * 1024;
export const MAX_OUTPUT_EMISSIONS = 100;
export const MAX_JOINT_TRACE = 500;

export class BoundedTextCollector {
  private readonly chunks: string[] = [];
  private byteCount = 0;
  emissions = 0;
  truncated = false;

  constructor(
    private readonly maxBytes = MAX_OUTPUT_BYTES,
    private readonly maxEmissions = MAX_OUTPUT_EMISSIONS,
  ) {}

  push(value: string): void {
    if (this.emissions >= this.maxEmissions || this.byteCount >= this.maxBytes) {
      this.truncated = true;
      return;
    }
    this.emissions++;
    const encoded = new TextEncoder().encode(value);
    const remaining = this.maxBytes - this.byteCount;
    if (encoded.byteLength > remaining) {
      this.chunks.push(new TextDecoder().decode(encoded.slice(0, remaining)));
      this.byteCount = this.maxBytes;
      this.truncated = true;
      return;
    }
    this.chunks.push(value);
    this.byteCount += encoded.byteLength;
  }

  toString(): string {
    return this.chunks.join("\n");
  }
}

export class BoundedTraceCollector<T> {
  readonly values: T[] = [];
  truncated = false;

  constructor(private readonly maxItems = MAX_JOINT_TRACE) {}

  push(value: T): void {
    if (this.values.length >= this.maxItems) {
      this.truncated = true;
      return;
    }
    this.values.push(value);
  }
}
