import { ObjectId } from "mongodb";
import { BaseModel } from "./base-model";
import {
  ChildModel,
  ChunkCallback,
  Document,
  Filter,
  ModelDeleteStrategy,
  ModelDocument,
  PaginationListing,
  PrimaryIdType,
} from "./types";

export abstract class CrudModel extends BaseModel {
  /**
   * Create a new record in the database for the current model (child class of this one)
   * and return a new instance of it with the created data and the new generated id
   */
  public static async create<T>(
    this: ChildModel<T>,
    data: Document,
  ): Promise<T> {
    const model = this.self(data); // get new instance of model

    // save the model, and generate the proper columns needed
    await model.beforeCreating(data);
    await model.save();
    await model.onCreate();

    return model;
  }

  /**
   * Called before creating a new record
   */
  protected async beforeCreating<T>(this: ChildModel<T>, _data: Document) {
    //
  }

  /**
   * Called after creating a new record
   */
  protected async onCreate<T>(this: ChildModel<T>) {
    //
  }

  /**
   * Update model by the given id
   */
  public static async update<T>(
    this: ChildModel<T>,
    id: PrimaryIdType,
    data: Document,
  ): Promise<T | null> {
    const model = (await this.find(id)) as any;
    // execute the update operation

    if (!model) return null;

    await model.save(data);

    return model;
  }

  /**
   * Replace the entire document for the given document id with the given new data
   */
  public static async replace<T>(
    this: ChildModel<T>,
    id: PrimaryIdType,
    data: Document,
  ): Promise<T | null> {
    const model = (await this.find(id)) as any;

    if (!model) return null;

    model.replaceWith(data);

    await model.save();

    return model;
  }

  /**
   * Restore the document from trash
   */
  public static async restore<T>(
    this: ChildModel<T>,
    id: PrimaryIdType,
  ): Promise<T | null> {
    const deleteStrategy = this.deleteStrategy;

    if (deleteStrategy === ModelDeleteStrategy.softDelete) {
      const model = await this.query.first(this.collection, {
        id,
      });

      if (!model) return null;

      model.unset("deletedAt");

      await model.save();

      return model as T;
    }

    // retrieve the document from trash collection
    const result = await this.query.first(
      this.collection + "Trash",
      await this.prepareFilters({
        [this.primaryIdColumn]: id,
      }),
    );

    if (!result) return null;

    const document = result.document;

    // otherwise, create a new model with it
    document.restoredAt = new Date();

    const model = this.self(document);

    model.unset("deletedAt");

    model.markAsRestored();

    await model.save(); // save again in the same collection

    return model;
  }

  /**
   * Restore all documents from trash or by the given filter
   */
  public static async restoreAll<T>(this: ChildModel<T>, filter?: Filter) {
    const deleteStrategy = this.deleteStrategy;

    if (deleteStrategy === ModelDeleteStrategy.softDelete) {
      const models = await this.query.list(this.collection, filter);

      for (const model of models) {
        model.unset("deletedAt");

        if (model.id) {
          model.set("id", Number(model.id));
        }

        await model.save();
      }

      return models;
    }

    if (filter) {
      for (const key in filter) {
        filter[`document.` + key] = filter[key];
        delete filter[key];
      }
    }

    const documents = await this.query.list(this.collection + "Trash", filter);

    const models = [];

    for (const document of documents) {
      const model = this.self(document.document);

      if (model.id) {
        model.set("id", Number(model.id));
      }

      model.unset("deletedAt");

      model.markAsRestored();

      await model.save();

      models.push(model);
    }

    return models;
  }

  /**
   * Get deleted document by id
   */
  public static async getDeleted<T>(
    this: ChildModel<T>,
    id: PrimaryIdType,
  ): Promise<T | null> {
    const deleteStrategy = this.deleteStrategy;

    if (deleteStrategy === ModelDeleteStrategy.softDelete) {
      const model = await this.query.first(this.collection, {
        id,
      });

      if (!model) return null;

      return model as T;
    }

    const result = await this.query.first(
      this.collection + "Trash",
      await this.prepareFilters({
        [this.primaryIdColumn]: id,
      }),
    );

    if (!result) return null;

    const document = result.document;

    // otherwise, create a new model with it
    const model = this.self(document);

    return model;
  }

