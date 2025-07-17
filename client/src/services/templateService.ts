
export interface TemplateColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground?: string;
  muted?: string;
  border?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  colors: TemplateColors;
  style: 'modern' | 'classic' | 'minimal' | 'corporate' | 'tech' | 'elegant';
  cssVariables: Record<string, string>;
}

export class TemplateService {
  private static readonly STORAGE_KEY = 'selected-template';

  static applyTemplate(template: Template): void {
    const root = document.documentElement;
    
    // Apply CSS variables
    Object.entries(template.cssVariables).forEach(([variable, value]) => {
      root.style.setProperty(variable, value);
    });

    // Apply basic colors as hex values
    root.style.setProperty('--primary', template.colors.primary);
    root.style.setProperty('--secondary', template.colors.secondary);
    root.style.setProperty('--accent', template.colors.accent);
    root.style.setProperty('--background', template.colors.background);
    
    // Apply foreground colors
    root.style.setProperty('--primary-foreground', this.getContrastColor(template.colors.primary));
    root.style.setProperty('--secondary-foreground', this.getContrastColor(template.colors.secondary));
    root.style.setProperty('--accent-foreground', this.getContrastColor(template.colors.accent));

    // Apply computed colors based on template style
    this.applyComputedColors(template);
    
    // Save to localStorage
    localStorage.setItem(this.STORAGE_KEY, template.id);
    
    // Dispatch custom event for components to react
    window.dispatchEvent(new CustomEvent('templateChanged', { 
      detail: { template } 
    }));
  }

  private static applyComputedColors(template: Template): void {
    const root = document.documentElement;
    
    switch (template.style) {
      case 'modern':
        root.style.setProperty('--card', 'rgba(255, 255, 255, 0.8)');
        root.style.setProperty('--border', 'rgba(255, 255, 255, 0.2)');
        root.style.setProperty('--shadow', '0 8px 32px rgba(0, 0, 0, 0.1)');
        break;
        
      case 'minimal':
        root.style.setProperty('--card', '#ffffff');
        root.style.setProperty('--border', '#e5e7eb');
        root.style.setProperty('--shadow', '0 1px 3px rgba(0, 0, 0, 0.1)');
        break;
        
      case 'tech':
        root.style.setProperty('--card', '#1e293b');
        root.style.setProperty('--border', '#334155');
        root.style.setProperty('--shadow', '0 4px 20px rgba(0, 217, 255, 0.2)');
        break;
        
      case 'corporate':
        root.style.setProperty('--card', '#ffffff');
        root.style.setProperty('--border', '#e2e8f0');
        root.style.setProperty('--shadow', '0 4px 12px rgba(30, 64, 175, 0.1)');
        break;
        
      case 'elegant':
        root.style.setProperty('--card', '#fefbff');
        root.style.setProperty('--border', '#e9d5ff');
        root.style.setProperty('--shadow', '0 8px 25px rgba(88, 28, 135, 0.15)');
        break;
        
      case 'classic':
        root.style.setProperty('--card', '#ffffff');
        root.style.setProperty('--border', '#d1fae5');
        root.style.setProperty('--shadow', '0 4px 12px rgba(15, 118, 110, 0.1)');
        break;
    }
  }

  static getStoredTemplate(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  static resetTemplate(): void {
    const root = document.documentElement;
    
    // Reset to default CSS variables
    const defaultVariables = {
      '--primary': '#3b82f6',
      '--secondary': '#64748b',
      '--accent': '#10b981',
      '--background': '#ffffff',
      '--card': '#ffffff',
      '--border': '#e5e7eb',
      '--shadow': '0 1px 3px rgba(0, 0, 0, 0.1)'
    };

    Object.entries(defaultVariables).forEach(([variable, value]) => {
      root.style.setProperty(variable, value);
    });

    localStorage.removeItem(this.STORAGE_KEY);
    
    window.dispatchEvent(new CustomEvent('templateReset'));
  }

  static generateCSSVariables(template: Template): Record<string, string> {
    const baseVariables: Record<string, string> = {
      '--primary': template.colors.primary,
      '--secondary': template.colors.secondary,
      '--accent': template.colors.accent,
      '--background': template.colors.background,
    };

    // Generate additional variables based on primary color
    const primaryHsl = this.hexToHsl(template.colors.primary);
    const secondaryHsl = this.hexToHsl(template.colors.secondary);
    
    return {
      ...baseVariables,
      '--primary-foreground': this.getContrastColor(template.colors.primary),
      '--secondary-foreground': this.getContrastColor(template.colors.secondary),
      '--accent-foreground': this.getContrastColor(template.colors.accent),
      '--muted': `hsl(${primaryHsl.h}, ${Math.max(primaryHsl.s - 50, 5)}%, ${Math.min(primaryHsl.l + 45, 95)}%)`,
      '--muted-foreground': `hsl(${primaryHsl.h}, ${Math.max(primaryHsl.s - 30, 5)}%, ${Math.max(primaryHsl.l - 25, 10)}%)`,
    };
  }

  private static hexToHsl(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private static getContrastColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
}
