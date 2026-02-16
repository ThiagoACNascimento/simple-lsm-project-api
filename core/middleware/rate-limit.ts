import { type Middleware } from "../router.ts";
import { RouteError } from "../utils/route-error.ts";

type Request = {
  hits: number;
  reset: number;
};

export const rateLimit = (time: number, max: number): Middleware => {
  const requests = new Map<string, Request>();

  setInterval(
    () => {
      const now = Date.now();
      for (const [key, item] of requests) {
        if (now >= item.reset) {
          requests.delete(key);
        }
      }
    },
    30 * 60 * 1000,
  ).unref();

  return (request, response) => {
    const key = request.ip;
    const now = Date.now();
    let value_of_key = requests.get(key);

    if (value_of_key === undefined || now >= value_of_key.reset) {
      value_of_key = {
        hits: 0,
        reset: now + time,
      };

      requests.set(key, value_of_key);
    }

    value_of_key.hits += 1;

    const request_left = Math.max(0, max - value_of_key.hits);
    const time_left_in_seconds = Math.ceil((value_of_key.reset - now) / 1000);
    const time_in_seconds = time / 1000;

    response.setHeader(
      "ReteLimit",
      `"default";r=${request_left};t=${time_left_in_seconds}`,
    );

    response.setHeader(
      "ReteLimit-Policy",
      `"default";q=${max};w=${time_in_seconds}`,
    );

    if (value_of_key.hits > max) {
      response.setHeader("Retry-After", `${time_left_in_seconds}`);
      throw new RouteError(429, "Rate-Limit");
    }
  };
};
