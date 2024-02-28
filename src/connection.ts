import { colors } from "@mongez/copper";
import events from "@mongez/events";
import { log } from "@mongez/logger";
import { MongoClient, MongoClientOptions } from "mongodb";
import { Database, database } from "./database";
import { DatabaseConfigurations } from "./types";

export type ConnectionEvent = "connected" | "error" | "close";

export class Connection {
  /**
   * Mongo Client
   */
  public client!: MongoClient;

  /**
   * Database instance
   */
  public database!: Database;

  /**
   * A flag to check if the connection is established
   */
  protected isConnectionEstablished = false;

  /**
   * Database configurations
   */
  public configurations: DatabaseConfigurations = {
    host: "localhost",
    port: 27017,
    username: "",
    password: "",
    database: "",
    dbAuth: "",
  };

  /**
   * Connect to the database
   */
  public async connect(
    databaseConfigurations?: DatabaseConfigurations & MongoClientOptions,
  ) {
    if (this.isConnectionEstablished) return;

    if (databaseConfigurations) {
      this.configurations = {
        ...this.configurations,
        ...databaseConfigurations,
      };
    }

    const {
      host,
      port,
      username,
      password,
      database: databaseName,
      dbAuth,
      url,
      ...otherConnectionOptions
    } = this.configurations;

    try {
      log.info(
        "database",
        "connection",
        `Connecting to the database ${colors.goldBright(databaseName)}`,
      );

      const connectionOptions = otherConnectionOptions;

      if (dbAuth) {
        connectionOptions.authSource = dbAuth;
      }

      if (username && password && !url) {
        connectionOptions.auth = {
          username,
          password,
        };
      }

      this.client = await MongoClient.connect(
        url || `mongodb://${host}:${port}`,
        connectionOptions,
      );

      const mongoDBDatabase = await this.client.db(databaseName);

      this.database = database.setDatabase(mongoDBDatabase).setConnection(this);

      this.isConnectionEstablished = true;

      // listen on connection close
      this.client.on("close", () => {
        this.trigger("close", this);
      });

      if (!url && (!username || !password)) {
        log.warn(
          "database",
          "connection",
          "Connected, but you are not making a secure authenticated connection!",
        );
      } else {
        log.success("database", "connection", "Connected to the database");
      }

      this.trigger("connected", this);
    } catch (error) {
      log.error("database", "connection", error);

      this.trigger("error", error);
    }
  }

  /**
   * Check if the connection is established
   */
  public isConnected() {
    return this.isConnectionEstablished;
  }

  /**
   * Trigger the given event
   */
  protected trigger(eventName: ConnectionEvent, ...args: any[]) {
    return events.trigger(`database.connection.${eventName}`, ...args);
  }

  /**
   * Subscribe to one of connection events
   */
  public on(eventName: ConnectionEvent, callback: any) {
    return events.subscribe(`database.connection.${eventName}`, callback);
  }

  /**
   * Use another database
   */
  public useDatabase(name: string) {
    return new Database()
      .setDatabase((this.client as MongoClient).db(name))
      .setConnection(this);
  }
}

export const connection = new Connection();