  /**
   * Get all deleted documents
   */
  public static async getAllDeleted<T>(this: ChildModel<T>, filter?: Filter) {
    const deleteStrategy = this.deleteStrategy;

    if (deleteStrategy === ModelDeleteStrategy.softDelete) {
      return await this.query.list(this.collection, filter);
    }

    if (filter) {
      for (const key in filter) {
        filter[`document.` + key] = filter[key];
        delete filter[key];
      }
    }

    const documents = await this.query.list(this.collection + "Trash", filter);

    const models = [];

    for (const document of documents) {
      const model = this.self(document.document);

      models.push(model);
    }

    return models;
  }

  /**
   * Find and update the document for the given filter with the given data or create a new document/record
   * if filter has no matching
   */
  public static async upsert<T>(
    this: ChildModel<T>,
    filter: Filter,
    data: Document,
  ): Promise<T> {
    filter = await this.prepareFilters(filter);

    let model = (await this.first(filter)) as any;

    if (!model) {
      model = this.self(data);
    } else {
      model.merge(data);
    }

    await model.save();

    return model;
  }

  /**
   * Find document by id
   */
  public static async find<T>(this: ChildModel<T>, id: PrimaryIdType) {
    return this.findBy(this.primaryIdColumn, Number(id));
  }

  /**
   * Find document by the given column and value
   */
  public static async findBy<T>(
    this: ChildModel<T>,
    column: string,
    value: any,
  ): Promise<T | null> {
    const result = await this.query.first(
      this.collection,
      await this.prepareFilters({
        [column]: value,
      }),
    );

    return result ? this.self(result as ModelDocument) : null;
  }

  /**
   * Create an explain plan for the given filter
   */
  public static async explain<T>(this: ChildModel<T>, filter: Filter = {}) {
    return await this.query.explain(
      this.collection,
      await this.prepareFilters(filter),
    );
  }

  /**
   * List multiple documents based on the given filter
   */
  public static async list<T>(
    this: ChildModel<T>,
    filter: Filter = {},
  ): Promise<T[]> {
    const documents = await this.query.list(
      this.collection,
      await this.prepareFilters(filter),
    );

    return documents.map(document => this.self(document));
  }

  /**
   * Paginate records based on the given filter
   */
  public static async paginate<T>(
    this: ChildModel<T>,
    filter: Filter,
    page = 1,
    limit = 15,
  ): Promise<PaginationListing<T>> {
    filter = await this.prepareFilters(filter);

    const documents = await this.query.list(this.collection, filter, query => {
      query.skip((page - 1) * limit).limit(limit);
    });

    const totalDocumentsOfFilter = await this.query.count(
      this.collection,
      filter,
    );

    const result: PaginationListing<T> = {
      documents: documents.map(document => this.self(document)),
      paginationInfo: {
        limit,
        page,
        result: documents.length,
        total: totalDocumentsOfFilter,
        pages: Math.ceil(totalDocumentsOfFilter / limit),
      },
    };

    return result;
  }

  /**
   * Find or create a new document based on the given filter and data
   * If the document is not found, it will be created
   * otherwise, just return the found document
   */
  public static async findOrCreate<T>(
    this: ChildModel<T>,
    filter: Filter,
    data: Document,
  ): Promise<T> {
    filter = await this.prepareFilters(filter);

    let model = (await this.first(filter)) as any;

    if (!model) {
      model = this.self(data);
      await model.save();
    }

    return model;
  }

  /**
   * Update or create a new document based on the given filter and data
   */
  public static async updateOrCreate<T>(
    this: ChildModel<T>,
    filter: Filter,
    data: Document,
  ): Promise<T> {
    filter = await this.prepareFilters(filter);

    let model = (await this.first(filter)) as any;

    if (!model) {
      model = this.self(data);
    } else {
      model.merge(data);
    }

    await model.save();

    return model;
  }

