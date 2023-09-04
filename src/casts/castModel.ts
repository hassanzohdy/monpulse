import { isEmpty } from "@mongez/supportive-is";
import { Model } from "../model";

export function castModel(
  model: typeof Model,
  embeddedKey: string | string[] = "embeddedData",
) {
  return async function injectEmbeddedData(value: any) {
    if (Array.isArray(value)) {
      const results: any[] = [];
      for (const item of value) {
        if (value instanceof Model) {
          results.push(getModelData(item, embeddedKey));
        } else if (item?.id) {
          results.push(item);
        }
      }

      if (results.length > 0) return results;

      const records: Model[] = await model
        .aggregate()
        .whereIn(
          "id",
          value.map(value => Number(value.id || value)),
        )
        .get();

      const documents = records
        .map(record => {
          return getModelData(record, embeddedKey);
        })
        .filter(value => !isEmpty(value));

      // now we need to order documents same as the value
      const orderedDocuments: any[] = [];

      for (const item of value) {
        const document = documents.find(document => document.id === item.id);
        if (document) {
          orderedDocuments.push(document);
        }
      }

      return orderedDocuments;
    }

    if (value instanceof Model) return getModelData(value, embeddedKey);

    if (value?.id) return value;

    const record: any = await model.find(Number(value));

    if (!record) return null;

    return getModelData(record, embeddedKey);
  };
}

function getModelData(model: Model, embeddedKey: string | string[]) {
  if (Array.isArray(embeddedKey)) {
    return model.only(embeddedKey);
  }

  return (model as any)[embeddedKey];
}
