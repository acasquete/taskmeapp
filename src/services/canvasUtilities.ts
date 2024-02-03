export class CanvasUtilities {
    static CANVAS_WIDTH: number = 2000; // Asumiendo una constante para el ancho del lienzo

    static darkenColor(color: string, amount: number): string {
        let usePound = false;
        if (color[0] === "#") {
            color = color.slice(1);
            usePound = true;
        }
        let num = parseInt(color, 16);
        let r = (num >> 16) - amount;
        let b = ((num >> 8) & 0x00FF) - amount;
        let g = (num & 0x0000FF) - amount;
        r = Math.max(Math.min(255, r), 0);
        b = Math.max(Math.min(255, b), 0);
        g = Math.max(Math.min(255, g), 0);
        return (usePound?"#":"") + ((g | (b << 8) | (r << 16)).toString(16)).padStart(6, '0');
    }

    static getUserOrientation(): string {
        if (window.matchMedia("(orientation: portrait)").matches) {
            return 'portrait';
        } else if (window.matchMedia("(orientation: landscape)").matches) {
            return 'landscape';
        }
        return 'portrait';
    }

    static getColorByIndex(index: number): string {
        const colors = ['#000000', '#0047bb', '#ef3340', '#00a651'];
        return colors[index] || '#000000'; // Default color
    }

    static getColors() {
        return {
            yellow: {
                primary: '#fef639',
                secondary: this.darkenColor('#fef639', 20),
                text: '#000000'
            },
            blue: {
                primary: '#34afd8',
                secondary: this.darkenColor('#34afd8', 20),
                text: '#ffffff'
            },
            rose: {
                primary: '#fd4289',
                secondary: this.darkenColor('#fd4289', 20),
                text: '#ffffff'
            },
            violet: {
                primary: '#cf7aef',
                secondary: this.darkenColor('#cf7aef', 20),
                text: '#ffffff'
            },
            green: {
                primary: '#bdda1e',
                secondary: this.darkenColor('#bdda1e', 20),
                text: '#000000'
            },
            orange: {
                primary: '#ffca20',
                secondary: this.darkenColor('#ffca20', 20),
                text: '#000000'
            },
            welcome: {
                primary: '#ffffff',
                secondary: this.darkenColor('#ffffff', 20),
                text: '#000000'
            }
        };
    }
}
