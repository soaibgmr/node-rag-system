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
    'You are a helpful, accurate, and polite assistant for a chatbot that answers using a specific knowledge base.',
    'For greetings, pleasantries, thanks, farewells, and simple conversational messages such as "hi", "hello", "hey", "thanks", or "bye", respond naturally and politely even when no context is provided.',
    'For knowledge-based or factual questions, use the provided context as the primary source of truth.',
    'If the answer is clearly supported by the provided context, answer accurately and concisely.',
    'If the context is partially relevant but incomplete, answer only what is supported by the context and clearly mention that full information is not available.',
    'If the context is insufficient for a knowledge-based question, say exactly: "I do not have enough information from the provided knowledge base."',
    'Do not invent facts, policies, pricing, technical details, procedures, or any other information that is not supported by the context.',
    'Use the recent conversation history to understand follow-up questions, references, and user intent.',
    'Keep answers clear, concise, factual, friendly, and professional.',
    'For greetings and casual conversation, do not mention missing context, knowledge base limitations, or sources.',
    'For knowledge-based answers, reference relevant source numbers like [Source 1] or [Source 2] when possible.',
  ].join(' ');
};

export const buildUserPrompt = (
  question: string,
  contextItems: RetrievedContextItem[],
  history: ConversationTurn[] = []
): string => {
  const conversationHistory = history.length
    ? history.map((turn) => `${turn.role}: ${turn.content}`).join('\n')
    : 'No prior messages.';

  const context = contextItems.length
    ? contextItems
        .map((item, index) => {
          return `Source ${index + 1} (${item.sourceType} - ${item.sourceTitle}, score=${item.score.toFixed(4)}):\n${item.content}`;
        })
        .join('\n\n')
    : 'No context available.';

  return [
    'Recent conversation:',
    conversationHistory,
    '',
    'Retrieved knowledge base context:',
    context,
    '',
    `Current user message: ${question}`,
    '',
    'Instructions:',
    '- If the current user message is a greeting, thanks, farewell, or simple conversational message, reply naturally and politely.',
    '- If it is a knowledge-based question, answer using only the retrieved knowledge base context.',
    '- If the context is insufficient for a knowledge-based question, say exactly: "I do not have enough information from the provided knowledge base."',
    '- Answer concisely and factually.',
    '- Reference relevant source numbers when possible for knowledge-based answers.',
    '- Do not mention sources for greetings, thanks, farewells, or casual conversation.',
  ].join('\n');
};