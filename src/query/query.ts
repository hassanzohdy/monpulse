import events from "@mongez/events";
import { Random } from "@mongez/reinforcements";
import {
  AggregateOptions,
  ClientSession,
  CountDocumentsOptions,
  ExplainVerbosityLike,
  FindCursor,
  FindOptions,
  UpdateFilter,
  UpdateOptions,
} from "mongodb";
import { database, type Database } from "../database";
import type { Document, Filter, ModelDocument } from "../model/types";
import type {
  CountedEventPayload,
  CountingEventPayload,
  CreatedEventPayload,
  CreatingEventPayload,
  DeletedEventPayload,
  DeletingEventPayload,
  ExplainedEventPayload,
  ExplainingEventPayload,
  FetchedEventPayload,
  FetchingEventPayload,
  ReplacedEventPayload,
  ReplacingEventPayload,
  SavedEventPayload,
  SavingEventPayload,
  UpdatedEventPayload,
  UpdatingEventPayload,
  UpsertedEventPayload,
  UpsertingEventPayload,
} from "./types";

export class Query {
  /**
   * Connection instance
   */
  protected database: Database = database;

  /**
   * class event name
   */
  public eventName = "mongodb.query." + Random.id();

  /**
   * Set the database instance
   */
  public setDatabase(database: Database) {
    this.database = database;

    return this;
  }

  /**
   * Get collection query for the given collection name
   */
  public query(collection: string) {
    return this.database.collection(collection);
  }

  /**
   * Get current active session from database object
   */
  public getCurrentSession() {
    return this.database.getActiveSession()?.session;
  }

  /**
   * Create a new document in the given collection
   */
  public async create(
    collection: string,
    data: Document,
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ) {
    const query = this.query(collection);

    await this.trigger("creating saving", {
      collection,
      data,
      query,
      isMany: false,
    });

    const result = await query.insertOne(data, {
      session,
    });

    const document = {
      ...data,
      _id: result.insertedId,
    } as ModelDocument;

    await this.trigger("created saved", {
      collection,
      document,
      isMany: false,
    });

    return document;
  }

  /**
   * Create many documents in the given collection
   */
  public async createMany(
    collection: string,
    data: Document[],
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ) {
    const query = this.query(collection);

    await this.trigger("creating saving", {
      collection,
      data,
      query,
      isMany: true,
    });

    const result = await query.insertMany(data, {
      session,
    });

    const documents = data.map((data, index) => ({
      ...data,
      _id: result.insertedIds[index],
    }));

    await this.trigger("created saved", {
      collection,
      documents,
      isMany: true,
    });

    return documents;
  }

  /**
   * Update model by the given id
   */
  public async update(
    collection: string,
    filter: Filter,
    data: Document,
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ): Promise<Partial<ModelDocument> | null> {
    // get the query of the current collection
    const query = this.query(collection);

    await this.trigger("updating saving", {
      collection,
      filter,
      data,
      query,
      isMany: false,
    });

    const result = await query.findOneAndUpdate(
      filter,
      {
        $set: data,
      },
      {
        returnDocument: "after",
        session,
      },
    );

    const output = result.ok ? result.value : null;

    await this.trigger("updated saved", {
      collection,
      filter,
      data,
      document: output,
      isMany: false,
    });

    return output;
  }

  /**
   * Update many documents
   */
  public async updateMany(
    collection: string,
    filter: Filter,
    updateOptions: UpdateFilter<Document>,
    options?: UpdateOptions,
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ) {
    const query = this.query(collection);
    if (!options?.session) {
      options = {
        ...options,
        session,
      };
    }

    await this.trigger("updating saving", {
      collection,
      filter,
      updateOptions,
      options,
      query,
      isMany: true,
    });

    const result = await query.updateMany(filter, updateOptions, options);

    await this.trigger("updated saved", {
      collection,
      filter,
      updateOptions,
      options,
      result: result,
      isMany: true,
    });

    return result;
  }

