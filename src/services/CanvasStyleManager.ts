import { Config } from "./ConfigService";

type Preference = 'system' | 'dark' | 'light';

export class CanvasStyleManager {
    private canvas: fabric.Canvas;
    private userPreference: Preference; 
    private config: Config;
    private appliedMode: string | null = null;

    constructor(canvas: fabric.Canvas, config: Config) {
      this.canvas = canvas;
      this.config = config;
      this.userPreference = this.config.getItem('theme') as Preference || 'system';
      this.setupSystemModeListener();
    }

    getSeparatorColor() {
        return this.appliedMode === 'dark' ? '#ffffff' : 'gray';
    }

    getTextColor () {
        return this.appliedMode === 'dark' ? '#ffffff' : '#121212';
    }

    getSelectionColor () {
        return this.appliedMode === 'dark' ? '#ffffff' : 'blue';
    }

    getBackgroundColor () {
        return this.appliedMode === 'dark' ? '#121212' : '#ffffff';
    }

    getContrastColor () {
        return this.appliedMode === 'dark' ? '#ffffff' : '#121212';
    }
 
    applyMode(mode:string) {
        console.debug('applying ' + mode + ' mode');

        this.appliedMode = mode;
        this.canvas.backgroundColor = this.getBackgroundColor ();
        this.canvas.getObjects().forEach((obj) => {
          if (obj.type === 'path') {
            console.debug(obj.stroke);
            if (obj.stroke === '#121212' || obj.stroke === '#000000' || obj.stroke === '#ffffff') { 
              obj.set({stroke: this.getTextColor()}); 
            }
          } else {
              obj.set({fill: this.getTextColor()}); 
          }
        });

        if (mode==='dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark')
        }

        this.updateMenuOption();
        this.canvas.renderAll();
      }
      
      updateMenuOption () {

        let textMenu = document.getElementById('appearance-text');

        if (textMenu) {
            const preferenceTexts: { [key in Preference]: string } = {
                'system': 'System (' + this.appliedMode + ')',
                'dark': 'Dark mode',
                'light': 'Light mode'
            };
        
            textMenu.innerText = preferenceTexts[this.userPreference] || 'Default Text';
        }
      }
         
      applyPreference() {
        if (this.userPreference === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            this.applyMode('dark');
          } else {
            this.applyMode('light');
          }
        } else if (this.userPreference === 'dark') {
          this.applyMode('dark');
        } else {
          this.applyMode('light');
        }
      }
    
      setupSystemModeListener() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => {
          if (this.userPreference === 'system') {
            this.applyPreference();
          }
        };
        mediaQuery.addEventListener('change', handler);
      }
    
      setUserPreference(preference:Preference) {

        console.debug('toggle mode ' + preference);

        this.userPreference = preference;
        this.config.saveItem('theme', this.userPreference)
        this.applyPreference();
      }
    
      toggleMode() {
        if (this.userPreference === 'dark') {
          this.setUserPreference('light');
        } else if (this.userPreference === 'light') {
          this.setUserPreference('system');
        } else {
          this.setUserPreference('dark');
        }
      }
  }