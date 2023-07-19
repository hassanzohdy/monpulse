import Is from "@mongez/supportive-is";

export function castEmail(value: string) {
  if (!Is.email(value)) return null;
  return String(value).toLowerCase();
}
