import { colors } from "@mongez/copper";
import { capitalize } from "@mongez/reinforcements";
import dayjs from "dayjs";
import { Blueprint } from "./blueprint/blueprint";
import { migrationOffice } from "./model/migration-office";
import { onceConnected } from "./utils";

let currentMigrations: any[] = [];

export function migrate(fresh = false) {
  onceConnected(() => startMigrating(fresh));
}

export function setMigrationsList(migrations: any[]) {
  currentMigrations = migrations;
}

export function getBlueprintsList() {
  const blueprints: (typeof Blueprint)[] = [];

  for (const migration of currentMigrations) {
    if (!migration.blueprint || blueprints.includes(migration.blueprint))
      continue;

    blueprints.push(migration.blueprint);
  }

  return blueprints;
}

export function listMigrations() {
  onceConnected(async () => {
    console.log(
      colors.blue("→"),
      colors.cyan("[migration]"),
      colors.yellow('"Listing all migrations"'),
    );

    const migrations = await migrationOffice.list();

    if (!migrations.length) {
      console.log(
        // exclamation mark
        colors.yellow("⚠"),
        colors.cyan("[migration]"),
        "No migrations found",
      );
    }

    for (const migration of migrations) {
      console.log(
        // add green check mark
        colors.green("✓"),
        colors.cyan("[migration]"),
        colors.magentaBright(
          dayjs(migration.createdAt).format("YYYY-MM-DD HH:mm:ss"),
        ),
        colors.greenBright(migration.name),
      );
    }

    process.exit();
  });
}

export function getMigrationName(migration: any) {
  let migrationName = migration;

  migrationName = migrationName.replace(
    new RegExp(`migrations|migration`, "i"),
    "",
  );

  // migration name can be something like usersGroupMigration
  // so we need to split it using camel case
  migrationName = migrationName.replace(/([A-Z])/g, " $1");

  // now capitalize the first letter of each word
  migrationName = capitalize(migrationName);

  return migrationName;
}

export async function dropMigrations() {
  for (const migration of currentMigrations) {
    const migrationName = getMigrationName(migration.name);

    console.log(
      colors.blue("→"),
      colors.cyan("[migration]"),
      colors.gray("[dropping]"),
      colors.red("Dropping"),
      colors.yellowBright(`${migrationName} migration`),
    );
    try {
      await migrationOffice.dropMigration(migrationName);

      await migration.down();

      console.log(
        colors.green("✓"),
        colors.cyan("[migration]"),
        colors.gray("[dropped]"),
        colors.redBright("Dropped"),
        colors.greenBright(`${migrationName} migration`),
      );
    } catch (error: any) {
      console.log(
        colors.red("✗"),
        colors.cyan("[migration]"),
        colors.gray("[dropFailed]"),
        colors.redBright("Failed to drop"),
        colors.greenBright(`${migrationName} migration`),
      );

      console.log(error.message);
    }
  }
}

export async function startMigrating(fresh = false) {
  if (fresh) {
    await dropMigrations();
  }

  for (const migration of currentMigrations) {
    const migrationName = getMigrationName(migration.name);

    console.log(
      // add blue arrow mark
      colors.blue("→"),
      colors.cyan("[migration]"),
      colors.gray("[migrating]"),
      "Creating " + colors.yellowBright(`${migrationName} migration`),
    );

    try {
      const isMigrated = await migrationOffice.isMigrated(migrationName);

      if (isMigrated) {
        console.log(
          // add red x mark
          colors.red("✗"),
          colors.cyan("[migration]"),
          colors.gray("[skipped]"),
          `${colors.redBright(
            migrationName + " Migration",
          )} has been done before.`,
        );
        continue;
      }

      await migration();

      await migrationOffice.migrate(migrationName);
      console.log(
        // add green check mark
        colors.green("✓"),
        colors.cyan("[migration]"),
        colors.gray("[migrated]"),
        `${colors.greenBright(
          migrationName + " Migration",
        )} has been migrated successfully.`,
      );
    } catch (error) {
      console.log(error);
    }
  }

  process.exit(0);
}
