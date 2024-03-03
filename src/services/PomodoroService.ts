import { Config } from "./ConfigService";
import { Helper } from "./Helper";

export class PomodoroService {
    private static pomodoroDuration: number = 25;
    private static shortBreakDuration: number = 5;
    private static longBreakDuration: number = 15;
    private dateFirstPomodoro: Date | null = null;
    private totalPomodoros: number = 0;
    private pomodoroStartTime: Date | null = null;
    private pomodoroEndTime: Date | null = null;
    private pomodoroType: string | null = null;
    private isVisible: boolean = false;
    private interval: number | null = null;
    private config: Config;

    constructor(config: Config) {
       this.config = config;
    }
    
    private moreThanADaySinceTheFirstPomodoro(): boolean {
        return !this.dateFirstPomodoro || (new Date().getTime() - this.dateFirstPomodoro.getTime()) > 86400 * 1000;
    }

    private resetPomodoroCount(): void {
        this.totalPomodoros = 0;
    }

    private setDateForFirstPomodoro(): void {
        this.dateFirstPomodoro = new Date();
        this.dateFirstPomodoro.setHours(0, 0, 0, 0);
    }

    private resetPomodoroCountIfNeeded(): boolean {
        if (!this.pomodoroStartTime) {
            if (this.moreThanADaySinceTheFirstPomodoro()) {
                this.resetPomodoroCount();
                return true;
            }
        }
        return false;
    }

    public startPomodoro(): void {
        if (this.resetPomodoroCountIfNeeded()) {
            this.setDateForFirstPomodoro();
        }

        this.start({ duration: PomodoroService.pomodoroDuration, type: "pomodoro" });
    }

    public startShort(): void {
        this.start({ duration: PomodoroService.shortBreakDuration, type: "short" });
    }

    public startLong(): void {
        this.start({ duration: PomodoroService.longBreakDuration, type: "long" });
    }

    private start(configuration: { duration: number; type: string }): void {
        this.show();

        if (!this.pomodoroStartTime) {
            this.pomodoroStartTime = new Date();
            this.pomodoroEndTime = new Date(this.pomodoroStartTime.getTime() + configuration.duration * 60000);
            this.pomodoroType = configuration.type;

            this.initInterval();

            // Assuming Notifications is a defined class or object elsewhere in your project
            Notifications.requestPermission();
            const icon = '/images/apple-touch-icon.png';
            const body = 'Pomodoro Finished!';
            const dir = 'ltr';
            
            Notifications.scheduleNotification('TaskMe', { icon, dir, body }, configuration.duration * 60000);
        }

        this.saveState();
    }
    
    private initInterval(): void {
        this.setTitleStatus();
        this.drawTime();
        this.interval = window.setInterval(() => this.updateTimer(), 1000) as unknown as number;
    }

    private setTitleStatus(): void {
        const title = this.pomodoroType == "pomodoro" ? 'Pomodoro Time' : 'Resting time';
        document.getElementById("status")!.textContent = title;
    }

    private drawTime(): void {
        const timeDifference = Helper.timeDifference(this.pomodoroEndTime!, new Date());
        document.getElementById("time")!.textContent = timeDifference;
    }

    private updateTimer(): void {
        if (new Date().getTime() > this.pomodoroEndTime!.getTime()) {
            this.totalPomodoros++;
            this.finishPomodoro();
        } else {
            this.drawTime();
        }
    }

    private show(): void {
        this.isVisible = true;
        this.saveState();
        document.getElementById("pomodoro")!.style.display = 'block';
        document.getElementById("overlay")!.style.display = 'block';
    }

    private hide(): void {
        this.isVisible = false;
        this.saveState();
        document.getElementById("overlay")!.style.display = 'none';
        document.getElementById("pomodoro")!.style.display = 'none';
    }

    public cancel(): void {
        this.finishPomodoro();
    }

    private finishPomodoro(): void {
        window.clearInterval(this.interval!);
        Notifications.cancelNotification();
        this.hide();
        document.getElementById("time")!.textContent = "00:00";
        this.pomodoroStartTime = null;
        this.pomodoroEndTime = null;
        this.saveState();
    }

    private getState(): object {
        return {
            dateFirstPomodoro: this.dateFirstPomodoro,
            totalPomodoros: this.totalPomodoros,
            pomodoroStartTime: this.pomodoroStartTime,
            pomodoroEndTime: this.pomodoroEndTime,
            pomodoroType: this.pomodoroType,
            isVisible: this.isVisible
        };
    }

    private saveState(): void {
        const state = this.getState();
        this.config.savePomodoroState(state); // Assuming Config is a defined class or object elsewhere in your project
    }

    public setState(data: any): void {
        if (!data) return;

        this.dateFirstPomodoro = data.dateFirstPomodoro ? new Date(data.dateFirstPomodoro) : null;
        this.totalPomodoros = data.totalPomodoros;
        this.pomodoroStartTime = data.pomodoroStartTime ? new Date(data.pomodoroStartTime) : null;
        this.pomodoroEndTime = data.pomodoroEndTime ? new Date(data.pomodoroEndTime) : null;
        this.pomodoroType = data.pomodoroType;

        if (this.resetPomodoroCountIfNeeded()) return;

        if (this.pomodoroStartTime) {
            this.initInterval();
            if (data.isVisible) {
                this.show();
            }
        }
    }

    public init(): void {
        const state = this.config.getPomodoroState(); // Assuming Config is a defined class or object elsewhere in your project
        this.setButtonHandlers();
        this.setState(state);
    }

    private setButtonHandlers(): void {
        document.getElementById("butHide")!.addEventListener('click', () => this.hide());
        document.getElementById("butCancel")!.addEventListener('click', () => this.cancel());
    }
}
