import { injectable } from 'inversify';
import { UrlIngestionService } from './ingestion.service';
import { UrlScrapeResult } from './rag.types';
import { BadRequestError, ErrorCode, InternalServerError } from '../../utils/errors';

@injectable()
export class SimpleUrlIngestionService extends UrlIngestionService {
  async scrape(url: string): Promise<UrlScrapeResult> {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new BadRequestError('URL must use http or https', ErrorCode.INVALID_INPUT);
      }

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'node-rag-system-bot/1.0',
        },
      });

      if (!res.ok) {
        throw new InternalServerError(`Failed to scrape URL with status ${res.status}`, ErrorCode.INTERNAL_ERROR);
      }

      const html = await res.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch?.[1]?.trim();

      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return {
        url,
        title,
        text,
      };
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof InternalServerError) {
        throw error;
      }
      throw new InternalServerError('Failed to scrape URL content', ErrorCode.INTERNAL_ERROR);
    }
  }
}
