import { pipeline } from "node:stream/promises";
import { Api } from "../../core/utils/abstract.ts";
import { createReadStream, createWriteStream } from "node:fs";
import { rename, rm, stat } from "node:fs/promises";
import { validator } from "../../core/utils/validator.ts";
import path from "node:path";
import { RouteError } from "../../core/utils/route-error.ts";
import { checkETag, limitBytes, mimeType } from "./utils.ts";
import { randomUUID } from "node:crypto";

const MAX_BYTES = 150 * 1024 * 1024;
const FILES_PATH = "./files";

export class FilesApi extends Api {
  handlers = {
    uploadFile: async (request, response) => {
      if (request.headers["content-type"] !== "application/octet-stream") {
        throw new RouteError(415, "Use octet-sream");
      }

      const contentLength = Number(request.headers["content-length"]);

      if (!Number.isInteger(contentLength)) {
        throw new RouteError(400, "contet-length invalido");
      }

      if (contentLength > MAX_BYTES) {
        throw new RouteError(413, "Corpo Grande");
      }

      const name = validator.validateFiles(request.headers["x-filename"]);
      const now = Date.now();
      const extencion = path.extname(name);
      const finalName = `${name.replace(extencion, "")}-${now}${extencion}`;
      const temp_path = path.join(FILES_PATH, `${randomUUID()}.temp`);
      const write_path = path.join(FILES_PATH, finalName);
      const write_stream = createWriteStream(temp_path, { flags: "wx" });

      try {
        await pipeline(request, limitBytes(MAX_BYTES), write_stream);
        await rename(temp_path, write_path);
        response.status(201).end("Ok");
      } catch (error) {
        if (error instanceof RouteError) {
          throw new RouteError(error.status, error.message);
        } else {
          throw new RouteError(500, "Error");
        }
      } finally {
        await rm(temp_path, { force: true }).catch(() => {});
      }
    },

    sendFile: async (request, response) => {
      const name = validator.validateFiles(request.params.name);
      const file_path = path.join(FILES_PATH, name);
      const extencion_name = path.extname(name);
      let file_stat;

      try {
        file_stat = await stat(file_path);
      } catch (error) {
        throw new RouteError(404, "Arquivo nao encontrado");
      }

      const etag = `W/${file_stat.size.toString(16)}-${Math.floor(file_stat.mtimeMs).toString(16)}`;

      response.setHeader("ETag", etag);
      response.setHeader("Content-Length", file_stat.size);
      response.setHeader("Content-Modified", file_stat.mtime.toUTCString());
      response.setHeader(
        "Content-Type",
        mimeType[extencion_name] || "application/octet-stream",
      );
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.setHeader("Cache-Control", "public, max-age=0, must-revalidate");

      if (checkETag(request.headers["if-none-match"], etag)) {
        response.status(304);
        response.end();
        return;
      }

      response.status(200);

      const file = createReadStream(file_path);
      await pipeline(file, response);
    },
  } satisfies Api["handlers"];

  routes(): void {
    this.router.post("/files", this.handlers.uploadFile);
    this.router.get("/files/:name", this.handlers.sendFile);
  }
}
