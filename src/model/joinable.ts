import { GenericObject } from "@mongez/reinforcements";
import pluralize from "pluralize";
import { Aggregate, LookupPipelineOptions, Pipeline } from "../aggregate";
import { Model } from "../model";

export type JoinableProxy = Joinable & Aggregate;

export type ReturnAsCallback = (data: any | any[]) => any;

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
   * Whether to return the data in model
   */
  public isInModel = false;

  /**
   * Return data as callback
   */
  protected returnAsCallback: ReturnAsCallback = (data: any) => {
    if (this.isInModel) {
      return Array.isArray(data)
        ? data.map(item => new this.model(item))
        : new this.model(data);
    }

    return data;
  };

  /**
   * Aggregate instance
   */
  public query: Aggregate;

  /**
   * Constructor
   * The Joined Model
   */
  public constructor(public model: typeof Model) {
    this.lookupData.from = model.collection;
    this.query = new Aggregate(model.collection);
  }

  /**
   * Set the return as callback
   */
  public returnAs(callback: ReturnAsCallback) {
    this.returnAsCallback = callback;

    return this;
  }

  /**
   * Get return as callback
   */
  public getReturnAs() {
    return this.returnAsCallback;
  }

  /**
   * Return data in model
   */
  public inModel(inModel = true) {
    this.isInModel = inModel;

    return this;
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
  public addPipeline(pipeline: (Pipeline | GenericObject)[]) {
    this.query.addPipeline(pipeline);
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

    lookupData.pipeline = this.query.parse();

    // reset the pipelines
    this.reset();

    return lookupData as Required<LookupPipelineOptions>;
  }

  /**
   * Reset the pipelines
   */
  public reset() {
    this.query = new Aggregate(this.model.collection);
  }

  /**
   * Clone the current instance
   */
  public clone() {
    const clone = new Joinable(this.model);

    clone.set(this.lookupData);

    clone.query.addPipelines(this.query.getPipelines());

    clone.isInModel = this.isInModel;

    clone.returnAsCallback = this.returnAsCallback.bind(clone);

    return clone;
  }
}
