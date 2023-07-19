import { DatabaseConfigurations } from "./types";

let configurations: Partial<DatabaseConfigurations> = {};

export function setDatabaseConfigurations(
  databaseConfigurations: DatabaseConfigurations,
) {
  configurations = {
    ...configurations,
    ...databaseConfigurations,
  };
}

export function getDatabaseConfigurations() {
  return configurations as DatabaseConfigurations;
}
