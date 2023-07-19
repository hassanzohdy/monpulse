import { GenericObject, ltrim } from "@mongez/reinforcements";
import Is from "@mongez/supportive-is";

/**
 * Get count expression
 */
export function count(column?: string) {
  return wrapExpressionWithColumn(
    {
      $sum: 1,
    },
    column,
  );
}

/**
 * Parse the given column
 */
export const columnName = (column: string) => `$${ltrim(column, "$")}`;

function wrapExpressionWithColumn(expression: any, column?: string) {
  if (column) {
    return {
      [columnName(column)]: expression,
    };
  }

  return expression;
}

/**
 * Get sum expression
 */
export function sum(column: string, baseColumn?: string) {
  return wrapExpressionWithColumn(
    {
      $sum: columnName(column),
    },
    baseColumn,
  );
}

/**
 * Get average expression
 */
export const average = avg;
export function avg(column: string) {
  return {
    $avg: columnName(column),
  };
}

/**
 * Get min expression
 */
export function min(column: string) {
  return {
    $min: columnName(column),
  };
}

/**
 * Get max expression
 */
export function max(column: string) {
  return {
    $max: columnName(column),
  };
}

/**
 * Get first expression
 */
export function first(column: string) {
  return {
    $first: columnName(column),
  };
}

/**
 * Get last expression
 */
export function last(column: string) {
  return {
    $last: columnName(column),
  };
}

/**
 * Get push expression
 */
export function push(data: any) {
  if (typeof data === "string") {
    data = columnName(data);
  }

  return {
    $push: data,
  };
}

/**
 * Get addToSet expression
 */
export function addToSet(column: string) {
  return {
    $addToSet: columnName(column),
  };
}

/**
 * Get year expression
 */
export function year(column: string) {
  return {
    $year: columnName(column),
  };
}

/**
 * Get first value of year expression
 */
export function firstYear(column: string) {
  return {
    $first: {
      $year: columnName(column),
    },
  };
}

/**
 * Get last value of year expression
 */
export function lastYear(column: string) {
  return {
    $last: {
      $year: columnName(column),
    },
  };
}

/**
 * Get month expression
 */
export function month(column: string) {
  return {
    $month: columnName(column),
  };
}

/**
 * Get first value of month expression
 */
export function firstMonth(column: string) {
  return {
    $first: {
      $month: columnName(column),
    },
  };
}

/**
 * Get last value of month expression
 */
export function lastMonth(column: string) {
  return {
    $last: {
      $month: columnName(column),
    },
  };
}

/**
 * Get day of month expression
 */
export function dayOfMonth(column: string) {
  return {
    $dayOfMonth: columnName(column),
  };
}

/**
 * Get first day of month expression
 */
export function firstDayOfMonth(column: string) {
  return {
    $first: {
      $dayOfMonth: columnName(column),
    },
  };
}

/**
 * Get last day of month expression
 */
export function lastDayOfMonth(column: string) {
  return {
    $last: {
      $dayOfMonth: columnName(column),
    },
  };
}

/**
 * Get day of week expression
 */
export function dayOfWeek(column: string) {
  return {
    $dayOfWeek: columnName(column),
  };
}

/**
 * Return list of columns
 */
export function columns(...columns: string[]) {
  return columns.reduce((selections: GenericObject, column) => {
    selections[column] = columnName(column);

    return selections;
  }, {});
}

/** Match helpers */

/**
 * Get greater than expression
 */
export const greaterThan = gt;
export function gt(value: any, column?: string) {
  return wrapExpressionWithColumn(
    {
      $gt: value,
    },
    column,
  );
}

/**
 * Get greater than or equal expression
 */
export const greaterThanOrEqual = gt;
export function gte(value: any, column?: string) {
  return wrapExpressionWithColumn(
    {
      $gte: value,
    },
    column,
  );
}

/**
 * Get less than expression
 */
export const lessThan = lt;
export function lt(value: any, column?: string) {
  return wrapExpressionWithColumn(
    {
      $lt: value,
    },
    column,
  );
}

/**
 * Get less than or equal expression
 */
export const lessThanOrEqual = lt;
export function lte(value: any, column?: string) {
  return wrapExpressionWithColumn(
    {
      $lte: value,
    },
    column,
  );
}

/**
 * Get equal expression
 */
export const equal = eq;
export function eq(...values: any) {
  return {
    $eq: values,
  };
}

/**
 * Get not equal expression
 */
export const notEqual = ne;
export function ne(value: any) {
  return {
    $ne: value,
  };
}

/**
 * Get in array expression
 */
export function inArray(value: any) {
  return {
    $in: value,
  };
}

/**
 * Get not in array expression
 */
export const notIn = nin;
export const notInArray = nin;
export function nin(value: any) {
  return {
    $nin: value,
  };
}

