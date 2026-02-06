import { Api } from "../../core/utils/abstract.ts";
import { lmsTables } from "./tables.ts";

export class LmsApi extends Api {
  tables(): void {
    this.db.exec(lmsTables);
  }
}
