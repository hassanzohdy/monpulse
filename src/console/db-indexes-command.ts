import { Command } from "commander";
import {
  connectToDatabase,
  dropAllDatabaseIndexes,
  listDatabaseIndexes,
  listIndexesForCertainCollections,
} from "../utils";

export function registerDatabaseIndexesCommand() {
  return new Command("db:indexes")
    .description("List all database indexes")
    .option(
      "-c, --collections <collections>",
      "List indexes for specific collections",
    )
    .option("-d, --drop", "Drop all database indexes")
    .action(options => {
      connectToDatabase();
      if (options.drop) {
        return dropAllDatabaseIndexes();
      }

      if (options.collections) {
        return listIndexesForCertainCollections(
          Array.isArray(options.collections)
            ? options.collections
            : [options.collections],
        );
      }

      listDatabaseIndexes();
    });
}
