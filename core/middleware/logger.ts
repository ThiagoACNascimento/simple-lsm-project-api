import type { Middleware } from "../router.ts";

export const logger: Middleware = (request, response) => {
  console.log(`${request.method} ${request.pathname}`);
};
