import Is from "@mongez/supportive-is";
import { Command } from "commander";
import { BluePrint } from "../blueprint/blueprint";
import { setMigrationsList } from "./../migrate";
import { connectToDatabase } from "./../utils";

export function parseBluePrint(data: any) {
  const schema: any = {};
  for (const column in data) {
    let columnType = data[column];

    // check first if the column type is typeof Blueprint as columnType will be the class itself
    // not the object of Blueprint

    if (columnType.prototype instanceof BluePrint) {
      columnType = parseBluePrint(columnType.schema);
    } else if (Is.plainObject(columnType)) {
      columnType = parseBluePrint(columnType);
    } else if (typeof columnType !== "string" && !Is.plainObject(columnType)) {
      columnType = columnType.name;
    }

    schema[column] = columnType;
  }

  return schema;
}

export function registerBlueprintsCommand(migrationsList: any[]) {
  return new Command("blueprints")
    .description("List all blueprints")
    .action(() => {
      setMigrationsList(migrationsList);
      connectToDatabase();
    });
}
