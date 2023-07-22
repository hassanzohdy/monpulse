import { Database } from "../database";
import { Model } from "../model";
import { Blueprint } from "./blueprint";

export class ModelBlueprint extends Blueprint {
  /**
   * Constructor
   */
  public constructor(
    protected readonly model: typeof Model,
    database: Database = model.database,
  ) {
    super(model.collection, database);
  }
}

/**
 * Get a Blueprint class for the given model
 */
export function modelBlueprint(model: typeof Model) {
  return new ModelBlueprint(model);
}
