import { GenericObject } from "@mongez/reinforcements";
import pluralize from "pluralize";
import {
  LookupPipelineOptions,
  Pipeline,
  WhereOperator,
  selectPipeline,
  wherePipeline,
} from "../aggregate";
import { Model } from "../model";

export class Joinable {
  /**
   * Lookup data
   */
  protected lookupData: LookupPipelineOptions = {
    from: "",
    localField: "",
    foreignField: "id",
    as: "",
    single: false,
  };

  /**
   * Pipelines
   */
  protected pipelines: (Pipeline | GenericObject)[] = [];

  /**
   * Constructor
   * The Joined Model
   */
  public constructor(protected model: typeof Model) {
    this.lookupData.from = model.collection;
  }

  /**
   * Set the local field
   */
  public localField(localField: string) {
    this.lookupData.localField = localField;

    return this;
  }

  /**
   * Get value from lookup data
   */
  public get(key: keyof LookupPipelineOptions, defaultValue?: any) {
    return (this.lookupData as any)[key] || defaultValue;
  }

  /**
   * Set the foreign field
   */
  public foreignField(foreignField: string) {
    this.lookupData.foreignField = foreignField;

    return this;
  }

  /**
   * Set the as field
   */
  public as(as: string) {
    this.lookupData.as = as;

    return this;
  }

  /**
   * Wether to return a single document or an array
   */
  public single(single = true) {
    this.lookupData.single = single;

    return this;
  }

  /**
   * Set the pipeline
   */
  public addPipelines(pipeline: (Pipeline | GenericObject)[]) {
    this.pipelines.push(...pipeline);
    return this;
  }

  /**
   * Add let
   */
  public let(letData: LookupPipelineOptions["let"]) {
    this.lookupData.let = letData;

    return this;
  }

  /**
   * Add selected columns
   */
  public select(...columns: string[]) {
    this.pipelines.push(selectPipeline(columns));
    return this;
  }

  /**
   * Add pipeline
   */
  public addPipeline(pipeline: Pipeline | GenericObject) {
    this.pipelines.push(pipeline);

    return this;
  }

  /**
   * Add a ware clause to the pipeline
   */
  public where(column: string, value: any): this;
  public where(column: string, operator: WhereOperator, value: any): this;
  public where(column: GenericObject): this;
  public where(...args: any[]) {
    this.pipelines.push((wherePipeline as any)(...args));

    return this;
  }

  /**
   * Set all lookup data
   */
  public set(data: LookupPipelineOptions) {
    if (!data.from) {
      data.from = this.model.collection;
    }

    this.lookupData = data;

    return this;
  }

  /**
   * Parse the lookup data
   */
  public parse() {
    const name = this.lookupData.single
      ? pluralize(this.model.collection, 1)
      : pluralize(this.model.collection);

    const lookupData = { ...this.lookupData };

    if (!lookupData.as) {
      lookupData.as = name;
    }

    if (!lookupData.localField) {
      lookupData.localField = name + ".id";
    }

    if (this.pipelines.length > 0) {
      lookupData.pipeline = this.pipelines;
    }

    // reset the pipelines
    this.reset();

    return lookupData;
  }

  /**
   * Reset the pipelines
   */
  public reset() {
    this.pipelines = [];
  }

  /**
   * Clone the current instance
   */
  public clone() {
    const clone = new Joinable(this.model);

    clone.set(this.lookupData);

    clone.pipelines = [...this.pipelines];

    return clone;
  }
}
