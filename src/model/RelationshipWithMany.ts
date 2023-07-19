import { Model } from "./model";
import { Filter, ModelDocument } from "./types";

export class RelationshipWithMany<T> {
  /**
   * Constructor
   */
  public constructor(
    protected model: Model,
    protected relatedModel: typeof Model,
    protected column: string,
  ) {
    //
  }

  /**
   * Add the given model to the relationship
   */
  public async add(model: Model) {
    await model.save();

    await this.model.associate(this.column, model).save();
  }

  /**
   * Create and add the given model to the relationship
   */
  public async create(data: any) {
    data[this.column] = this.model.id;

    return await this.relatedModel.create(data);
  }

  /**
   * Remove the given model from the relationship
   */
  public async remove(model: Model) {
    await this.model.disassociate(this.column, model).save();
  }

  /**
   * Get all related models
   */
  public async list(filter: Filter = {}) {
    const embeddedDocuments = this.model.get(this.column) || [];

    const embeddedDocumentsIds = embeddedDocuments.map(
      // because it may be an array of ids or an array of documents
      (document: ModelDocument) => document.id || document,
    );

    const documents = (await (this.relatedModel as any).list({
      id: embeddedDocumentsIds,
      ...filter,
    })) as T[];

    this.model.set(this.column, documents);

    return documents;
  }
}
