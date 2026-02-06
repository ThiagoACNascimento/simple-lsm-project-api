import { Core } from "./core/core.ts";
import { logger } from "./core/middleware/logger.ts";
import { RouteError } from "./core/utils/route-error.ts";

const core = new Core();

core.router.use([logger]);

core.db.exec(/*SQL*/ `
    CREATE TABLE IF NOT EXISTS "products"
    (
      "id" INTEGER PRIMARY KEY,
      "name" TEXT,
      "slug" TEXT NOT NULL UNIQUE,
      "price" INTEGER
    );

    INSERT OR IGNORE INTO "products"
      ("name", "slug", "price")
    VALUES
      ('Notebook', 'notebook', 3000);
  `);

core.router.get("/products/:slug", (request, response) => {
  const { slug } = request.params;
  const products = core.db
    .query(/*sql*/ `SELECT * FROM "products" WHERE "slug" = ?;`)
    .get(slug);
  if (!products) {
    throw new RouteError(404, "produto nao encontrados");
  }

  response.status(200).json(products);
});

core.init();
