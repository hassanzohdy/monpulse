import { exit } from "process";
import { database } from "../database";
import { onceConnected } from "./../utils/onceConnected";

export function dropAllDatabaseIndexes() {
  onceConnected(async () => {
    const collections = await database.listCollectionNames();

    for (const collection of collections) {
      database.collection(collection).dropIndexes();
    }

    console.log("All indexes dropped successfully");

    exit();
  });
}
