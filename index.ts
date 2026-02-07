import { Core } from "./core/core.ts";
import { logger } from "./core/middleware/logger.ts";
import { AuthApi } from "./api/auth/index.ts";
import { LmsApi } from "./api/lms/index.ts";

const core = new Core();

core.router.use([logger]);

new AuthApi(core).init();
new LmsApi(core).init();

core.init();
