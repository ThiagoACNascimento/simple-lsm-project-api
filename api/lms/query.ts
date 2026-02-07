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
}
