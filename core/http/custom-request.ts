import type { IncomingMessage } from "node:http";
import { parseCookies } from "../utils/parse-cookies.ts";
import type { UserRole } from "../../api/auth/query.ts";
import { SERVER_NAME } from "../../env.ts";

export interface CustomRequest extends IncomingMessage {
  query: URLSearchParams;
  pathname: string;
  body: Record<string, unknown>;
  params: Record<string, string>;
  cookies: Record<string, string | undefined>;
  ip: string;
  session: { user_id: number; role: UserRole; expires_ms: number } | null;
  baseurl: string;
}

function getIp(ip: string | string[] | undefined) {
  if (ip === undefined) return "";
  if (typeof ip === "string") return ip.split(",")[0].trim();
  if (Array.isArray(ip) && typeof ip[0] === "string") return ip[0];
  return "";
}

export function customRequest(req: IncomingMessage) {
  const request = req as CustomRequest;
  request.baseurl = `https://${SERVER_NAME}`;
  const url = new URL(request.url || "", request.baseurl);

  request.query = url.searchParams;
  request.pathname = url.pathname;
  request.params = {};
  request.body = {};
  request.cookies = parseCookies(request.headers.cookie);
  request.ip = getIp(request.headers["x-forwarded-for"]);
  request.session = null;

  return request;
}
