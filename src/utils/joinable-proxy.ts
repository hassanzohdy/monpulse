import { type Joinable, type JoinableProxy } from "../model";

export function joinableProxy(joinable: Joinable) {
  return new Proxy(joinable, {
    set(target: Joinable, property: string, value: any) {
      (target as any)[property] = value;

      return true;
    },
    get(target: Joinable, property: string, receiver: any) {
      if ((target as any)[property]) {
        return Reflect.get(target, property, receiver);
      }

      return Reflect.get(target.query, property, receiver);
    },
  }) as JoinableProxy;
}
