import { buildSystemPrompt, buildUserPrompt } from '../../../../utils/rag/prompt';

describe('rag prompt utilities', () => {
  it('builds a non-empty system prompt', () => {
    const systemPrompt = buildSystemPrompt();
    expect(systemPrompt.length).toBeGreaterThan(20);
  });

  it('includes context and question in user prompt', () => {
    const userPrompt = buildUserPrompt('What is refund policy?', [
      {
        sourceTitle: 'Policy Doc',
        sourceType: 'TEXT',
        content: 'Refunds are supported within 7 days.',
        score: 0.93,
      },
    ]);

    expect(userPrompt).toContain('What is refund policy?');
    expect(userPrompt).toContain('Policy Doc');
    expect(userPrompt).toContain('Refunds are supported within 7 days.');
  });

  it('includes recent conversation history when provided', () => {
    const userPrompt = buildUserPrompt(
      'Can you summarize?',
      [],
      [
        {
          role: 'USER',
          content: 'Hello',
        },
        {
          role: 'ASSISTANT',
          content: 'Hi there',
        },
      ]
    );

    expect(userPrompt).toContain('Recent conversation:');
    expect(userPrompt).toContain('USER: Hello');
    expect(userPrompt).toContain('ASSISTANT: Hi there');
  });
});
