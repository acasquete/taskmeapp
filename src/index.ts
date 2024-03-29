import { Config } from "./services/ConfigService";
import { AppInitializer } from './services/AppInitializer';
import { PomodoroService } from "./services/PomodoroService";

const configInstance = new Config();
(window as any).Config = configInstance;
(window as any).appInitializer = new AppInitializer();
(window as any).onSignIn = (response: any) => (window as any).appInitializer.onSignIn(response);
(window as any).Pomodoro = new PomodoroService(configInstance);

