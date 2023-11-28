import { GenericObject, toStudlyCase } from "@mongez/reinforcements";
import { $agg, Aggregate, Pipeline, selectPipeline } from "../aggregate";
import { Joinable } from "./joinable";
import { ChunkCallback, Filter, PaginationListing } from "./types";

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
   * {@inheritdoc}
   */
  public async chunk<Output = T>(
    limit: number,
    callback: ChunkCallback<Output>,
    mapData?: (data: any) => any,
  ) {
    return super.chunk(limit, callback, mapData);
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
    const records = await this.get();

    records.forEach(async (model: any) => {
      await model.destroy();
    });

    return records.length;
  }

  /**
   * Perform a join
   */
  public joining(
    joining: string | Joinable,
    options?: {
      where?: GenericObject;
      select?: string[];
      pipeline: (GenericObject | Pipeline)[];
      as?: string;
    },
  ) {
    joining = this.getJoinable(joining);

    if (options?.where) {
      joining.where(options.where);
    }

    if (options?.select) {
      joining.select(...options.select);
    }

    if (options?.as) {
      joining.as(options.as);
    }

    if (options?.pipeline) {
      joining.addPipelines(options.pipeline);
    }

    return this.lookup(joining.parse());
  }

  /**
   * Get joinable instance for current model
   */
  protected getJoinable(joinable: string | Joinable) {
    if (typeof joinable === "string") {
      joinable = this.model.joinings[joinable] as Joinable;
    }

    return joinable.clone();
  }

  /**
   * Perform a join and count the records of the joined collection
   */
  public countJoining(
    joining: string | Joinable,
    options?: {
      where?: GenericObject;
      select?: string[];
      pipeline: (GenericObject | Pipeline)[];
      as?: string;
    },
  ) {
    joining = this.getJoinable(joining);

    const as = joining.get("as");

    const returnAs = options?.as || as + "Count";

    return this.joining(joining, options).addField(returnAs, {
      $size: $agg.columnName(as),
    });
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

  /**
   * Clone the aggregate model class
   */
  public clone() {
    const aggregate = new ModelAggregate(this.model);

    aggregate.pipelines = this.pipelines.slice();

    return aggregate as this;
  }
}
