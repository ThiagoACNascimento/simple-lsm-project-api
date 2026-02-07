import { Query } from "../../core/utils/abstract.ts";

type CourseData = {
  id: number;
  slug: string;
  title: string;
  description: string;
  lessons: number;
  hours: number;
  created: string;
};

type CourseCreate = Omit<CourseData, "id" | "created">;

type LessonData = {
  id: number;
  course_id: number;
  slug: string;
  title: string;
  seconds: number;
  video: string;
  description: string;
  order: number;
  free: number;
  created: string;
};

type LessonCreate = Omit<LessonData, "id" | "course_id" | "created"> & {
  courseSlug: string;
};

export class LmsQuery extends Query {
  insertCourse({ slug, title, description, lessons, hours }: CourseCreate) {
    return this.db
      .query(
        /*sql*/ `
        INSERT OR IGNORE INTO "courses"
          ("slug", "title", "description", "lessons", "hours")
        VALUES 
          (?,?,?,?,?)
      ;`,
      )
      .run(slug, title, description, lessons, hours);
  }

  insertLesson({
    courseSlug,
    slug,
    title,
    seconds,
    video,
    description,
    order,
    free,
  }: LessonCreate) {
    return this.db
      .query(
        /*sql*/ `
        INSERT OR IGNORE INTO "lessons"
          (
            "course_id", "slug", 
            "title", "seconds", 
            "video", "description", 
            "order", "free"
          )
        VALUES 
          (
            (SELECT "id" FROM "courses" WHERE "slug" = ?),
            ?,?,?,?,?,?,?
          )
          ;`,
      )
      .run(courseSlug, slug, title, seconds, video, description, order, free);
  }

  selectCourses() {
    return this.db
      .prepare(
        /*sql*/
        `
        SELECT 
          *
        FROM
          "courses"
        ORDER BY
          "created"
        ASC
        LIMIT 
          100
    ;`,
      )
      .all() as CourseData[];
  }

  selectCourse(slug: string) {
    return this.db
      .prepare(
        /*sql*/
        `
        SELECT 
          *
        FROM
          "courses"
        WHERE
          "slug" = ?
    ;`,
      )
      .get(slug) as CourseData | undefined;
  }

  selectLessons(courseSlug: string) {
    return this.db
      .prepare(
        /*sql*/
        `
        SELECT 
          *
        FROM
          "lessons"
        WHERE
          "course_id" = (SELECT "id" FROM "courses" WHERE "slug" = ?) 
        ORDER BY  
          "order" ASC
    ;`,
      )
      .all(courseSlug) as LessonData[];
  }

  selectLesson(courseSlug: string, lessonSlug: string) {
    return this.db
      .prepare(
        /*sql*/
        `
        SELECT 
          *
        FROM
          "lessons"
        WHERE
          "course_id" = (SELECT "id" FROM "courses" WHERE "slug" = ?) 
          AND
          "slug" = ?
    ;`,
      )
      .get(courseSlug, lessonSlug) as LessonData | undefined;
  }

  selectLessonNav(courseSlug: string, lessonSlug: string) {
    return this.db
      .prepare(
        /*sql*/
        `
        SELECT 
          "slug"
        FROM
          "lesson_nav"
        WHERE
          "course_id" = (SELECT "id" FROM "courses" WHERE "slug" = ?) 
          AND
          "current_slug" = ?
    ;`,
      )
      .all(courseSlug, lessonSlug) as { slug: string }[];
  }

  insertLessonCompleted(userId: number, courseId: number, lessonId: number) {
    return this.db
      .prepare(
        /*sql*/
        `
          INSERT OR IGNORE INTO "lessons_completed"
            ("user_id", "course_id", "lesson_id")
          VALUES
            (?,?,?)
      ;`,
      )
      .run(userId, courseId, lessonId);
  }
}
