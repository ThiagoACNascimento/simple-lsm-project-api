import type { IncomingMessage } from "node:http";

export interface CustomRequest extends IncomingMessage {
  query: URLSearchParams;
  pathname: string;
  body: Record<string, any>;
  params: Record<string, any>;
}

export async function customRequest(req: IncomingMessage) {
  const request = req as CustomRequest;
  const url = new URL(request.url || "", "http://localhost");
  request.query = url.searchParams;
  request.pathname = url.pathname;
  request.params = {};

  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString("utf-8");

  if (request.headers["content-type"] === "application/json") {
    request.body = JSON.parse(body);
  } else {
    request.body = {};
  }

  return request;
}
