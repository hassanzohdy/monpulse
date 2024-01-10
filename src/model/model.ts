import {
  areEqual,
  clone,
  except,
  get,
  merge,
  only,
  set,
} from "@mongez/reinforcements";
import { isEmpty, isPlainObject } from "@mongez/supportive-is";
import { toUTC } from "@mongez/time-wizard";
import dayjs from "dayjs";
import { MongoServerError, ObjectId } from "mongodb";
import { castEnum, castModel } from "../casts";
import { RelationshipModel } from "./relationships";
import {
  CastType,
  Casts,
  CustomCastType,
  CustomCasts,
  Document,
  ModelDeleteStrategy,
} from "./types";

// type Schema = Document | ModelDocument;

export type Schema<ModelSchema = Document> = ModelSchema & {
  _id?: ObjectId;
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

type ModelSchema = Schema;
type ModelDocument = Document;

export class Model
  // <
  //   ModelDocument extends Document = any,
  //   ModelSchema extends Schema<ModelDocument> = any,
  // >
  extends RelationshipModel
{
  /**
   * Model Initial Document data
   */
  public initialData: Partial<ModelSchema> = {};

  /**
   * Model Document data
   */
  public data!: ModelSchema;

  /**
   * Define Default value data that will be merged with the models' data
   * on the create process
   */
  public defaultValue: Partial<ModelSchema> = {};

  /**
   * A flag to determine if the model is being restored
   */
  protected isRestored = false;

  /**
   * Model casts types
   */
  protected casts: Casts = {};

  /**
   * Set custom casts that will be used to cast the model's data are not related to the current value of the collection's column
   *
   * For example: `name` is not a column in the given data, but it will be concatenation of `firstName` and `lastName`
   */
  protected customCasts: CustomCasts<string> = {};

  /**
   * Guarded fields
   */
  public guarded: (keyof ModelDocument)[] = [];

  /**
   * Fillable fields
   */
  public filled: (keyof ModelDocument)[] = [];

  /**
   * Embedded columns
   */
  public embedded: (keyof ModelSchema)[] = [];

  /**
   * Embed all columns except the given columns
   */
  public embedAllExcept: (keyof ModelDocument)[] = [];

  /**
   * Embed all columns except timestamps and created|updated|deleted by columns
   */
  public embedAllExceptTimestampsAndUserColumns = false;

  /**
   * Created at column
   */
  public createdAtColumn = "createdAt";

  /**
   * Updated at column
   */
  public updatedAtColumn = "updatedAt";

  /**
   * Deleted at column
   */
  public deletedAtColumn = "deletedAt";

  /**
   * Created by column
   */
  public createdByColumn = "createdBy";

  /**
   * Updated by column
   */
  public updatedByColumn = "updatedBy";

  /**
   * Deleted by column
   */
  public deletedByColumn = "deletedBy";

  /**
   * Date format
   */
  public dateFormat = "DD-MM-YYYY";

  /**
   * A flag to determine if the id is auto generated not added manually
   */
  protected autoGeneratedId = false;

  /**
   * Is active column
   */
  protected isActiveColumn = "isActive";

  /**
   * Original data
   */
  public originalData: ModelSchema = {} as ModelSchema;

  /**
   * Constructor
   */
  public constructor(originalData: Partial<ModelSchema> = {}) {
    super();

    if (originalData instanceof Model) {
      this.originalData = clone(originalData.data) as ModelSchema;
    } else {
      this.originalData = clone(originalData) as ModelSchema;
    }

    if (typeof originalData?._id === "string") {
      try {
        (originalData as any)._id = new ObjectId(originalData._id);
      } catch (error) {
        (originalData as any)._id = new ObjectId();
      }
    }

    this.data = clone(this.originalData);

    this.initialData = clone(this.originalData);

    // this is necessary as clone() will generate a new _id for the data
    // so we need to keep the original _id
    if (originalData?._id) {
      this.originalData._id = new ObjectId(originalData._id);
      this.data._id = new ObjectId(originalData._id);
      this.initialData._id = new ObjectId(originalData._id);
    }
  }

  /**
   * Get save columns which are the casts keys
   */
  public get castColumns() {
    return Object.keys(this.casts);
  }

  /**
   * Get value from original data
   */
  public original(key: string, defaultValue?: any) {
    return get(this.originalData, key, defaultValue);
  }

  /**
   * Get all data except the guarded fields
   */
  public get publicData() {
    return except(this.data, this.guarded as string[]);
  }

  /**
   * Get guarded data
   */
  public get guardedData() {
    return only(this.data, this.guarded as string[]);
  }

  /**
   * Get the model's id
   */
  public get id(): number {
    return this.get("id");
  }

  /**
   * Check if current user is active
   */
  public get isActive() {
    return Boolean(this.get(this.isActiveColumn));
  }

  /**
   * Get mongodb id
   */
  public get _id(): ObjectId {
    return this.get("_id");
  }

  /**
   * Mark the current model as being restored
   */
  public markAsRestored() {
    this.isRestored = true;
  }

  /**
   * Set a column in the model data
   */
  public set(column: keyof ModelSchema, value: any) {
    this.data = set(this.data, column as string, value) as ModelSchema;

    return this;
  }

  /**
   * Increment the given column by the given value
   */
  public increment(column: keyof ModelSchema, value = 1) {
    return this.set(column, this.get(column, 0) + value);
  }

  /**
   * Decrement the given column by the given value
   */
  public decrement(column: keyof ModelSchema, value = 1) {
    return this.set(column, this.get(column, 0) - value);
  }

  /**
   * Get initial value of the given column
   */
  public getInitial(column: keyof ModelSchema, defaultValue?: any) {
    return get(this.initialData, column as string, defaultValue);
  }

  /**
   * Get value of the given column
   */
  public get(column: keyof ModelSchema, defaultValue?: any) {
    return get(this.data, column as string, defaultValue);
  }

  /**
   * Determine whether the given column exists in the document
   */
  public has(column: keyof ModelSchema) {
    return get(this.data, column as string) !== undefined;
  }

  /**
   * Get all columns except the given ones
   */
  public except(columns: (keyof ModelSchema)[]): Document {
    return except(this.data, columns as string[]);
  }

  /**
   * Get only the given columns
   */
  public only(columns: (keyof ModelSchema)[]): Document {
    return only(this.data, columns as string[]);
  }

  /**
   * Get only id
   */
  public get onlyId() {
    return this.only(["id"]);
  }

  /**
   * Unset or remove the given columns from the data
   */
  public unset(...columns: (keyof ModelSchema)[]) {
    this.data = except(this.data, columns as string[]);

    return this;
  }

  /**
   * Replace the entire document data with the given new data
   */
  public replaceWith(data: ModelSchema) {
    if (!data.id && this.data.id) {
      data.id = this.data.id;
    }

    if (!data._id && this.data._id) {
      data._id = this.data._id;
    }

    this.data = data;

    return this;
  }

  /**
   * Merge the given documents to current document
   */
  public merge(data: Document) {
    this.data = merge(this.data, data);

    return this;
  }

  /**
   * Push the given values to the given column
   * If the given column does not exists, it will be created
   * If the given value exists but not an array it will be ignored
   */
  public push(column: keyof ModelSchema, ...values: any[]) {
    const currentValue = this.get(column);

    if (Array.isArray(currentValue)) {
      this.set(column, [...currentValue, ...values]);
    } else if (!currentValue) {
      this.set(column, values);
    }

    return this;
  }

  /**
   * Add the given values to the beginning of the given column
   * If the given column does not exists, it will be created
   * If the given value exists but not an array it will be ignored
   */
  public unshift(column: keyof ModelSchema, ...values: any[]) {
    const currentValue = this.get(column);

    if (Array.isArray(currentValue)) {
      this.set(column, [...values, ...currentValue]);
    } else if (!currentValue) {
      this.set(column, values);
    }

    return this;
  }

  /**
   * Perform saving operation either by updating or creating a new record in database
   */
  public async save(
    mergedData?: Omit<ModelSchema, "id" | "_id">,
    {
      triggerEvents = true,
      cast = true,
      forceUpdate = false,
    }: {
      triggerEvents?: boolean;
      cast?: boolean;
      forceUpdate?: boolean;
    } = {},
  ) {
    const saveEvents: any[] = [];
    try {
      if (mergedData) {
        this.merge(mergedData);
      }

      let mode: "create" | "update" = "create";

      let currentModel;

      // check if the data contains the primary id column
      if (!this.isNewModel()) {
        // perform an update operation
        // check if the data has changed
        // if not changed, then do not do anything

        if (cast) {
          await this.castData(forceUpdate);
        }

        if (this.shouldUpdate(this.originalData, this.data) === false) {
          return this;
        }

        currentModel = new (this.constructor as any)(this.originalData);

        mode = "update";

        const updatedAtColumn = this.updatedAtColumn;

        if (updatedAtColumn) {
          // updateAtColumn is supposed to be part of the Schema
          (this.data as any)[updatedAtColumn] = new Date();
        }

        if (triggerEvents) {
          const selfModelEvents = this.getModelEvents();

          const ModelEvents = this.getBaseModelEvents();

          await this.onSaving();
          await this.onUpdating();
          await selfModelEvents.trigger("updating", this, currentModel);
          await selfModelEvents.trigger("saving", this, currentModel);
          await ModelEvents.trigger("updating", this, currentModel);
          await ModelEvents.trigger("saving", this, currentModel);
        }

        await this.getQuery().replace(
          this.getCollection(),
          {
            _id: this.data._id,
          },
          this.data,
        );

        if (triggerEvents) {
          const selfModelEvents = this.getModelEvents();
          const ModelEvents = this.getBaseModelEvents();
          saveEvents.push(
            this.onSaved(),
            this.onUpdated(),
            selfModelEvents.trigger("updated", this, currentModel),
            selfModelEvents.trigger("saved", this, currentModel),
            ModelEvents.trigger("updated", this, currentModel),
            ModelEvents.trigger("saved", this, currentModel),
          );
        }
      } else {
        let tries = 3;

        while (tries > 0) {
          try {
            // await this.getDatabase().startSessionContext(async ({ session }) => {
            // check for default values and merge it with the data
            await this.checkDefaultValues();

            // if the column does not exist, then create it
            if (!this.data.id || this.autoGeneratedId) {
              this.autoGeneratedId = true;
              await this.generateNextId();
            }

            const now = new Date();

            const createdAtColumn = this.createdAtColumn;

            // if the column does not exist, then create it
            if (this.data[createdAtColumn]) {
              (this.data as any)[createdAtColumn] = new Date(
                this.data[createdAtColumn],
              );
            } else if (createdAtColumn) {
              (this.data as any)[createdAtColumn] = now;
            }

            // if the column does not exist, then create it
            const updatedAtColumn = this.updatedAtColumn;

            if (updatedAtColumn) {
              (this.data as any)[updatedAtColumn] = now;
            }

            if (cast) {
              await this.castData();
            }

            if (triggerEvents) {
              const selfModelEvents = this.getModelEvents();

              const ModelEvents = this.getBaseModelEvents();

              await this.onSaving();
              await this.onCreating();
              await selfModelEvents.trigger("creating", this);
              await selfModelEvents.trigger("saving", this);
              await ModelEvents.trigger("creating", this);
              await ModelEvents.trigger("saving", this);
            }

            this.data = (await this.getQuery().create(
              this.getCollection(),
              this.data,
            )) as ModelSchema;

            if (triggerEvents) {
              const selfModelEvents = this.getModelEvents();
              const ModelEvents = this.getBaseModelEvents();

              saveEvents.push(
                this.onSaved(),
                this.onCreated(),
                selfModelEvents.trigger("created", this),
                selfModelEvents.trigger("saved", this),
                ModelEvents.trigger("created", this),
                ModelEvents.trigger("saved", this),
              );
            }

            break;
          } catch (error: MongoServerError | any) {
            console.log(error.message);
            console.log(error.trace);
            // Handle duplicate key error
            if (error instanceof MongoServerError && error.code === 11000) {
              if (tries < 2) {
                const duplicateField = error.keyValue;
                const fieldName = Object.keys(duplicateField)[0];

                const errorMessage = `A record with the same ${fieldName} already exists.`;
                if (this.autoGeneratedId) {
                  this.unset("id");
                }

                throw new Error(errorMessage);
              } else {
                tries--;
              }
            }

            throw error;
          }
        }
      }

      if (!this.data.id) return this;

      this.originalData = clone(this.data);

      // @see constructor
      this.originalData._id = this.data._id;

      if (triggerEvents) {
        await Promise.all(saveEvents);
        this.startSyncing(mode, currentModel);
      }

      return this;
    } catch (error) {
      console.log("Error in " + this.constructor.name + ".save()");
      console.log(error);
      throw error;
    }
  }

  /**
   * Generate and return next id
   */
  public async generateNextId() {
    this.set(
      "id",
      await this.getStaticProperty("genNextId").bind(this.constructor)(),
    );

    return this.id;
  }

  /**
   * Perform saving but without any events triggers
   */
  public async silentSaving(
    mergedData?: Omit<ModelSchema, "id" | "_id">,
    options?: { cast?: boolean },
  ) {
    return await this.save(mergedData, {
      triggerEvents: false,
      ...(options || {}),
    });
  }

  /**
   * Determine whether the model should be updated or not
   */
  protected shouldUpdate(originalData: ModelSchema, data: ModelSchema) {
    return areEqual(originalData, data) === false;
  }

  /**
   * Triggered before saving the model either by creating or updating
   */
  protected async onSaving() {
    //
  }

  /**
   * Triggered after saving the model either by creating or updating
   */
  protected async onSaved() {
    //
  }

  /**
   * Triggered before creating the model
   */
  protected async onCreating() {
    //
  }

  /**
   * Triggered after creating the model
   */
  protected async onCreated() {
    //
  }

  /**
   * Triggered before updating the model
   */
  protected async onUpdating() {
    //
  }

  /**
   * Triggered after updating the model
   */
  protected async onUpdated() {
    //
  }

  /**
   * Triggered before deleting the model
   */
  protected async onDeleting() {
    //
  }

  /**
   * Triggered after deleting the model
   */
  protected async onDeleted() {
    //
  }

  /**
   * Cast data before saving
   */
  protected async castData(forceUpdate = false) {
    for (const column in this.casts) {
      if (!forceUpdate && !this.isDirty(column)) {
        continue;
      }

      let value = this.get(column);

      if (value === undefined) continue;

      const castType = this.casts[column];

      const castValue = async (value: any) => {
        if (castType.prototype instanceof Model) {
          // if cast type is passed as model class, then get its embedded data
          value = await castModel(castType)(value);
        } else if (castType?.model) {
          // it means the user is passing a custom model embedding i.e Model.embed('embedToProduct') => Product to embed from the getter property
          // embedToProduct
          // @see EmbeddedModel

          value = await castModel(castType.model, castType.embeddedKey)(value);
        } else if (typeof castType === "object") {
          // it means the user is passing an enum object

          value = await castEnum(castType)(value);
        } else if (value instanceof Model) {
          value = value.embeddedData;
        } else if (typeof castType === "function") {
          value = await (castType as CustomCastType)(value, column, this);
        } else {
          value = this.castValue(value, castType);
        }

        return value;
      };

      // if the cast type is passed in array
      // it means we just need to pass the value to the first function
      // second argument will be the column name
      // and the third argument will be the model instance
      if (Array.isArray(castType)) {
        value = await castType[0](value, column, this);
      } else if (Array.isArray(value) && castType !== "localized") {
        // if cast type is array, then we'll keep the value as it is

        // now we want to add a new validation rule that to check
        // if the value is an array of localized objects
        // if so, then each value in the array should have `localeCode` and `value` keys
        // if so, then it will be cast only to the value key inside each object
        // so the final output will be localeCode and `castValue` of the value key
        if (castType === "array") {
          // just do nothing we're good for now
          // TODO: Enhance the if statement
        } else if (value[0]?.localeCode && value[0]?.value) {
          value = await Promise.all(
            value.map(async item => {
              return {
                localeCode: item.localeCode,
                value: await castValue(item.value),
              };
            }),
          );
        } else {
          value = await Promise.all(
            value.map(async item => {
              return await castValue(item);
            }),
          );
        }
      } else {
        value = await castValue(value);
      }

      if (Array.isArray(value)) {
        value = value.filter(value => value !== null && value !== undefined);
      }

      if (value !== undefined) {
        this.set(column, value);
      } else {
        this.unset(column);
      }
    }

    for (const column in this.customCasts) {
      const castType = this.customCasts[column];

      const value = await castType(this, column);

      if (value !== undefined) {
        this.set(column, value);
      } else {
        this.unset(column);
      }
    }
  }

  /**
   * Cast the given value based on the given cast type
   */
  protected castValue(value: any, castType: CastType) {
    const isEmptyValue = isEmpty(value);

    if (isEmptyValue) return undefined;

    switch (castType) {
      case "string":
        return isEmptyValue ? "" : String(value).trim();
      case "localized":
        // if (isEmptyValue) return [];

        // if (!Array.isArray(value)) return [];
        if (!Array.isArray(value)) return undefined;

        return value
          .filter(value => !isEmpty(value) && isPlainObject(value))
          .map(item => {
            return {
              localeCode: item.localeCode,
              value: item.value,
            };
          });
      case "number":
        // return isEmptyValue ? 0 : Number(value);
        return Number(value);
      case "int":
      case "integer":
        // return isEmptyValue ? 0 : parseInt(value);
        return parseInt(value);
      case "float":
        // return isEmptyValue ? 0 : parseFloat(value);
        return parseFloat(value);
      case "bool":
      case "boolean": {
        // if (isEmptyValue) return false;

        if (value === "true") return true;

        if (value === "false" || value === "0" || value === 0) return false;

        return Boolean(value);
      }
      case "date": {
        if (value instanceof Date) {
          return toUTC(value);
        }

        // if (isEmptyValue) return null;

        if (dayjs.isDayjs(value)) {
          return toUTC(value.toDate());
        }

        return toUTC(new Date(value));
      }
      case "location": {
        // if (isEmptyValue) return null;

        const lat = value?.[0] || value?.lat;
        const lng = value?.[1] || value?.lng;
        const address = value?.address || value?.formattedAddress;

        return {
          type: "Point",
          coordinates: [Number(lat), Number(lng)],
          address,
        };
      }
      case "object": {
        // if (isEmptyValue) return {};

        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch (error) {
            return undefined;
          }
        }

        return value;
      }
      case "array": {
        // if (isEmptyValue) return [];

        if (typeof value === "string") {
          return JSON.parse(value);
        }

        return value;
      }
      case "mixed":
      case "any":
      default:
        return value;
    }
  }

  /**
   * Check for default values
   */
  protected checkDefaultValues() {
    // if default value is empty, then do nothing
    if (isEmpty(this.defaultValue)) return;

    const defaultValue = { ...this.defaultValue };

    for (const key in defaultValue) {
      const value = defaultValue[key];

      if (typeof value === "function") {
        defaultValue[key] = value(this);
      }
    }

    // merge the data with default value
    this.data = merge(defaultValue, this.data);
  }

  /**
   * Destroy the model and delete it from database collection
   */
  public async destroy() {
    if (!this.data._id) return;

    if (this.deletedAtColumn) {
      this.set(this.deletedAtColumn, new Date());
    }

    const deleteStrategy: ModelDeleteStrategy =
      this.getStaticProperty("deleteStrategy");

    if (deleteStrategy === ModelDeleteStrategy.moveToTrash) {
      const collectionName = this.getCollection();
      class Trash extends Model {
        public static collection = collectionName + "Trash";
      }

      // we need to wrap the trash collection inside a model class so it get a generated timestamps and id
      Trash.create({
        document: this.data,
      });
    }

    const selfModelEvents = this.getModelEvents();

    const ModelEvents = this.getBaseModelEvents();

    await this.onDeleting();
    await selfModelEvents.trigger("deleting", this);
    await ModelEvents.trigger("deleting", this);

    // the document will be deleted from database collection if the delete strategy is not soft delete
    if (deleteStrategy !== ModelDeleteStrategy.softDelete) {
      await this.getQuery().deleteOne(this.getCollection(), {
        _id: this.data._id,
      });
    } else if (deleteStrategy === ModelDeleteStrategy.softDelete) {
      await this.getQuery().updateOne(
        this.getCollection(),
        {
          _id: this.data._id,
        },
        this.data,
      );
    }

    this.onDeleted();

    selfModelEvents.trigger("deleted", this);
    ModelEvents.trigger("deleted", this);

    this.syncDestruction();
  }

  /**
   * Determine if the given column is dirty column
   *
   * Dirty columns are columns that their values have been changed from the original data
   */
  public isDirty(column?: string) {
    if (!column) {
      return areEqual(clone(this.data), clone(this.originalData)) === false;
    }

    if (this.isNewModel()) return true;

    const currentValue = get(this.data, column);
    const originalValue = get(this.originalData, column);

    return areEqual(clone(currentValue), clone(originalValue)) === false;
  }

  /**
   * Check if current model is a new model
   */
  public isNewModel() {
    return !this.data._id || (this.data._id && this.isRestored);
  }

  /**
   * Get embedded data
   */
  public get embeddedData() {
    if (this.embedAllExcept.length > 0) {
      return except(this.data, this.embedAllExcept as string[]);
    }

    if (this.embedAllExceptTimestampsAndUserColumns) {
      return except(this.data, [
        this.createdAtColumn,
        this.updatedAtColumn,
        this.deletedAtColumn,
        this.createdByColumn,
        this.updatedByColumn,
        this.deletedByColumn,
      ]);
    }

    return this.embedded.length > 0 ? this.only(this.embedded) : this.data;
  }

  /**
   * Clone the model
   */
  public clone() {
    return new (this.constructor as any)(clone(this.data)) as this;
  }
}

export type ModelType = typeof Model;
