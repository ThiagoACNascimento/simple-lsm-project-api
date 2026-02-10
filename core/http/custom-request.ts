import type { IncomingMessage } from "node:http";
import { parseCookies } from "../utils/parse-cookies.ts";

export interface CustomRequest extends IncomingMessage {
  query: URLSearchParams;
  pathname: string;
  body: Record<string, any>;
  params: Record<string, any>;
  cookies: Record<string, string | undefined>;
  ip: string;
}

export async function customRequest(req: IncomingMessage) {
  const request = req as CustomRequest;
  const url = new URL(request.url || "", "http://localhost");
  request.query = url.searchParams;
  request.pathname = url.pathname;
  request.params = {};
  request.body = {};
  request.cookies = parseCookies(request.headers.cookie);
  request.ip = request.socket.remoteAddress || "127.0.0.1";

  return request;
}
