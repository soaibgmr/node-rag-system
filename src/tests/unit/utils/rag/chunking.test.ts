import { splitIntoChunks } from '../../../../utils/rag/chunking';

describe('splitIntoChunks', () => {
  it('returns empty array for empty text', () => {
    expect(splitIntoChunks('   ', { chunkSize: 100, chunkOverlap: 10 })).toEqual([]);
  });

  it('splits large text with overlap', () => {
    const text = 'a'.repeat(250);
    const chunks = splitIntoChunks(text, {
      chunkSize: 100,
      chunkOverlap: 20,
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBe(100);
    expect(chunks[1].length).toBe(100);
  });
});
