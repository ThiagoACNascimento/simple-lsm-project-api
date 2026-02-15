import type { Middleware } from "../router.ts";
import { RouteError } from "../utils/route-error.ts";

const MAX_BYTES = 5_000_000;

export const bodyJson: Middleware = async (request, respnse) => {
  if (
    request.headers["content-type"] !== "application/json" &&
    request.headers["content-type"] !== "application/json; charset=utf-8"
  ) {
    return;
  }

  const contentLength = Number(request.headers["content-length"]);
  if (!Number.isInteger(contentLength)) {
    throw new RouteError(400, "content-length invalido");
  }
  if (contentLength > MAX_BYTES) {
    throw new RouteError(413, "Corpo muito grande");
  }

  const chunks: Buffer[] = [];
  let size = 0;

  try {
    for await (const chunk of request) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buf.length;
      if (size > MAX_BYTES) {
        throw new RouteError(413, "Corpo muito grande");
      }
      chunks.push(buf);
    }
  } catch (error) {
    throw new RouteError(400, "Request abortado");
  }
  try {
    const body = Buffer.concat(chunks).toString("utf-8");
    if (body === "") {
      request.body = {};
      return;
    }

    request.body = JSON.parse(body);
  } catch (error) {
    throw new RouteError(400, "JSON invalido");
  }
};
