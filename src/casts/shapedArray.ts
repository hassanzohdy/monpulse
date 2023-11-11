export enum ShapedArrayType {
  String = "string",
  Number = "number",
  Boolean = "boolean",
  Date = "date",
}

export type ShapedArrayOfObject = {
  [key: string]: ShapedArrayType | ShapedArrayOfObject;
};

/**
 * Example of usage
 *
 * keywords: shapedArray({
 *  id: ShapedArrayType.Number,
 *  name: ShapedArrayType.String,
 *  description: ShapedArrayType.String,
 * })
 *
 * Array of strings
 * keywords: shapedArray(ShapedArrayType.String)
 *
 * Array of numbers
 * keywords: shapedArray(ShapedArrayType.Number)
 */

export function shapedArray(shape: ShapedArrayType | ShapedArrayOfObject) {
  console.log(shape);

  return (value: any) => {
    // because the model check if the value is an array, it will loop over it
    // so we'll get only one a value at a time

    // check if the value type is one of the allowed types
    if (typeof shape === "string") {
      if (
        typeof value === shape ||
        (shape === ShapedArrayType.Date && value instanceof Date)
      ) {
        return value;
      }
    } else {
      // if the value is an object, check if it has the same keys as the shape
      // and if the value of each key is one of the allowed types
      if (typeof value === "object") {
        const keys = Object.keys(shape);
        const valueKeys = Object.keys(value);

        // check if the value has the same keys as the shape
        if (keys.length === valueKeys.length) {
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const valueKey = valueKeys[i];

            if (key !== valueKey) {
              return null;
            }

            const type: ShapedArrayType | ShapedArrayOfObject = shape[key];

            if (typeof type === "string") {
              if (
                typeof value[valueKey] !== type &&
                (type !== ShapedArrayType.Date ||
                  !(value[valueKey] instanceof Date))
              ) {
                return null;
              }
            } else {
              // if the value is an object, check if it has the same keys as the shape
              // and if the value of each key is one of the allowed types
              if (typeof value[valueKey] === "object") {
                const keys: any[] = Object.keys(type);
                const valueKeys = Object.keys(value[valueKey]);

                // check if the value has the same keys as the shape
                if (keys.length === valueKeys.length) {
                  for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    const valueKey = valueKeys[i];

                    if (key !== valueKey) {
                      return null;
                    }

                    const type = shape[key];

                    if (typeof type === "string") {
                      if (
                        typeof value[valueKey] !== type &&
                        (type !== ShapedArrayType.Date ||
                          !(value[valueKey] instanceof Date))
                      ) {
                        return null;
                      }
                    } else {
                      return null;
                    }
                  }
                } else {
                  return null;
                }
              } else {
                return null;
              }
            }
          }
        } else {
          return null;
        }

        return value;
      }
    }
  };
}
