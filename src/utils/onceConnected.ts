import { connection } from "../connection";

export function onceConnected(callback: any) {
  if (connection.isConnected()) {
    callback();
  } else {
    connection.on("connected", callback);
  }
}
