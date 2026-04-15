import { injectable } from 'inversify';
import { VectorStoreService } from './vector-store.service';
import { DeleteVectorsOptions, QueryVectorsOptions, UpsertVectorsOptions, VectorMatch } from './rag.types';
import appConfig from '../../config/app.config';
import { InternalServerError, ServiceUnavailableError, ErrorCode } from '../../utils/errors';

interface PineconeSearchHit {
  _id?: string;
  id?: string;
  score?: number;
  fields?: Record<string, unknown>;
}

interface PineconeSearchResponse {
  result?: {
    hits?: PineconeSearchHit[];
  };
}

@injectable()
export class PineconeVectorStoreService extends VectorStoreService {
  private readonly apiKey: string | undefined;
  private readonly indexHost: string | undefined;
  private readonly textField: string;
  private readonly apiVersion: string;

  constructor() {
    super();
    this.apiKey = appConfig.rag.pinecone.apiKey;
    this.indexHost = appConfig.rag.pinecone.indexHost;
    this.textField = appConfig.rag.pinecone.textField;
    this.apiVersion = appConfig.rag.pinecone.apiVersion;
  }

  async upsertVectors(options: UpsertVectorsOptions): Promise<void> {
    if (options.records && options.records.length > 0) {
      if (!this.apiKey || !this.indexHost) {
        throw new ServiceUnavailableError('Pinecone is not configured', ErrorCode.SERVICE_UNAVAILABLE);
      }

      const ndjson = options.records
        .map((record) =>
          JSON.stringify({
            _id: record.id,
            [this.textField]: record.text,
            ...(record.metadata ?? {}),
          })
        )
        .join('\n');

      const res = await fetch(`https://${this.indexHost}/records/namespaces/${encodeURIComponent(options.namespace)}/upsert`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'X-Pinecone-Api-Version': this.apiVersion,
          'Content-Type': 'application/x-ndjson',
        },
        body: ndjson,
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new InternalServerError(`Pinecone request failed: ${res.status} ${errBody}`, ErrorCode.INTERNAL_ERROR);
      }

      return;
    }

    await this.request('/vectors/upsert', {
      method: 'POST',
      body: {
        namespace: options.namespace,
        vectors: options.vectors,
      },
    });
  }

  async queryVectors(options: QueryVectorsOptions): Promise<VectorMatch[]> {
    if (options.text && options.text.trim().length > 0) {
      const response = (await this.request(`/records/namespaces/${encodeURIComponent(options.namespace)}/search`, {
        method: 'POST',
        body: {
          query: {
            top_k: options.topK,
            inputs: {
              text: options.text,
            },
            filter: options.filter,
          },
        },
      })) as PineconeSearchResponse;

      const hits = response.result?.hits ?? [];
      return hits.map((hit) => ({
        id: String(hit._id ?? hit.id ?? ''),
        score: typeof hit.score === 'number' ? hit.score : 0,
        metadata: hit.fields ?? {},
      }));
    }

    if (!options.vector || options.vector.length === 0) {
      throw new InternalServerError('Pinecone query requires either text or vector', ErrorCode.INTERNAL_ERROR);
    }

    const response = await this.request('/query', {
      method: 'POST',
      body: {
        namespace: options.namespace,
        vector: options.vector,
        topK: options.topK,
        includeMetadata: true,
        filter: options.filter,
      },
    });

    return (response.matches ?? []) as VectorMatch[];
  }

  async deleteVectors(options: DeleteVectorsOptions): Promise<void> {
    await this.request('/vectors/delete', {
      method: 'POST',
      body: {
        namespace: options.namespace,
        ids: options.ids,
        deleteAll: options.deleteAll,
      },
    });
  }

  private async request(path: string, payload: { method: string; body?: Record<string, unknown> }): Promise<Record<string, unknown>> {
    if (!this.apiKey || !this.indexHost) {
      throw new ServiceUnavailableError('Pinecone is not configured', ErrorCode.SERVICE_UNAVAILABLE);
    }

    const res = await fetch(`https://${this.indexHost}${path}`, {
      method: payload.method,
      headers: {
        'Api-Key': this.apiKey,
        'X-Pinecone-Api-Version': this.apiVersion,
        'Content-Type': 'application/json',
      },
      body: payload.body ? JSON.stringify(payload.body) : undefined,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new InternalServerError(`Pinecone request failed: ${res.status} ${errBody}`, ErrorCode.INTERNAL_ERROR);
    }

    if (res.status === 204) {
      return {};
    }

    return (await res.json()) as Record<string, unknown>;
  }
}
