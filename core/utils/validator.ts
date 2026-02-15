import { RouteError } from "./route-error.ts";

const EMAIL_REGEX = /^[^@]+@[^@]+\.[^@]$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

function validateString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const string = value.trim();

  if (string.length === 0) {
    return undefined;
  }

  return string;
}

function validateNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string" && value.trim().length !== 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }

  return undefined;
}

function validateBoolean(value: unknown) {
  if (
    value === "false" ||
    value === false ||
    value === "0" ||
    value === 0 ||
    value === "off"
  ) {
    return false;
  }

  if (
    value === "true" ||
    value === true ||
    value === "1" ||
    value === 1 ||
    value === "on"
  ) {
    return true;
  }

  return undefined;
}

function validateObject(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function validateEmail(value: unknown) {
  const email = validateString(value)?.toLowerCase();

  if (email === undefined) {
    return undefined;
  }

  return EMAIL_REGEX.test(email) ? email : undefined;
}

function validatePassword(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  if (value.length < 8 || value.length > 256) {
    return undefined;
  }

  return PASSWORD_REGEX.test(value) ? value : undefined;
}

type Parse<Value> = (value: unknown) => Value | undefined;

function valueRequired<Value>(func: Parse<Value>, error: string) {
  return (value: unknown) => {
    const result = func(value);

    if (result === undefined) {
      throw new RouteError(422, error);
    }

    return result;
  };
}

export const validator = {
  validateString: valueRequired(validateString, "String esperada"),
  validateNumber: valueRequired(validateNumber, "Numero esperado"),
  validateBoolean: valueRequired(validateBoolean, "Boolean esperado"),
  validateObject: valueRequired(validateObject, "Objeto esperado"),
  validateEmail: valueRequired(validateEmail, "Email invalido"),
  validatePassword: valueRequired(validatePassword, "Senha invalida"),
  optional: {
    validateString,
    validateNumber,
    validateBoolean,
    validateObject,
    validateEmail,
    validatePassword,
  },
};
