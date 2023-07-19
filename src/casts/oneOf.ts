export function oneOf(values: any[]) {
  return function castOneOf(value: any) {
    if (values.includes(value)) return value;

    return null;
  };
}
