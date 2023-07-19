import { Collection, Db } from "mongodb";
import { Connection } from "./connection";

export class Database {
  /**
   * MongoDB Internal Database instance
   */
  public database!: Db;

  /**
   * Current Connection
   */
  public connection!: Connection;

  /**
   * Set connection instance
   */
  public setConnection(connection: Connection) {
    this.connection = connection;

    return this;
  }

  /**
   * Set database instance
   */
  public setDatabase(database: Db) {
    this.database = database;

    return this;
  }

  /**
   * Get database collection instance
   */
  public collection(collection: string): Collection {
    return this.database.collection(collection);
  }

  /**
   * List collection names
   */
  public async listCollectionNames() {
    return (await this.database.listCollections().toArray()).map(
      collection => collection.name,
    );
  }

  /**
   * Drop database
   */
  public async drop() {
    return await this.database.dropDatabase();
  }
}

export const database = new Database();