  /**
   * Replace the entire document for the given document id with the given new data
   */
  public async replace(
    collection: string,
    filter: Filter,
    data: Document,
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ): Promise<Partial<ModelDocument> | null> {
    const query = this.query(collection);

    await this.trigger("replacing saving", {
      collection,
      filter,
      data,
      query,
    });

    const result = await query.findOneAndReplace(filter, data, {
      returnDocument: "after",
      session,
    });

    const output = result.ok ? result.value : null;

    await this.trigger("replaced saved", {
      collection,
      filter,
      data,
      output,
    });

    return output;
  }

  /**
   * Find and update the document for the given filter with the given data or create a new document/record
   * if filter has no matching
   */
  public async upsert(
    collection: string,
    filter: Filter,
    data: Document,
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ): Promise<Partial<ModelDocument> | null> {
    // get the query of the current collection
    const query = this.query(collection);

    await this.trigger("upserting saving", {
      collection,
      filter,
      data,
      query,
    });

    // execute the update operation
    const result = await query.findOneAndUpdate(
      filter,
      {
        $set: data,
      },
      {
        returnDocument: "after",
        upsert: true,
        session,
      },
    );

    const output = result.ok ? result.value : null;

    await this.trigger("upserted saved", {
      collection,
      filter,
      data,
      output,
    });

    return output;
  }

  /**
   * Perform a single delete operation for the given collection
   */
  public async deleteOne(
    collection: string,
    filter?: Filter,
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ): Promise<boolean> {
    const query = this.query(collection);

    await this.trigger("deleting", {
      collection,
      filter,
      query,
      isMany: false,
    });

    const result = await query.deleteOne(filter, {
      session,
    });

    const isDeleted = result.deletedCount > 0;

    await this.trigger("deleted", {
      collection,
      filter,
      isDeleted,
      count: result.deletedCount,
      result,
      isMany: false,
    });

    return isDeleted;
  }

  /**
   * Delete multiple documents from the given collection
   */
  public async delete(
    collection: string,
    filter: Filter = {},
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ): Promise<number> {
    const query = this.query(collection);

    await this.trigger("deleting", {
      collection,
      filter,
      query,
      isMany: true,
    });

    const result = await query.deleteMany(filter, {
      session,
    });

    const output = result.deletedCount;

    await this.trigger("deleted", {
      collection,
      filter,
      output,
      result,
      count: result.deletedCount,
      isMany: true,
    });

    return output;
  }

  /**
   * Alias to delete
   */
  public async deleteMany(
    collection: string,
    filter: Filter = {},
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ) {
    return this.delete(collection, filter, { session });
  }

  /**
   * Check if document exists for the given collection with the given filter
   */
  public async exists(
    collection: string,
    filter: Filter = {},
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ) {
    const query = this.query(collection);

    await this.trigger("counting", {
      collection,
      filter,
      query,
    });

    const output = await query.countDocuments(filter, {
      session,
    });

    await this.trigger("counted", {
      collection,
      filter,
      output,
    });

    return output > 0;
  }

  /**
   * Find a single document for the given collection with the given filter
   */
  public async first<T = Document>(
    collection: string,
    filter: Filter = {},
    findOptions?: FindOptions,
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ) {
    const query = this.query(collection);
    if (!findOptions?.session) {
      findOptions = {
        ...findOptions,
        session,
      };
    }

    await this.trigger("fetching", {
      collection,
      filter,
      query,
      findOptions,
      isMany: false,
    });

    const output = await query.findOne<T>(filter, findOptions);

    await this.trigger("fetched", {
      collection,
      filter,
      output,
      isMany: false,
      count: output ? 1 : 0,
    });

    return output;
  }

  /**
   * Find last document for the given collection with the given filter
   */
  public async last(
    collection: string,
    filter: Filter = {},
    options?: FindOptions,
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ) {
    const query = this.query(collection);

    if (!options?.session) {
      options = {
        ...options,
        session,
      };
    }

    await this.trigger("fetching", {
      collection,
      filter,
      query,
      options,
      isMany: false,
    });

    const results = await query
      .find(filter, options)
      .sort({
        id: "desc",
      })
      .limit(1)
      .toArray();

    const output = results.length > 0 ? results[0] : null;

    await this.trigger("fetched", {
      collection,
      filter,
      output,
      isMany: false,
      count: results.length,
    });

    return output;
  }

