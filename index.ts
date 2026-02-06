import { Core } from "./core/core.ts";
import { pegarCurso } from "./core/database.ts";
import { bodyJson } from "./core/middleware/body-json.ts";
import { logger } from "./core/middleware/logger.ts";
import { RouteError } from "./core/utils/route-error.ts";

const core = new Core();

core.router.use([logger]);

core.router.get("/curso/:slug", (request, response) => {
  const { slug } = request.params.slug;
  const resultadoCurso = pegarCurso(slug);

  if (!resultadoCurso) {
    throw new RouteError(404, "Curso nao encontrados");
  }

  response.status(200).json(resultadoCurso);
});

core.init();
