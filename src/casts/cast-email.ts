import { isEmail } from "@mongez/supportive-is";

export function castEmail(value: string) {
  if (!isEmail(value)) return null;
  return String(value).toLowerCase();
}
