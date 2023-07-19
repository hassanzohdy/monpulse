import { Random } from "@mongez/reinforcements";

export function randomString(length = 32) {
  return () => {
    return Random.string(length);
  };
}
