import { injectable } from 'inversify';
import { DocumentExtractionService } from './ingestion.service';
import { ExtractedDocument } from './rag.types';
import { BadRequestError, ErrorCode } from '../../utils/errors';

@injectable()
export class BasicDocumentExtractionService extends DocumentExtractionService {
  async extractTextFromDocument(base64Content: string, mimeType?: string): Promise<ExtractedDocument> {
    const supported = ['text/plain', 'application/json'];

    if (mimeType && !supported.includes(mimeType)) {
      throw new BadRequestError('Document extraction currently supports text/plain and application/json only', ErrorCode.INVALID_INPUT);
    }

    const buffer = Buffer.from(base64Content, 'base64');
    const text = buffer.toString('utf-8').trim();

    if (!text) {
      throw new BadRequestError('Decoded document content is empty', ErrorCode.INVALID_INPUT);
    }

    return {
      text,
    };
  }
}
