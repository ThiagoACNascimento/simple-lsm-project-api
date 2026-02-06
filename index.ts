import { Core } from "./core/core.ts";
import { pegarCurso } from "./core/database.ts";

const core = new Core();

core.router.get("/curso/:slug", (request, response) => {
  const slug = request.params.slug;
  const resultadoCurso = pegarCurso(slug);
  if (resultadoCurso) {
    response.status(200).json(resultadoCurso);
  } else {
    response.status(404).json("Curso nao encontrados");
  }
});

core.init();
