import { Api } from "../../core/utils/abstract.ts";
import { RouteError } from "../../core/utils/route-error.ts";

export class ProductsApi extends Api {
  handlers = {
    getProducts: (request, response) => {
      const { slug } = request.params;
      const products = this.db
        .query(/*sql*/ `SELECT * FROM "products" WHERE "slug" = ?;`)
        .get(slug);
      if (!products) {
        throw new RouteError(404, "produto nao encontrados");
      }

      response.status(200).json(products);
    },
  } satisfies Api["handlers"];

  tables(): void {
    this.db.exec(/*SQL*/ `
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
  }

  routes(): void {
    this.router.get("/products/:slug", this.handlers.getProducts);
  }
}
