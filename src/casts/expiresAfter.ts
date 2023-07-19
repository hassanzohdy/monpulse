import dayjs, { ManipulateType } from "dayjs";

export function expiresAfter(duration: number, unit: ManipulateType) {
  return () => {
    return dayjs().add(duration, unit).toDate();
  };
}
