import { MongoClientOptions } from "mongodb";

export type DatabaseConfigurations = {
  /**
   * Database host
   */
  host?: string;
  /**
   * Database port
   */
  port?: number;
  /**
   * Database username
   */
  username?: string;
  /**
   * Database password
   */
  password?: string;
  /**
   * Database name
   */
  database?: string;
  /**
   * Database authentication
   */
  dbAuth?: string;
  /**
   * Database URL string
   */
  url?: string;
} & Partial<MongoClientOptions>;

export type Migration = {
  /**
   * Blueprint for the migration
   */
  blueprint: any;
  /**
   * Run the migration
   */
  (): Promise<void>;
  /**
   * Rollback the migration
   */
  down?: () => Promise<void>;
};
