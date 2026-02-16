import { Api } from "../../core/utils/abstract.ts";
import { RouteError } from "../../core/utils/route-error.ts";
import { validator } from "../../core/utils/validator.ts";
import { LmsQuery } from "./query.ts";
import { lmsTables } from "./tables.ts";
import { AuthMiddleware } from "../auth/middleware/auth.ts";

export class LmsApi extends Api {
  query = new LmsQuery(this.db);
  auth = new AuthMiddleware(this.core);

  handlers = {
    postCourse: (request, response) => {
      if (!request.session) {
        throw new RouteError(401, "Nao autorizado");
      }

      const { slug, title, description, lessons, hours } = {
        slug: validator.validateString(request.body.slug),
        title: validator.validateString(request.body.title),
        description: validator.validateString(request.body.description),
        lessons: validator.validateNumber(request.body.lesson),
        hours: validator.validateNumber(request.body.hours),
      };

      const writeResult = this.query.insertCourse({
        slug,
        title,
        description,
        lessons,
        hours,
      });

      if (writeResult.changes === 0) {
        throw new RouteError(400, "Erro ao criar curso.");
      }

      response.status(201).json({
        id: writeResult.lastInsertRowid,
        changes: writeResult.changes,
        title: "Curso criado!",
      });
    },

    getCourses: (request, response) => {
      const courses = this.query.selectCourses();

      if (courses.length === 0) {
        throw new RouteError(404, "Nenhum curso encontrado");
      }

      response.status(200).json(courses);
    },

    getCourse: (request, response) => {
      const { slug } = request.params;
      const course = this.query.selectCourse(slug);
      const lessons = this.query.selectLessons(slug);

      if (!course) {
        throw new RouteError(404, "Nenhum curso encontrado");
      }

      let completed: {
        lesson_id: number;
        completed: string;
      }[] = [];

      if (request.session) {
        completed = this.query.selectLessonsCompleted(
          request.session.user_id,
          course.id,
        );
      }

      response.status(200).json({ course, lessons, completed });
    },

    postLesson: (request, response) => {
      if (!request.session) {
        throw new RouteError(401, "Nao autorizado");
      }

      const {
        courseSlug,
        slug,
        title,
        seconds,
        video,
        description,
        order,
        free,
      } = {
        courseSlug: validator.validateString(request.body.courseSlug),
        slug: validator.validateString(request.body.slug),
        title: validator.validateString(request.body.title),
        seconds: validator.validateNumber(request.body.seconds),
        video: validator.validateString(request.body.video),
        description: validator.validateString(request.body.description),
        order: validator.validateNumber(request.body.order),
        free: validator.validateNumber(request.body.free),
      };
      const writeResult = this.query.insertLesson({
        courseSlug,
        slug,
        title,
        seconds,
        video,
        description,
        order,
        free,
      });
      if (!writeResult.changes) {
        throw new RouteError(400, "Erro ao criar aula.");
      }

      response.status(201).json({
        id: writeResult.lastInsertRowid,
        changes: writeResult.changes,
        title: "Aula criado!",
      });
    },

    postCompletedLesson: (request, response) => {
      if (!request.session) {
        throw new RouteError(401, "Nao autorizado");
      }

      const { courseId, lessonId } = {
        courseId: validator.validateNumber(request.body.courseId),
        lessonId: validator.validateNumber(request.body.lessonId),
      };

      const writeResult = this.query.insertLessonCompleted(
        request.session.user_id,
        courseId,
        lessonId,
      );

      if (writeResult.changes === 0) {
        throw new RouteError(400, "Erro ao completar aula.");
      }

      const progress = this.query.selectProgress(
        request.session.user_id,
        courseId,
      );
      const incompliteLessons = progress.filter((item) => !item.completed);
      if (progress.length > 0 && incompliteLessons.length === 0) {
        const result = this.query.insertCertificate(
          request.session.user_id,
          courseId,
        );

        if (!result) {
          throw new RouteError(400, "Erro ao gerar certificado");
        }

        response.status(201).json({
          title: "Aula completada.",
          certificate: result.id,
        });
      }

      response.status(201).json({
        title: "Aula completada.",
        certificate: null,
      });
      return;
    },

    getLesson: (request, response) => {
      const { courseSlug, lessonSlug } = request.params;
      const lesson = this.query.selectLesson(courseSlug, lessonSlug);
      const nav = this.query.selectLessonNav(courseSlug, lessonSlug);

      if (!lesson) {
        throw new RouteError(404, "Aula nao encontrada");
      }

      const indexLessonNav = nav.findIndex(
        (lessonNav) => lessonNav.slug === lesson.slug,
      );
      const indexPrev =
        indexLessonNav === 0 ? null : nav.at(indexLessonNav - 1)?.slug;
      const indexNext = nav.at(indexLessonNav + 1)?.slug ?? null;

      let completed = "";
      if (request.session) {
        const lessonCompleted = this.query.selectLessonCompleted(
          request.session.user_id,
          lesson.id,
        );
        if (lessonCompleted) {
          completed = lessonCompleted.completed;
        }
      }

      response.status(200).json({ ...lesson, indexPrev, indexNext, completed });
    },

    resetCourse: (request, response) => {
      if (!request.session) {
        throw new RouteError(401, "Nao autorizado");
      }
      const { courseId } = {
        courseId: validator.validateNumber(request.body.courseId),
      };
      const writeResult = this.query.deleteLessonsCopleted(
        request.session.user_id,
        courseId,
      );

      if (writeResult.changes === 0) {
        throw new RouteError(400, "Erro no reset do curso");
      }

      response.status(200).json({
        title: "Curso resetado.",
      });
    },

    getCertificates: (request, response) => {
      if (!request.session) {
        throw new RouteError(401, "Nao autorizado");
      }

      const certificates = this.query.selectCertificates(
        request.session.user_id,
      );

      if (certificates.length === 0) {
        throw new RouteError(400, "Nenhum certificado encontrado!");
      }

      response.status(200).json(certificates);
    },

    getCertificate: (request, response) => {
      const { certificateId } = request.params;
      const certificate = this.query.selectCertificate(certificateId);

      if (!certificate) {
        throw new RouteError(400, "Certificado nao encontrado!");
      }

      response.status(200).json(certificate);
    },
  } satisfies Api["handlers"];

  tables(): void {
    this.db.exec(lmsTables);
  }

  routes(): void {
    this.router.post("/lms/course", this.handlers.postCourse, [
      this.auth.guard("admin"),
    ]);
    this.router.get("/lms/courses", this.handlers.getCourses);
    this.router.get("/lms/course/:slug", this.handlers.getCourse, [
      this.auth.optional,
    ]);
    this.router.delete("/lms/course/reset", this.handlers.resetCourse, [
      this.auth.guard("user"),
    ]);
    this.router.post("/lms/lesson", this.handlers.postLesson, [
      this.auth.guard("admin"),
    ]);
    this.router.get(
      "/lms/lesson/:courseSlug/:lessonSlug",
      this.handlers.getLesson,
      [this.auth.optional],
    );
    this.router.post(
      "/lms/lesson/complete",
      this.handlers.postCompletedLesson,
      [this.auth.guard("user")],
    );
    this.router.get("/lms/certificates", this.handlers.getCertificates, [
      this.auth.guard("user"),
    ]);
    this.router.get("/lms/certificates/:id", this.handlers.getCertificate);
  }
}
