import { Pipeline } from "./pipeline";

export class SortPipeline extends Pipeline {
  /**
   * Constructor
   */
  public constructor(
    protected readonly column: string,
    protected readonly direction: "asc" | "desc" = "asc",
  ) {
    super("sort");

    this.data({
      [column]: direction === "asc" ? 1 : -1,
    });
  }
}

export function sortPipeline(
  column: string,
  direction: "asc" | "desc" = "asc",
) {
  return new SortPipeline(column, direction);
}
