import { injectable } from 'inversify';
import { LlmService } from './llm.service';
import { ChatCompletionRequest, ChatCompletionResponse } from './rag.types';
import appConfig from '../../config/app.config';
import { InternalServerError, ServiceUnavailableError, ErrorCode } from '../../utils/errors';

interface GroqChatChoice {
  message?: {
    content?: string;
  };
}

interface GroqUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

interface GroqChatResponse {
  choices?: GroqChatChoice[];
  usage?: GroqUsage;
}

@injectable()
export class GroqLlmService extends LlmService {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;

  constructor() {
    super();
    this.apiKey = appConfig.rag.groq.apiKey;
    this.baseUrl = appConfig.rag.groq.baseUrl;
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new ServiceUnavailableError('Groq API key is not configured', ErrorCode.SERVICE_UNAVAILABLE);
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        messages: [
          {
            role: 'system',
            content: request.systemPrompt,
          },
          {
            role: 'user',
            content: request.userPrompt,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new InternalServerError(`Groq request failed: ${res.status} ${errBody}`, ErrorCode.INTERNAL_ERROR);
    }

    const payload = (await res.json()) as GroqChatResponse;
    const content = payload.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new InternalServerError('Groq response did not include content', ErrorCode.INTERNAL_ERROR);
    }

    return {
      content,
      usage: {
        promptTokens: payload.usage?.prompt_tokens,
        completionTokens: payload.usage?.completion_tokens,
        totalTokens: payload.usage?.total_tokens,
      },
    };
  }
}
