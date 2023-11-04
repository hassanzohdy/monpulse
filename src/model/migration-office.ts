import { colors} from "@mongez/copper";
import { Query, query } from "../query";
import { Model } from "./model";

export class MigrationOffice {
  /**
   * Master Mind Collection name
   */
  public collection = "migrations";

  /**
   * Connection Instance
   */
  public query: Query = query;

  /**
   * Check if the given migration name is already migrated
   */
  public async isMigrated(migrationName: string): Promise<boolean> {
    const migrationDocument = await this.query.first(this.collection, {
      name: migrationName,
    });

    return !!migrationDocument;
  }

  /**
   * Migrate the given migration name
   */
  public async migrate(migrationName: string) {
    const collectionName = this.collection;
    class Migration extends Model {
      public static collection = collectionName;
    }

    await Migration.create({
      name: migrationName,
      createdAt: new Date(),
    });
  }

  /**
   * Drop all migrations
   */
  public async drop() {
    console.log(
      colors.blue("→"),
      colors.cyan("[migration]"),
      colors.redBright("Dropping"),
      "all migrations",
    );

    await this.query.delete(this.collection);

    console.log(
      colors.green("✓"),
      colors.cyan("[migration]"),
      "All migrations has been " + colors.greenBright("dropped successfully."),
    );
  }

  /**
   * Drop the given migration name
   */
  public async dropMigration(migrationName: string) {
    await this.query.delete(this.collection, {
      name: migrationName,
    });
  }

  /**
   * Get migrations list
   */
  public async list() {
    return await this.query.list(this.collection);
  }
}

export const migrationOffice = new MigrationOffice();
