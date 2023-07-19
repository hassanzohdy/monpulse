import { GenericObject } from "@mongez/reinforcements";
import { $agg } from "./expressions";
import { Pipeline } from "./pipeline";

export class GroupByPipeline extends Pipeline {
  /**
   * Constructor
   */
  public constructor(
    protected readonly _id: string | null | GenericObject | string[],
    protected groupByData: GenericObject = {},
  ) {
    super("group");

    if (typeof _id === "string") {
      _id = $agg.columnName(_id);
    }

    if (Array.isArray(_id)) {
      _id = (_id as string[]).reduce((result, column) => {
        result[column] = $agg.columnName(column);

        return result;
      }, {} as any);
    }

    this.data({
      _id: _id,
      ...this.groupByData,
    });
  }
}

export function groupByPipeline(
  column: string | null | GenericObject,
  groupByData: Record<string, any>,
) {
  return new GroupByPipeline(column, groupByData);
}
