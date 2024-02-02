import { Config } from "./services/ConfigService";

const configInstance = new Config();
(window as any).Config = configInstance;