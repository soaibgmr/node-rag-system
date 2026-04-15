export interface RetrievedContextItem {
  sourceTitle: string;
  sourceType: string;
  content: string;
  score: number;
}

export interface ConversationTurn {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
}

export const buildSystemPrompt = (): string => {
  return [
    'You are a helpful assistant for a specific chatbot knowledge base.',
    'Only use the provided context to answer the user question.',
    'If the context is insufficient, say you do not have enough information.',
    'Keep answers concise and factual.',
  ].join(' ');
};

export const buildUserPrompt = (question: string, contextItems: RetrievedContextItem[], history: ConversationTurn[] = []): string => {
  const conversationHistory = history
    .map((turn) => `${turn.role}: ${turn.content}`)
    .join('\n');

  const context = contextItems
    .map((item, index) => {
      return `Source ${index + 1} (${item.sourceType} - ${item.sourceTitle}, score=${item.score.toFixed(4)}):\n${item.content}`;
    })
    .join('\n\n');

  return [
    'Recent conversation:',
    conversationHistory || 'No prior messages.',
    '',
    'Context:',
    context || 'No context available.',
    '',
    `Question: ${question}`,
    'Answer with references to the relevant source numbers when possible.',
  ].join('\n');
};
