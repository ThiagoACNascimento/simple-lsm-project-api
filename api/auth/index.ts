import { Api } from "../../core/utils/abstract.ts";
import { authTables } from "./tables.ts";

export class AuthApi extends Api {
  tables(): void {
    this.db.exec(authTables);
  }
}
