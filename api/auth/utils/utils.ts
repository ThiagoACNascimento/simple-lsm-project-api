import { createHash, randomBytes } from "node:crypto";
import { promisify } from "node:util";

export const randomBytsAsync = promisify(randomBytes);

export function sha256(message: string) {
  return createHash("sha256").update(message).digest();
}
