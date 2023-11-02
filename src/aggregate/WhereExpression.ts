import { isPlainObject } from "@mongez/supportive-is";
import { toUTC } from "@mongez/time-wizard";
import { Filter } from "../model";
import { $agg } from "./expressions";
import { MongoDBOperator, WhereOperator } from "./types";

function escapeString(value: string) {
  return String(value).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

function escapeRegex(value: string | RegExp, escapeOnly = false) {
  if (value instanceof RegExp === false) {
    // escape the value special characters
    value = escapeString(value as string);

    if (escapeOnly === false) {
      value = new RegExp(value, "gi");
    }
  }

  return value;
}

export function parseValuesInObject(valuesObject: any) {
  for (const key in valuesObject) {
    const value = valuesObject[key];
    if (value instanceof Date) {
      valuesObject[key] = toUTC(value);
    }
  }

  return valuesObject;
}

export class WhereExpression {
  /**
   * Operators list
   */
  public static readonly operators: Record<WhereOperator, MongoDBOperator> = {
    "=": "$eq",
    "!=": "$ne",
    not: "$not",
    ">": "$gt",
    ">=": "$gte",
    "<": "$lt",
    "<=": "$lte",
    in: "$in",
    nin: "$nin",
    notIn: "$nin",
    all: "$all",
    exists: "$exists",
    type: "$type",
    mod: "$mod",
    regex: "$regex",
    between: "$between",
    notBetween: "$between",
    geoIntersects: "$geoIntersects",
    geoWithin: "$geoWithin",
    near: "$near",
    nearSphere: "$nearSphere",
    elemMatch: "$elemMatch",
    size: "$size",
    like: "$regex",
    notLike: "$regex",
    startsWith: "$regex",
    endsWith: "$regex",
    notStartsWith: "$regex",
    notEndsWith: "$regex",
  };

  /**
   * Where query
   */
  public static parse(column: string, value: any): Filter;
  public static parse(filter: Filter): Filter;
  public static parse(
    column: string,
    operator: WhereOperator,
    value: any,
  ): Filter;
  public static parse(...args: any[]) {
    if (args.length === 1 && isPlainObject(args[0]))
      return parseValuesInObject(args[0]);

    const column: string = args[0];
    let operator: WhereOperator = args[1];
    let value: any = args[2];

    // if the length is two, then the operator will be =
    if (args.length === 2) {
      value = operator;
      operator = "=";
    }

    if (operator === "like") {
      value = new RegExp(escapeRegex(value), "gi");
    } else if (operator === "notLike") {
      value = new RegExp(escapeRegex(value), "gi");
      operator = "not";
      value = {
        $regex: value,
      };
    } else if (operator === "startsWith") {
      value = escapeRegex(value, true);
      value = new RegExp(`^${value}`);
    } else if (operator === "endsWith") {
      value = escapeRegex(value, true);
      value = new RegExp(`${value}$`);
    } else if (operator === "notStartsWith") {
      value = escapeRegex(value, true);
      value = {
        $regex: new RegExp(`^${value}`),
      };

      operator = "not";
    } else if (operator === "notEndsWith") {
      value = escapeRegex(value, true);

      value = {
        $regex: new RegExp(`${value}$`),
      };

      operator = "not";
    }

    if (value instanceof Date) {
      value = toUTC(value);
    } else if (Array.isArray(value)) {
      value = value.map(item => {
        if (item instanceof Date) {
          return toUTC(item);
        }

        return item;
      });
    }

    let expression = {
      [WhereExpression.operators[operator as WhereOperator]]: value,
    };

    if (operator === "in" && typeof value === "string") {
      expression = {
        $in: $agg.columnName(value),
      };
    } else if (operator === "notIn" && typeof value === "string") {
      expression = {
        $not: {
          $in: $agg.columnName(value),
        },
      };
    } else if (operator === "between") {
      expression = {
        $gte: value[0],
        $lte: value[1],
      };
    } else if (operator === "notBetween") {
      expression = {
        $not: {
          $gte: value[0],
          $lte: value[1],
        },
      };
    }
    // now add the data
    return {
      [column]: expression,
    };
  }
}

export const toOperator = (operator: WhereOperator) => {
  return WhereExpression.operators[operator];
};
