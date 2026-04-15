export interface ChunkingOptions {
  chunkSize: number;
  chunkOverlap: number;
}

export const splitIntoChunks = (text: string, options: ChunkingOptions): string[] => {
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return [];
  }

  const chunks: string[] = [];
  const { chunkSize, chunkOverlap } = options;

  if (chunkSize <= 0) {
    return [normalized];
  }

  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    const chunk = normalized.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(0, end - Math.max(0, chunkOverlap));
  }

  return chunks;
};
