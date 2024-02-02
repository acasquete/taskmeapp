import { Config } from "./services/ConfigService.js";

const configInstance = new Config();
(window as any).Config = configInstance;