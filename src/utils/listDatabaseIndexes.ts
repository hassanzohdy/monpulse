import { colors } from "@mongez/copper";
import { Table } from "console-table-printer";
import { database } from "../database";
import { onceConnected } from "./onceConnected";

export function listDatabaseIndexes() {
  onceConnected(async () => {
    const collections = (await database.listCollectionNames()).sort((a, b) => {
      // sort collections alphabetically
      if (a < b) {
        return -1;
      }

      if (a > b) {
        return 1;
      }

      return 0;
    });

    for (const collection of collections) {
      await printCollectionIndexes(collection);
    }

    process.exit();
  });
}

export async function listIndexesForCertainCollections(collections: string[]) {
  onceConnected(async () => {
    collections = collections.sort((a, b) => {
      // sort collections alphabetically
      if (a < b) {
        return -1;
      }

      if (a > b) {
        return 1;
      }

      return 0;
    });
    for (const collection of collections) {
      await printCollectionIndexes(collection);
    }

    process.exit();
  });
}

export async function printCollectionIndexes(collection: string) {
  // create a table in the console and print the collection name with its collection indexes
  const indexes = await database.collection(collection).indexes();

  const table = new Table({
    title:
      colors.cyanBright(collection) +
      " Collection " +
      `${colors.greenBright(indexes.length)} Indexes`,
    columns: [
      {
        name: "Normal Indexes",
        minLen: 20,
      },
      {
        name: "Unique Indexes",
        minLen: 20,
      },
      {
        name: "Geo Indexes",
        minLen: 20,
      },
      {
        name: "Text Indexes",
        minLen: 20,
      },
    ],
  });

  const indexesTypes: any = {
    unique: [],
    geo: [],
    normal: [],
    text: [],
  };

  for (const index of indexes) {
    let isNormalIndex = true;
    if (index.unique) {
      indexesTypes.unique.push(index.name);
      isNormalIndex = false;
      table.addRow({
        "Unique Indexes": colors.greenBright(index.name),
      });
    }

    if (index["2dsphereIndexVersion"]) {
      indexesTypes.geo.push(index.name);
      isNormalIndex = false;
      table.addRow({
        "Geo Indexes": colors.magentaBright(index.name),
      });
    }

    // check if text index
    if (index.weights) {
      indexesTypes.text.push(index.name);
      isNormalIndex = false;
      table.addRow({
        "Text Indexes": colors.yellow(index.name),
      });
    }

    if (isNormalIndex) {
      indexesTypes.normal.push(index.name);
      table.addRow({
        "Normal Indexes": index.name,
      });
    }
  }

  table.printTable();
}
