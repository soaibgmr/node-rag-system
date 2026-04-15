import { IDocumentExtractionService, IUrlIngestionService, UrlScrapeResult, ExtractedDocument } from './rag.types';

export abstract class UrlIngestionService implements IUrlIngestionService {
  abstract scrape(url: string): Promise<UrlScrapeResult>;
}

export abstract class DocumentExtractionService implements IDocumentExtractionService {
  abstract extractTextFromDocument(base64Content: string, mimeType?: string): Promise<ExtractedDocument>;
}
