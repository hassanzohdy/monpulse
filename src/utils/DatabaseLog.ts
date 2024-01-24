import { LogChannel, LogLevel } from "@mongez/logger";
import { Log } from "../models";

export class DatabaseLog extends LogChannel {
  /**
   * {@inheritdoc}
   */
  public name = "database";

  /**
   * Database model
   */
  public model = Log;

  /**
   * Allowed log levels
   */
  protected allowedLogLevels: LogLevel[] = [];

  /**
   * Set the allowed log levels
   */
  public setAllowedLogLevels(levels: LogLevel[]) {
    this.allowedLogLevels = levels;

    return this;
  }

  /**
   * {@inheritdoc}
   */
  public async log(
    module: string,
    action: string,
    message: any,
    level: LogLevel,
  ) {
    if (!this.model.database?.connection?.isConnected()) return;

    if (this.allowedLogLevels.length && !this.allowedLogLevels.includes(level))
      return;

    const data: any = {
      module,
      action,
      message,
      level,
    };

    if (message instanceof Error) {
      data.trace = message.stack;
      data.message = message.message;
      this.model.create(data);
    }
  }
}
