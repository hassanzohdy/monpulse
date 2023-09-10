import { GenericObject } from "@mongez/reinforcements";
import { CollStats, CreateIndexesOptions, ObjectId } from "mongodb";
import { Database } from "../database";

export class Blueprint {
  /**
   * Blueprint Schema
   */
  public schema: GenericObject = {};

  /**
   * Constructor
   */
  public constructor(
    protected readonly collectionName: string,
    protected readonly database: Database = database,
  ) {
    //
  }

  /**
   * Create index
   */
  public async index(
    columns: string | string[],
    options: CreateIndexesOptions = {},
  ) {
    if (!Array.isArray(columns)) {
      columns = [columns];
    }

    if (!options.name) {
      options.name = this.getIndexName(columns);
    }

    const columnsList = columns.reduce(
      (list: GenericObject, column: string) => {
        list[column] = 1;
        return list;
      },
      {},
    );

    return this.collection().createIndex(columnsList, options);
  }

  /**
   * Create unique index
   */
  public async unique(
    column: string | string[],
    options: CreateIndexesOptions = {},
  ) {
    options.unique = true;
    if (!Array.isArray(column)) {
      column = [column];
    }

    if (!options.name) {
      options.name = this.getIndexName(column, "unique");
    }

    return this.index(column, options);
  }

  /**
   * Create text index
   */
  public async textIndex(
    column: string | string[],
    options: CreateIndexesOptions = {},
  ) {
    options.unique = true;

    if (!Array.isArray(column)) {
      column = [column];
    }

    if (!options.name) {
      options.name = this.getIndexName(column, "text");
    }

    const columnsList = column.reduce((list: GenericObject, column: string) => {
      list[column] = "text";
      return list;
    }, {});

    return this.collection().createIndex(columnsList, options);
  }

  /**
   * Create geo index
   */
  public async geoIndex(
    column: string | string[],
    options: CreateIndexesOptions = {},
  ) {
    options.unique = true;

    if (!Array.isArray(column)) {
      column = [column];
    }

    if (!options.name) {
      options.name = this.getIndexName(column, "geo");
    }

    const columnsList = column.reduce((list: GenericObject, column: string) => {
      list[column] = "2dsphere";
      return list;
    }, {});

    return this.collection().createIndex(columnsList, options);
  }

  /**
   * List indexes
   */
  public async listIndexes() {
    return await this.collection().listIndexes().toArray();
  }

  /**
   * Drop index
   */
  public async dropIndex(...columns: string[]) {
    const name = this.getIndexName(columns);
    return await this.collection().dropIndex(name);
  }

  /**
   * Drop unique index
   */
  public async dropUniqueIndex(...columns: string[]) {
    const name = this.getIndexName(columns, "unique");
    return await this.collection().dropIndex(name);
  }

  /**
   * Drop text index
   */
  public async dropTextIndex(...columns: string[]) {
    const name = this.getIndexName(columns, "text");
    return await this.collection().dropIndex(name);
  }

  /**
   * Drop geo index
   */
  public async dropGeoIndex(...columns: string[]) {
    const name = this.getIndexName(columns, "geo");
    return await this.collection().dropIndex(name);
  }

  /**
   * Drop all indexes
   */
  public async dropAllIndexes() {
    return await this.collection().dropIndexes();
  }

  /**
   * Check if index exists
   */
  public async indexExists(name: string) {
    return await this.collection().indexExists(name);
  }

  /**
   * Get index name
   */
  public getIndexName(columns: string[], type = "index") {
    return `${this.collectionName}_${columns.join("_")}_${type}`;
  }

  /**
   * Get index info
   */
  public async indexInformation() {
    return await this.collection().indexInformation();
  }

  /**
   * Get collection stats
   */
  public async stats(withLatencyStats = true) {
    // because stats method is deprecated
    // we need to use the aggregate method with $collStats pipeline
    const pipelineOptions: GenericObject = {
      storageStats: {},
    };

    if (withLatencyStats) {
      pipelineOptions["latencyStats"] = {
        histograms: ["queryExecutor", "getmore", "commands"],
        lastBucketSample: {},
      };
    }

    return (
      await this.collection()
        .aggregate([
          {
            $collStats: pipelineOptions,
          },
        ])
        .toArray()
    )[0] as CollStats;
  }

  /**
   * Get collection size in bytes
   */
  public async size() {
    const stats = await this.stats(false);
    return stats.storageSize;
  }

  /**
   * Get average document size in bytes
   */
  public async averageDocumentSize() {
    const stats = await this.stats(false);
    return stats.avgObjSize;
  }

  /**
   * @alias averageDocumentSize
   */
  public async avgDocSize() {
    return await this.averageDocumentSize();
  }

  /**
   * Get total indexes size in bytes
   */
  public async indexesSize() {
    const stats = await this.stats(false);
    return stats.totalIndexSize;
  }

  /**
   * Total size = collection size + indexes size
   */
  public async totalSize() {
    const stats = await this.stats(false);
    return stats.totalSize;
  }

  /**
   * Count documents
   */
  public async count() {
    return await this.collection().countDocuments();
  }

  /**
   * Delete all documents
   */
  public async truncate() {
    return await this.collection().deleteMany({});
  }

  /**
   * Drop collection
   */
  public async drop() {
    return await this.collection().drop();
  }

  /**
   * Get collection instance
   */
  public collection() {
    return this.database.collection(this.collectionName);
  }

  /**
   * Rename collection to the given name
   */
  public async rename(newName: string) {
    return await this.collection().rename(newName);
  }

  /**
   * Get base schema
   */
  public get baseSchema() {
    return {
      _id: ObjectId,
      id: "int",
      createdAt: Date,
      updatedAt: Date,
    };
  }

  /**
   * Get default schema
   */
  public baseSchemaWith(schema: GenericObject) {
    return {
      ...this.baseSchema,
      ...schema,
    };
  }
}

/**
 * Get a blueprint class for the given collection
 */
export function blueprint(collectionName: string) {
  return new Blueprint(collectionName);
}
