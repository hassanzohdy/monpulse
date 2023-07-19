import { WhereExpression } from "./WhereExpression";
import { WherePipeline } from "./WherePipeline";

export class OrWherePipeline extends WherePipeline {
  /**
   * {@inheritDoc}
   */
  public parse() {
    const data: {
      [key: string]: any;
    }[] = [];

    for (const column in this.pipelineData) {
      data.push({
        [column]: this.pipelineData[column],
      });
    }

    return {
      $match: {
        $or: data,
      },
    };
  }
}

export function orWherePipeline(column: string, value: any): OrWherePipeline;
export function orWherePipeline(
  column: string,
  operator: string,
  value: any,
): OrWherePipeline;
export function orWherePipeline(column: any): OrWherePipeline;
export function orWherePipeline(...args: any[]) {
  return new OrWherePipeline(WhereExpression.parse.apply(null, args as any));
}
