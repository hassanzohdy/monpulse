import { Pipeline } from "./pipeline";

export class DeselectPipeline extends Pipeline {
  /**
   * Constructor
   */
  public constructor(protected readonly columns: string[]) {
    super("project");

    this.data(
      columns.reduce((acc: Record<string, 0>, column) => {
        acc[column] = 0;

        return acc;
      }, {}),
    );
  }
}

export function deselectPipeline(columns: string[]) {
  return new DeselectPipeline(columns);
}
