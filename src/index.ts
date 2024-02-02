import { Config } from "./services/ConfigService.ts";

const configInstance = new Config();
(window as any).Config = configInstance;