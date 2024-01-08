export function oneOf(values: any[]) {
  return function castOneOf(value: any) {
    if (values.includes(value)) return value;

    return null;
  };
}

export function castEnum(enumType: any) {
  return function (value: any) {
    const enumList = Object.values(enumType);

    if (Array.isArray(value)) {
      return value.filter(item => {
        if (enumList.includes(item)) return true;

        return false;
      });
    }

    if (enumList.includes(value)) return value;

    return undefined;
  };
}