  /**
   * Find multiple document for the given collection with the given filter
   */
  public async list(
    collection: string,
    filter: Filter = {},
    queryHandler?: (query: FindCursor) => void,
    findOptions?: FindOptions,
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ) {
    const query = this.query(collection);

    if (!findOptions?.session) {
      findOptions = {
        ...findOptions,
        session,
      };
    }

    await this.trigger("fetching", {
      collection,
      filter,
      query,
      findOptions,
      isMany: true,
    });

    const findOperation = query.find(filter, findOptions);

    if (queryHandler) {
      queryHandler(findOperation);
    }

    const documents = await findOperation.toArray();

    await this.trigger(this.eventName + ".fetched", {
      collection,
      filter,
      documents,
      findOptions,
      isMany: true,
      count: documents.length,
    });

    return documents;
  }

  /**
   * Find latest documents for the given collection with the given filter
   */
  public async latest(
    collection: string,
    filter: Filter = {},
    findOptions?: FindOptions,
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ) {
    const query = this.query(collection);

    if (!findOptions?.session) {
      findOptions = {
        ...findOptions,
        session,
      };
    }

    await this.trigger("fetching", {
      collection,
      filter,
      query,
      findOptions,
      isMany: true,
    });

    const documents = await query
      .find(filter, findOptions)
      .sort({
        id: "desc",
      })
      .toArray();

    await this.trigger("fetched", {
      collection,
      filter,
      documents,
      findOptions,
      isMany: true,
      count: documents.length,
    });

    return documents;
  }

  /**
   * Find oldest documents for the given collection with the given filter
   */
  public async oldest(
    collection: string,
    filter: Filter = {},
    findOptions?: FindOptions,
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ) {
    const query = this.query(collection);

    if (!findOptions?.session) {
      findOptions = {
        ...findOptions,
        session,
      };
    }

    await this.trigger("fetching", {
      collection,
      filter,
      query,
      findOptions,
      isMany: true,
    });

    const documents = await query
      .find(filter, findOptions)
      .sort({
        id: "asc",
      })
      .toArray();

    await this.trigger("fetched", {
      collection,
      filter,
      documents,
      findOptions,
      count: documents.length,
      isMany: true,
    });

    return documents;
  }

  /**
   * Get distinct values for the given collection with the given filter
   */
  public async distinct(
    collection: string,
    field: string,
    filter: Filter = {},
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ) {
    const query = this.query(collection);

    await this.trigger("fetching", {
      collection,
      filter,
      query,
      isMany: true,
    });

    const data = await query.distinct(field, filter, {
      session,
    });

    await this.trigger("fetched", {
      collection,
      filter,
      data,
      count: data.length,
      isMany: true,
    });

    return data;
  }

  /**
   * Count documents for the given collection with the given filter
   */
  public async count(
    collection: string,
    filter: Filter = {},
    options?: CountDocumentsOptions,
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ) {
    const query = this.query(collection);

    if (!options?.session) {
      options = {
        ...options,
        session,
      };
    }

    await this.trigger("counting", {
      collection,
      filter,
      query,
    });

    const output = await query.countDocuments(filter, options);

    await this.trigger("counted", {
      collection,
      filter,
      output,
    });

    return output;
  }

  /**
   * Create an explain fetch query
   */
  public async explain(
    collection: string,
    filter: Filter = {},
    findOptions?: FindOptions,
    verbosity?: ExplainVerbosityLike,
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ) {
    const query = this.query(collection);

    if (!findOptions?.session) {
      findOptions = {
        ...findOptions,
        session,
      };
    }

    await this.trigger("explaining", {
      collection,
      filter,
      query,
    });

    const result = await query
      .find(filter, {
        ...(findOptions || {}),
        explain: true,
      })
      .explain(verbosity);

    await this.trigger("explained", {
      collection,
      filter,
      result,
    });

    return result;
  }

