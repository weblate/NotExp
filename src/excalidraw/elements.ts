import { generateKeyBetween } from "@excalidraw/fractional-indexing";
import { FractionalIndex } from "@excalidraw/element/types";

export type IDGenerator = Generator<never, string, unknown>;

export function generateId(): string {
  const id = crypto.randomUUID();
  return id.slice(24, 32) + id.slice(0, 13);
}

export function getNonce() {
  return Number(String(Math.random()).replace(".", "").slice(0, 11));
}

export class IndexGenerator {
  private last_index: FractionalIndex | undefined;

  next(): FractionalIndex {
    this.last_index = generateKeyBetween(
      this.last_index ?? null,
      null,
    ) as FractionalIndex;
    return this.last_index;
  }
}
