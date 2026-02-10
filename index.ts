import { Core } from "./core/core.ts";
import { logger } from "./core/middleware/logger.ts";
import { AuthApi } from "./api/auth/index.ts";
import { LmsApi } from "./api/lms/index.ts";
import { readFile } from "node:fs/promises";

const core = new Core();

core.router.use([logger]);

new AuthApi(core).init();
new LmsApi(core).init();

core.router.get("/", async (request, response) => {
  const index_html = await readFile("./front/index.html", "utf-8");
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.status(200).end(index_html);
});

core.init();
