import type { ServerResponse } from "node:http";

export interface CustomResponse extends ServerResponse {
  status(statusCode: number): CustomResponse;
  json(data: any): void;
  setCookie(cookie: string): void;
}

export function customResponse(req: ServerResponse) {
  const response = req as CustomResponse;
  response.status = (statusCode) => {
    response.statusCode = statusCode;
    return response;
  };

  response.json = (data) => {
    try {
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(data));
    } catch {
      response.status(500).end("error");
    }
  };

  response.setCookie = (cookie) => {
    const current = response.getHeader("Set-Cookie");

    if (!current) {
      response.setHeader("Set-Cookie", [cookie]);
      return;
    }

    if (Array.isArray(current)) {
      current.push(cookie);
      response.setHeader("Set-Cookie", current);
      return;
    }

    response.setHeader("Set-Cookie", [String(current), cookie]);
  };

  return response;
}