  /**
   * Create aggregate query
   */
  public async aggregate(
    collection: string,
    pipeline: Document[],
    options?: AggregateOptions,
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ) {
    const query = this.query(collection);

    if (!options?.session) {
      options = {
        ...options,
        session,
      };
    }

    await this.trigger("aggregating", {
      collection,
      pipeline,
      options,
      query,
    });

    const aggregate = await query.aggregate(pipeline, options);

    await this.trigger("aggregated", {
      collection,
      pipeline,
      options,
      aggregate,
    });

    return aggregate;
  }

  /**
   * Trigger event
   */
  public async trigger(eventName: string, payload: Record<string, any> = {}) {
    return Promise.all(
      eventName
        .split(" ")
        .map(async eventName =>
          events.triggerAllAsync(this.eventName + "." + eventName, payload),
        ),
    );
  }

  /**
   * Listen on creating event
   */
  public onCreating(callback: (payload: CreatingEventPayload) => void) {
    this.on("creating", callback);

    return this;
  }

  /**
   * Listen on created event
   */
  public onCreated(callback: (payload: CreatedEventPayload) => void) {
    this.on("created", callback);

    return this;
  }

  /**
   * Listen on updating event
   */
  public onUpdating(callback: (payload: UpdatingEventPayload) => void) {
    this.on("updating", callback);

    return this;
  }

  /**
   * Listen on updated event
   */
  public onUpdated(callback: (payload: UpdatedEventPayload) => void) {
    this.on("updated", callback);

    return this;
  }

  /**
   * Listen on upserting event
   */
  public onUpserting(callback: (payload: UpsertingEventPayload) => void) {
    this.on("upserting", callback);

    return this;
  }

  /**
   * Listen on upserted event
   */
  public onUpserted(callback: (payload: UpsertedEventPayload) => void) {
    this.on("upserted", callback);

    return this;
  }

  /**
   * Listen on replacing event
   */
  public onReplacing(callback: (payload: ReplacingEventPayload) => void) {
    this.on("replacing", callback);

    return this;
  }

  /**
   * Listen on replaced event
   */
  public onReplaced(callback: (payload: ReplacedEventPayload) => void) {
    this.on("replaced", callback);

    return this;
  }

  /**
   * Listen on saving event
   */
  public onSaving(callback: (payload: SavingEventPayload) => void) {
    this.on("saving", callback);

    return this;
  }

  /**
   * Listen on saved event
   */
  public onSaved(callback: (payload: SavedEventPayload) => void) {
    this.on("saved", callback);

    return this;
  }

  /**
   * Listen on fetching event
   */
  public onFetching(callback: (payload: FetchingEventPayload) => void) {
    this.on("fetching", callback);

    return this;
  }

  /**
   * Listen on fetched event
   */
  public onFetched(callback: (payload: FetchedEventPayload) => void) {
    this.on("fetched", callback);

    return this;
  }

  /**
   * Listen on counting event
   */
  public onCounting(callback: (payload: CountingEventPayload) => void) {
    this.on("counting", callback);

    return this;
  }

  /**
   * Listen on counted event
   */
  public onCounted(callback: (payload: CountedEventPayload) => void) {
    this.on("counted", callback);

    return this;
  }

  /**
   * Listen on explaining event
   */
  public onExplaining(callback: (payload: ExplainingEventPayload) => void) {
    this.on("explaining", callback);

    return this;
  }

  /**
   * Listen on explained event
   */
  public onExplained(callback: (payload: ExplainedEventPayload) => void) {
    this.on("explained", callback);

    return this;
  }

  /**
   * Listen on deleting event
   */
  public onDeleting(callback: (payload: DeletingEventPayload) => void) {
    this.on("deleting", callback);

    return this;
  }

  /**
   * Listen on deleted event
   */
  public onDeleted(callback: (payload: DeletedEventPayload) => void) {
    this.on("deleted", callback);

    return this;
  }

  /**
   * Listen to the given event
   */
  public on(event: string, callback: (payload: any) => void) {
    events.on(this.eventName + "." + event, callback);
  }
}

export const query = new Query();
