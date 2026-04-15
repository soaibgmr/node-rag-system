import { IVectorStoreService, UpsertVectorsOptions, QueryVectorsOptions, VectorMatch, DeleteVectorsOptions } from './rag.types';

export abstract class VectorStoreService implements IVectorStoreService {
  abstract upsertVectors(options: UpsertVectorsOptions): Promise<void>;
  abstract queryVectors(options: QueryVectorsOptions): Promise<VectorMatch[]>;
  abstract deleteVectors(options: DeleteVectorsOptions): Promise<void>;
}
