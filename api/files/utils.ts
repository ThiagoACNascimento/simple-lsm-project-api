import { Transform } from "node:stream";
import { RouteError } from "../../core/utils/route-error.ts";

export const mimeType: Record<string, string> = {
  ".ico": "image/x-icon",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
};

export function checkETag(match: string | undefined, etag: string) {
  if (!match) return false;

  const tags = match.split(",").map((s) => s.trim());

  return tags.includes(etag);
}

export function limitBytes(max: number) {
  let size = 0;
  return new Transform({
    transform(chunk, _enc, next) {
      size += chunk.length;
      if (size > max) {
        return next(new RouteError(400, "Corpo muito grande"));
      }
      next(null, chunk);
    },
  });
}
