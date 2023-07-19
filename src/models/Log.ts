import { Casts, Model } from "./../model";

export class Log extends Model {
  /**
   * Collection name
   */
  public static collection = "logs";

  /**
   * {@inheritdoc}
   */
  protected casts: Casts = {
    module: "string",
    action: "string",
    message: "string",
    trace: "object",
    level: "string",
  };
}
