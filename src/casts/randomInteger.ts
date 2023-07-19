import { Random } from "@mongez/reinforcements";

export function randomInteger(min: number, max: number) {
  return (value: any) => {
    if (value) return value;

    return Random.integer(min, max);
  };
}
