export function arrayOf(values: any[]) {
  return (value: any) => {
    if (Array.isArray(value)) {
      const array: any[] = [];

      for (const valueItem of value) {
        if (values.includes(valueItem)) {
          array.push(valueItem);
        }
      }

      return array;
    }

    if (values.includes(value)) {
      return [value];
    }

    return null;
  };
}
