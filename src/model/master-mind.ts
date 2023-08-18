import { ClientSession } from "mongodb";
import { database, Database } from "../database";

export class MasterMind {
  /**
   * Master Mind Collection name
   */
  public collection = "MasterMind";

  /**
   * Connection instance
   */
  public database: Database = database;

  /**
   * Get last id of the given collection
   */
  public async getLastId(collection: string): Promise<number> {
    const query = this.database.collection(this.collection);

    const collectionDocument = await query.findOne({
      collection: collection,
    });

    return collectionDocument ? collectionDocument.id : 0;
  }

  /**
   * Get current active session from database object
   */
  public getCurrentSession() {
    return this.database.getActiveSession()?.session;
  }

  /**
   * Generate next id for the given collection name
   */
  public async generateNextId(
    collection: string,
    incrementIdBy = 1,
    initialId = 1,
    { session = this.getCurrentSession() }: { session?: ClientSession } = {},
  ): Promise<number> {
    const query = this.database.collection(this.collection);

    const collectionDocument = await query.findOne(
      {
        collection: collection,
      },
      {
        session,
      },
    );

    if (collectionDocument) {
      const nextId = collectionDocument.id + incrementIdBy;

      // update the collection with the latest id
      await query.updateOne(
        {
          collection: collection,
        },
        {
          $set: {
            id: nextId,
          },
        },
        {
          // session,
        },
      );

      return nextId;
    } else {
      // if the collection is not found in the master mind table
      // create a new record for it
      await query.insertOne(
        {
          collection: collection,
          id: initialId,
        },
        {
          session,
        },
      );

      return initialId;
    }
  }
}

export const masterMind = new MasterMind();
