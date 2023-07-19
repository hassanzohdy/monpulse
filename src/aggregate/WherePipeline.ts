import { GenericObject } from "@mongez/reinforcements";
import { WhereExpression } from "./WhereExpression";
import { Pipeline } from "./pipeline";
import { WhereOperator } from "./types";

export class WherePipeline extends Pipeline {
  /**
   * Constructor
   */
  public constructor(expression: GenericObject) {
    super("match");

    this.data(expression);
  }
}

export function wherePipeline(column: string, value: any): WherePipeline;
export function wherePipeline(
  column: string,
  operator: WhereOperator,
  value: any,
): WherePipeline;
export function wherePipeline(column: GenericObject): WherePipeline;
export function wherePipeline(...args: any[]) {
  return new WherePipeline(WhereExpression.parse.apply(null, args as any));
}
