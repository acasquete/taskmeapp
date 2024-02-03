import { Config } from "./services/configService";

const configInstance = new Config();
(window as any).Config = configInstance;
