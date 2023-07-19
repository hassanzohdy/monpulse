import { toStudlyCase } from "@mongez/reinforcements";
import { Aggregate } from "../aggregate";
import { selectPipeline } from "../aggregate/SelectPipeline";
import { Filter, PaginationListing } from "./types";

export class ModelAggregate<T> extends Aggregate {
  /**
   * Constructor
   */
  public constructor(protected readonly model: any) {
    super(model.collection);
    this.query = model.query;
  }

  /**
   * {@inheritDoc}
   */
  public async get<Output = T>(
    mapData: (record: any) => any = record => new this.model(record),
  ) {
    return (await super.get(mapData)) as Output[];
  }

  /**
   * {@inheritDoc}
   */
  public async first(mapData?: (data: any) => any) {
    return (await super.first(mapData)) as T | undefined;
  }

  /**
   * {@inheritDoc}
   */
  public async last(filters?: Filter) {
    return (await super.last(filters)) as T | undefined;
  }

  /**
   * {@inheritDoc}
   */
  public async paginate<G = T>(
    page = 1,
    limit = this.model.perPage,
  ): Promise<PaginationListing<G>> {
    return await super.paginate<G>(page, limit);
  }

  /**
   * Delete records
   */
  public async delete() {
    const records = await this.select(["id", "_id"]).get();

    records.forEach(async (model: any) => {
      await model.destroy();
    });

    return records.length;
  }

  /**
   * Join the given alias
   */
  public with(alias: string, ...moreParams: any[]) {
    const method = `with${toStudlyCase(alias)}`;

    const relation = this.model[method];

    if (!relation) {
      throw new Error(`Relation ${alias} not found`);
    }

    const {
      model,
      localField,
      as,
      foreignField,
      single = false,
      select: selectColumns,
      pipeline = [],
    } = relation.call(this.model, ...moreParams);

    if (selectColumns) {
      pipeline.push(selectPipeline(selectColumns));
    }

    this.lookup({
      as,
      single,
      from: model.collection,
      // related to from field
      foreignField: foreignField || `${as}.id`,
      // related to current model
      localField: localField || "id",
      pipeline,
    });

    return this;
  }
}