/**
 * Get exists expression
 */
export function exists(value: any, column?: string) {
  return wrapExpressionWithColumn(
    {
      $exists: value,
    },
    column,
  );
}

/**
 * Get not exists expression
 */
export function notExists(value: any, column?: string) {
  return wrapExpressionWithColumn(
    {
      $exists: value,
    },
    column,
  );
}

/**
 * Get like expression
 */
export function like(value: any, column?: string) {
  if (Is.scalar(value)) {
    value = new RegExp(value, "i");
  }

  return wrapExpressionWithColumn(
    {
      $regex: value,
    },
    column,
  );
}

/**
 * Get not like expression
 */
export function notLike(value: any, column?: string) {
  if (Is.scalar(value)) {
    value = new RegExp(value, "i");
  }

  return wrapExpressionWithColumn(
    {
      $not: {
        $regex: value,
      },
    },
    column,
  );
}

/**
 * Get not null expression
 */
export function notNull(column?: string) {
  return wrapExpressionWithColumn(
    {
      $ne: null,
    },
    column,
  );
}

/**
 * Get null expression
 */
export function isNull(column?: string) {
  return wrapExpressionWithColumn(
    {
      $eq: null,
    },
    column,
  );
}

/**
 * Get between expression
 */
export function between(minValue: any, maxValue: any, column?: string) {
  return wrapExpressionWithColumn(
    {
      $gte: minValue,
      $lte: maxValue,
    },
    column,
  );
}

/**
 * Get not between expression
 */
export function notBetween(minValue: any, maxValue: any, column?: string) {
  return wrapExpressionWithColumn(
    {
      $not: {
        $gte: minValue,
        $lte: maxValue,
      },
    },
    column,
  );
}

/**
 * Get concat expression
 */
export function concat(...columns: string[]) {
  return {
    $concat: columns,
  };
}

export const merge = concat;

/**
 * Concat columns with separator between each column
 */
export function concatWith(separator: string, ...columns: string[]) {
  const columnsList = [];

  for (const column of columns) {
    columnsList.push(columnName(column), separator);
  }

  return {
    $concat: columnsList,
  };
}

export const mergeWith = concatWith;

/**
 * Get cond expression
 */
export function cond(
  condition: any,
  ifTrue: any,
  ifFalse: any,
  column?: string,
) {
  return wrapExpressionWithColumn(
    {
      $cond: {
        if: condition,
        then: ifTrue,
        else: ifFalse,
      },
    },
    column,
  );
}

export const condition = cond;

/**
 * Boolean condition
 */
export function booleanCond(condition: any, column?: string) {
  return wrapExpressionWithColumn(
    {
      $cond: {
        if: condition,
        then: true,
        else: false,
      },
    },
    column,
  );
}

/**
 * Get regex expression
 */
export function regex(value: RegExp, column?: string) {
  return wrapExpressionWithColumn(
    {
      $regex: value,
    },
    column,
  );
}

/**
 * You can use it when you want a field to match all the given values
 */
export function all(values: any[], column?: string) {
  return wrapExpressionWithColumn(
    {
      $all: values,
    },
    column,
  );
}

/**
 * Multiple expressions
 */
export function _multiply(...expressions: any[]) {
  return {
    $multiply: expressions,
  };
}

/**
 * Multiple columns
 */
export function multiply(...columns: string[]) {
  return {
    $multiply: columns.map(columnName),
  };
}

/**
 * Divide expressions
 */
export function _divide(...expressions: any[]) {
  return {
    $divide: expressions,
  };
}

/**
 * Divide columns
 */
export function divide(...columns: string[]) {
  return {
    $divide: columns.map(columnName),
  };
}

export function expr(expression: any) {
  return {
    $expr: expression,
  };
}

export const $agg = {
  // list all aggregation functions
  count,
  sum,
  avg,
  multiply: multiply,
  divide: divide,
  _divide,
  _multiply,
  average,
  min,
  max,
  first,
  last,
  push,
  addToSet,
  all,
  year,
  firstYear,
  lastYear,
  month,
  firstMonth,
  lastMonth,
  firstDayOfMonth,
  lastDayOfMonth,
  dayOfMonth,
  dayOfWeek,
  columns,
  gt,
  greaterThan,
  gte,
  greaterThanOrEqual,
  lt,
  lessThan,
  lte,
  lessThanOrEqual,
  eq,
  equal,
  ne,
  notEqual,
  inArray,
  nin,
  notIn,
  notInArray,
  exists,
  notExists,
  like,
  notLike,
  notNull,
  isNull,
  between,
  notBetween,
  concat,
  merge,
  concatWith,
  mergeWith,
  columnName,
  booleanCond,
  cond,
  regex,
  expr,
};
