import { Pipeline } from "./pipeline";

export class SkipPipeline extends Pipeline {
  /**
   * Constructor
   */
  public constructor(protected readonly skip: number) {
    super("skip");

    this.data(skip);
  }
}

export function skipPipeline(skip: number) {
  return new SkipPipeline(skip);
}
