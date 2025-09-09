import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';

const router = Router();

interface TemplateColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  colors: TemplateColors;
  style: string;
}

// Convert hex color to HSL
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

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

  return `${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
}

// Apply template to CSS file
async function applyTemplateToCSS(template: Template): Promise<void> {
  const cssPath = path.join(process.cwd(), 'client', 'src', 'index.css');
  
  try {
    let cssContent = await fs.readFile(cssPath, 'utf-8');
    
    // Convert colors to HSL
    const primaryHsl = hexToHsl(template.colors.primary);
    const secondaryHsl = hexToHsl(template.colors.secondary);
    const accentHsl = hexToHsl(template.colors.accent);
    const backgroundHsl = hexToHsl(template.colors.background);
    
    // Update CSS variables
    cssContent = cssContent.replace(
      /--primary: hsl\([^)]+\);/,
      `--primary: hsl(${primaryHsl});`
    );
    
    cssContent = cssContent.replace(
      /--secondary: hsl\([^)]+\);/,
      `--secondary: hsl(${secondaryHsl});`
    );
    
    cssContent = cssContent.replace(
      /--accent: hsl\([^)]+\);/,
      `--accent: hsl(${accentHsl});`
    );
    
    cssContent = cssContent.replace(
      /--background: hsl\([^)]+\);/,
      `--background: hsl(${backgroundHsl});`
    );
    
    // Update gradient variables based on template style
    let gradientPrimary = '';
    let gradientSecondary = '';
    
    switch (template.style) {
      case 'corporate':
        gradientPrimary = `linear-gradient(135deg, hsl(${primaryHsl}) 0%, hsl(${secondaryHsl}) 100%)`;
        gradientSecondary = `linear-gradient(135deg, hsl(${secondaryHsl}) 0%, hsl(${accentHsl}) 100%)`;
        break;
      case 'modern':
        gradientPrimary = `linear-gradient(135deg, hsl(${primaryHsl}) 0%, hsl(${secondaryHsl}) 50%, hsl(${accentHsl}) 100%)`;
        gradientSecondary = `linear-gradient(135deg, hsl(${accentHsl}) 0%, hsl(${primaryHsl}) 100%)`;
        break;
      case 'minimal':
        gradientPrimary = `linear-gradient(180deg, hsl(${backgroundHsl}) 0%, hsl(${secondaryHsl}) 100%)`;
        gradientSecondary = `linear-gradient(90deg, hsl(${primaryHsl}) 0%, hsl(${accentHsl}) 100%)`;
        break;
      case 'tech':
        gradientPrimary = `linear-gradient(135deg, hsl(${primaryHsl}) 0%, hsl(${secondaryHsl}) 100%)`;
        gradientSecondary = `linear-gradient(45deg, hsl(${accentHsl}) 0%, hsl(${primaryHsl}) 100%)`;
        break;
      case 'elegant':
        gradientPrimary = `linear-gradient(135deg, hsl(${primaryHsl}) 0%, hsl(${secondaryHsl}) 50%, hsl(${accentHsl}) 100%)`;
        gradientSecondary = `linear-gradient(135deg, hsl(${accentHsl}) 0%, hsl(${secondaryHsl}) 100%)`;
        break;
      case 'sunset':
        gradientPrimary = `linear-gradient(135deg, hsl(${primaryHsl}) 0%, hsl(${secondaryHsl}) 70%, hsl(${accentHsl}) 100%)`;
        gradientSecondary = `radial-gradient(circle, hsl(${accentHsl}) 0%, hsl(${primaryHsl}) 100%)`;
        break;
      case 'ocean':
        gradientPrimary = `linear-gradient(180deg, hsl(${primaryHsl}) 0%, hsl(${secondaryHsl}) 60%, hsl(${accentHsl}) 100%)`;
        gradientSecondary = `linear-gradient(135deg, hsl(${secondaryHsl}) 0%, hsl(${accentHsl}) 100%)`;
        break;
      case 'forest':
        gradientPrimary = `linear-gradient(135deg, hsl(${primaryHsl}) 0%, hsl(${secondaryHsl}) 80%, hsl(${accentHsl}) 100%)`;
        gradientSecondary = `linear-gradient(45deg, hsl(${accentHsl}) 0%, hsl(${secondaryHsl}) 100%)`;
        break;
      default:
        gradientPrimary = `linear-gradient(135deg, hsl(${primaryHsl}) 0%, hsl(${secondaryHsl}) 100%)`;
        gradientSecondary = `linear-gradient(135deg, hsl(${secondaryHsl}) 0%, hsl(${accentHsl}) 100%)`;
    }
    
    cssContent = cssContent.replace(
      /--gradient-primary: [^;]+;/,
      `--gradient-primary: ${gradientPrimary};`
    );
    
    cssContent = cssContent.replace(
      /--gradient-secondary: [^;]+;/,
      `--gradient-secondary: ${gradientSecondary};`
    );
    
    await fs.writeFile(cssPath, cssContent, 'utf-8');
    
  } catch (error) {
    console.error('Error applying template to CSS:', error);
    throw error;
  }
}

// Apply template
router.post('/apply', async (req, res) => {
  try {
    const template: Template = req.body;
    
    if (!template || !template.id || !template.colors) {
      return res.status(400).json({ 
        success: false, 
        message: 'Template data is required' 
      });
    }
    
    // Apply template to CSS
    await applyTemplateToCSS(template);
    
    // Save current template preference (you can store this in database if needed)
    const preferencePath = path.join(process.cwd(), 'template-preference.json');
    await fs.writeFile(preferencePath, JSON.stringify({
      selectedTemplate: template.id,
      appliedAt: new Date().toISOString(),
      template
    }, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Template aplicado com sucesso',
      template: template.id
    });
    
  } catch (error) {
    console.error('Error applying template:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao aplicar template',
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get current template
router.get('/current', async (req, res) => {
  try {
    const preferencePath = path.join(process.cwd(), 'template-preference.json');
    
    try {
      const preferenceData = await fs.readFile(preferencePath, 'utf-8');
      const preference = JSON.parse(preferenceData);
      res.json(preference);
    } catch {
      res.json({ selectedTemplate: null });
    }
    
  } catch (error) {
    console.error('Error getting current template:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter template atual' 
    });
  }
});

// Reset to default template
router.post('/reset', async (req, res) => {
  try {
    const defaultTemplate: Template = {
      id: 'default',
      name: 'Default',
      description: 'Template padrão do sistema',
      colors: {
        primary: '#2563eb',
        secondary: '#64748b', 
        accent: '#06b6d4',
        background: '#ffffff'
      },
      style: 'modern'
    };
    
    await applyTemplateToCSS(defaultTemplate);
    
    // Remove preference file
    const preferencePath = path.join(process.cwd(), 'template-preference.json');
    try {
      await fs.unlink(preferencePath);
    } catch {
      // File doesn't exist, that's fine
    }
    
    res.json({ 
      success: true, 
      message: 'Template resetado para o padrão' 
    });
    
  } catch (error) {
    console.error('Error resetting template:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao resetar template' 
    });
  }
});

export default router;