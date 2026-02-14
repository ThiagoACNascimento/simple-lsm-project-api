import type { IncomingMessage } from "node:http";
import { parseCookies } from "../utils/parse-cookies.ts";
import type { UserRole } from "../../api/auth/query.ts";

export interface CustomRequest extends IncomingMessage {
  query: URLSearchParams;
  pathname: string;
  body: Record<string, any>;
  params: Record<string, any>;
  cookies: Record<string, string | undefined>;
  ip: string;
  session: { user_id: number; role: UserRole; expires_ms: number } | null;
  baseurl: string;
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
  request.session = null;
  request.baseurl = "http://localhost:3000";

  return request;
}
