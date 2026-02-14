import {
  type BinaryLike,
  createHmac,
  randomBytes,
  scrypt,
  type ScryptOptions,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const randoByTesAsync = promisify(randomBytes);

const scryptAsync: (
  password: BinaryLike,
  salt: BinaryLike,
  keylen: number,
  options?: ScryptOptions,
) => Promise<Buffer> = promisify(scrypt);

export class Password {
  PEPEER: string;
  NORM = "NFC";
  SCRYPT_OPTIONS: ScryptOptions = {
    N: 2 ** 14,
    r: 8,
    p: 1,
  };
  DERIVED_KEY_LENGTH = 32;
  SALT_LENGTH = 16;

  constructor(PEPEER: string) {
    this.PEPEER = PEPEER;
  }

  async hash(password: string) {
    const password_normalized = password.normalize(this.NORM);
    const password_hmac = createHmac("sha256", this.PEPEER)
      .update(password_normalized)
      .digest();

    const salt = await randoByTesAsync(this.SALT_LENGTH);

    const derivedKey = await scryptAsync(
      password_hmac,
      salt,
      this.DERIVED_KEY_LENGTH,
      this.SCRYPT_OPTIONS,
    );

    return `scrypt$v=1$norm=${this.NORM}$N=${this.SCRYPT_OPTIONS.N},r=${this.SCRYPT_OPTIONS.r},p=${this.SCRYPT_OPTIONS.p}$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
  }

  parse(password_hash: string) {
    const [id, version, norm, options, stored_salt_hex, stored_derivedKey_hex] =
      password_hash.split("$");
    const stored_derivedKey = Buffer.from(stored_derivedKey_hex, "hex");
    const stored_salt = Buffer.from(stored_salt_hex, "hex");
    const stored_norm = norm.replace("norm=", "");
    const stored_options = options.split(",").reduce((acc, keyValue) => {
      const [key, value] = keyValue.split("=", 2);
      acc[key] = Number(value);
      return acc;
    }, {});

    return {
      stored_options,
      stored_norm,
      stored_derivedKey,
      stored_salt,
    };
  }

  async verify(password: string, password_hash: string) {
    try {
      const { stored_options, stored_norm, stored_derivedKey, stored_salt } =
        this.parse(password_hash);

      const password_normalized = password.normalize(stored_norm);
      const password_hmac = createHmac("sha256", this.PEPEER)
        .update(password_normalized)
        .digest();

      const derivedKey = await scryptAsync(
        password_hmac,
        stored_salt,
        this.DERIVED_KEY_LENGTH,
        stored_options,
      );

      if (derivedKey.length !== stored_derivedKey.length) return false;

      return timingSafeEqual(derivedKey, stored_derivedKey);
    } catch (error) {
      return false;
    }
  }
}
