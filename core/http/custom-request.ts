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
  request.body = {};

  return request;
}
