import { ILlmService, ChatCompletionRequest, ChatCompletionResponse } from './rag.types';

export abstract class LlmService implements ILlmService {
  abstract chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
}
