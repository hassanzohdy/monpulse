import { GenericObject } from "@mongez/reinforcements";
import { Collection, Document } from "mongodb";

/** Collection name */
type CollectionName = string;

/** Data */
type Data = GenericObject;

/** Collection With Data */
type CollectionWithData = {
  collection: CollectionName;
  data: Data;
};

/** Query */
type Query = Collection<Document>;

/** Collection + Data + Query */
type CollectionWithDataAndQuery = CollectionWithData & {
  query: Query;
};

/** Collection + Data + Query + Is many */
type CollectionWithDataAndQueryAndIsMany = CollectionWithDataAndQuery & {
  isMany: boolean;
};

/** Collection + Data + Query + Is many + Document */
type CollectionWithDataAndQueryAndIsManyAndDocument =
  CollectionWithDataAndQueryAndIsMany & {
    document: Document;
  };

type EventPayload = CollectionWithDataAndQueryAndIsManyAndDocument & {
  filter: GenericObject;
  documents: Document[];
};

export type CreatingEventPayload = CollectionWithDataAndQueryAndIsMany;

export type CreatedEventPayload = Omit<
  CollectionWithDataAndQueryAndIsManyAndDocument,
  "data" | "query"
>;
export type UpdatingEventPayload = Pick<
  EventPayload,
  "collection" | "data" | "query" | "isMany" | "filter"
>;

export type UpdatedEventPayload = {
  collection: string;
  documents?: Document[];
  document?: Document | null;
  isMany: boolean;
};

export type ReplacingEventPayload = GenericObject;
export type ReplacedEventPayload = GenericObject;
export type UpsertingEventPayload = GenericObject;
export type UpsertedEventPayload = GenericObject;
export type SavingEventPayload = GenericObject;
export type SavedEventPayload = GenericObject;
export type DeletingEventPayload = GenericObject;
export type DeletedEventPayload = GenericObject;
export type FetchingEventPayload = GenericObject;
export type FetchedEventPayload = GenericObject;
export type CountingEventPayload = GenericObject;
export type CountedEventPayload = GenericObject;
export type ExplainingEventPayload = GenericObject;
export type ExplainedEventPayload = GenericObject;
export type AggregatingEventPayload = GenericObject;
export type AggregatedEventPayload = GenericObject;
