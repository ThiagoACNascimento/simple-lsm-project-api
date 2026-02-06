import type { Middleware } from "../router.ts";

export const bodyJson: Middleware = async (request, respnse) => {
  if (
    request.headers["content-type"] !== "application/json" &&
    request.headers["content-type"] !== "application/json; charset=utf-8"
  ) {
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString("utf-8");
  if (body === "") {
    request.body = {};
    return;
  }

  request.body = JSON.parse(body);
};