  /**
   * Count total documents based on the given filter
   */
  public static async count(filter: Filter = {}) {
    return await this.query.count(
      this.collection,
      await this.prepareFilters(filter),
    );
  }

  /**
   * Get first model for the given filter
   */
  public static async first<T>(
    this: ChildModel<T>,
    filter: Filter = {},
  ): Promise<T | null> {
    const result = await this.query.first(
      this.collection,
      await this.prepareFilters(filter),
    );

    return result ? this.self(result) : null;
  }

  /**
   * Get last model for the given filter
   */
  public static async last<T>(
    this: ChildModel<T>,
    filter: Filter = {},
  ): Promise<T | null> {
    const result = await this.query.last(
      this.collection,
      await this.prepareFilters(filter),
    );

    return result ? this.self(result) : null;
  }

  /**
   * Get latest documents
   */
  public static async latest<T>(
    this: ChildModel<T>,
    filter: Filter = {},
  ): Promise<T[]> {
    const documents = await this.query.latest(
      this.collection,
      await this.prepareFilters(filter),
    );

    return documents.map(document => this.self(document));
  }

  /**
   * Delete single document if the given filter is an ObjectId of mongodb
   * Otherwise, delete multiple documents based on the given filter object
   */
  public static async delete<T>(
    this: ChildModel<T>,
    filter: PrimaryIdType | Filter = {},
  ): Promise<number> {
    if (
      filter instanceof ObjectId ||
      typeof filter === "string" ||
      typeof filter === "number"
    ) {
      return (await this.query.deleteOne(
        this.collection,
        await this.prepareFilters({
          [this.primaryIdColumn]: filter,
        }),
      ))
        ? 1
        : 0;
    }

    filter = await this.prepareFilters(filter);

    return await this.query.delete(this.collection, filter);
  }

  /**
   * Chunk the documents
   */
  public static async chunk<T>(
    this: ChildModel<T>,
    limit: number,
    callback: ChunkCallback<T>,
  ): Promise<void>;
  public static async chunk<T>(
    this: ChildModel<T>,
    filter: Filter & {
      limit: number;
    },
    callback: ChunkCallback<T>,
  ): Promise<void>;
  public static async chunk<T>(
    this: ChildModel<T>,
    limitOrFilter: any,
    callback: ChunkCallback<T>,
  ) {
    let limit = limitOrFilter;
    let filter = {};

    if (typeof limitOrFilter === "object") {
      limit = limitOrFilter.limit;
      delete limitOrFilter.limit;
      filter = limitOrFilter;
    }

    const totalDocumentsOfFilter = await this.query.count(
      this.collection,
      filter,
    );

    const totalPages = Math.ceil(totalDocumentsOfFilter / limit);

    for (let page = 1; page <= totalPages; page++) {
      const result = await this.paginate(filter, page, limit);

      const output = await callback(result.documents, result.paginationInfo);

      if (output === false) return;
    }
  }

  /**
   * Check if document exists for the given filter
   */
  public static async exists<T>(this: ChildModel<T>, filter: Filter = {}) {
    return await this.query.exists(
      this.collection,
      await this.prepareFilters(filter),
    );
  }

  /**
   * Get distinct values for the given column
   */
  public static async distinct<T>(
    this: ChildModel<T>,
    column: string,
    filter: Filter = {},
  ): Promise<any[]> {
    return await this.query.distinct(
      this.collection,
      column,
      await this.prepareFilters(filter),
    );
  }

  /**
   * Prepare filters
   */
  protected static async prepareFilters(filters: Filter = {}) {
    // if filter contains _id and it is a string, convert it to ObjectId
    if (filters._id && typeof filters._id === "string") {
      filters._id = new ObjectId(filters._id);
    }

    const deleteStrategy = this.deleteStrategy;

    if (
      deleteStrategy === ModelDeleteStrategy.softDelete &&
      !filters.withDeleted
    ) {
      filters.deletedAt = null;
    }

    await (this as any).events().trigger("fetching", this, filters);
    await (BaseModel as any).events().trigger("fetching", this, filters);

    return filters;
  }
}
