
/**
 * Editor de CSS personalizado para campos do template builder
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Textarea } from '../../ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { Badge } from '../../ui/badge'
import { Slider } from '../../ui/slider'
import { 
  Palette, 
  Type, 
  Layout, 
  Spacing,
  Eye,
  Code,
  RefreshCw,
  Copy,
  Undo,
  Download
} from 'lucide-react'

interface CSSStyles {
  // Layout
  display?: string
  position?: string
  width?: string
  height?: string
  margin?: string
  padding?: string
  
  // Typography
  fontSize?: string
  fontWeight?: string
  fontFamily?: string
  lineHeight?: string
  textAlign?: string
  color?: string
  
  // Background
  backgroundColor?: string
  backgroundImage?: string
  backgroundSize?: string
  backgroundPosition?: string
  
  // Border
  border?: string
  borderRadius?: string
  borderWidth?: string
  borderStyle?: string
  borderColor?: string
  
  // Effects
  boxShadow?: string
  opacity?: string
  transform?: string
  transition?: string
  
  // Custom CSS
  customCSS?: string
}

interface CSSStyleEditorProps {
  field: any
  onUpdate: (styles: CSSStyles) => void
  onClose: () => void
}

export const CSSStyleEditor: React.FC<CSSStyleEditorProps> = ({
  field,
  onUpdate,
  onClose
}) => {
  const [styles, setStyles] = useState<CSSStyles>(field.styling || {})
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [customCSS, setCustomCSS] = useState(styles.customCSS || '')

  // Predefined style presets
  const stylePresets = {
    modern: {
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      padding: '12px',
      backgroundColor: '#ffffff',
      fontSize: '14px',
      transition: 'all 0.2s ease'
    },
    minimal: {
      border: 'none',
      borderBottom: '2px solid #3b82f6',
      borderRadius: '0',
      padding: '8px 0',
      backgroundColor: 'transparent',
      fontSize: '16px'
    },
    rounded: {
      borderRadius: '20px',
      border: '2px solid #10b981',
      padding: '12px 16px',
      backgroundColor: '#f0fdf4',
      fontSize: '14px'
    },
    shadow: {
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      padding: '12px',
      backgroundColor: '#ffffff',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      fontSize: '14px'
    }
  }

  // Color palette
  const colorPalette = [
    '#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#f3f4f6', '#ffffff',
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
    '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
    '#d946ef', '#ec4899', '#f43f5e'
  ]

  // Update styles
  const updateStyle = (property: keyof CSSStyles, value: string) => {
    const newStyles = { ...styles, [property]: value }
    setStyles(newStyles)
    onUpdate(newStyles)
  }

  // Apply preset
  const applyPreset = (presetName: keyof typeof stylePresets) => {
    const preset = stylePresets[presetName]
    const newStyles = { ...styles, ...preset }
    setStyles(newStyles)
    onUpdate(newStyles)
  }

  // Generate CSS string
  const generateCSS = () => {
    const cssRules: string[] = []
    
    Object.entries(styles).forEach(([property, value]) => {
      if (value && property !== 'customCSS') {
        const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase()
        cssRules.push(`  ${cssProperty}: ${value};`)
      }
    })

    if (customCSS) {
      cssRules.push(`  ${customCSS}`)
    }

    return `.field-${field.id} {\n${cssRules.join('\n')}\n}`
  }

  // Copy CSS to clipboard
  const copyCSSToClipboard = () => {
    navigator.clipboard.writeText(generateCSS())
  }

  return (
    <div className="h-full flex flex-col bg-white border-l">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold">Editor de CSS</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={copyCSSToClipboard}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="visual" className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="visual">Visual</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="code">Código</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Visual Editor */}
          <TabsContent value="visual" className="p-4 space-y-4">
            {/* Style Presets */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Estilos Predefinidos</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(stylePresets).map(([name, preset]) => (
                  <Button
                    key={name}
                    variant="outline"
                    className="h-auto p-3 flex flex-col items-start gap-1"
                    onClick={() => applyPreset(name as keyof typeof stylePresets)}
                  >
                    <span className="text-sm font-medium capitalize">{name}</span>
                    <div 
                      className="w-full h-6 rounded border"
                      style={preset}
                    />
                  </Button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Cores</Label>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Cor do Texto</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={styles.color || '#000000'}
                      onChange={(e) => updateStyle('color', e.target.value)}
                      className="w-12 h-8 p-0 border rounded"
                    />
                    <Input
                      value={styles.color || ''}
                      onChange={(e) => updateStyle('color', e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Cor de Fundo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={styles.backgroundColor || '#ffffff'}
                      onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                      className="w-12 h-8 p-0 border rounded"
                    />
                    <Input
                      value={styles.backgroundColor || ''}
                      onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mt-3">
                {colorPalette.map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => updateStyle('backgroundColor', color)}
                  />
                ))}
              </div>
            </div>

            {/* Typography */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Tipografia</Label>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tamanho da Fonte</Label>
                  <Select
                    value={styles.fontSize || '14px'}
                    onValueChange={(value) => updateStyle('fontSize', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12px">12px</SelectItem>
                      <SelectItem value="14px">14px</SelectItem>
                      <SelectItem value="16px">16px</SelectItem>
                      <SelectItem value="18px">18px</SelectItem>
                      <SelectItem value="20px">20px</SelectItem>
                      <SelectItem value="24px">24px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Peso da Fonte</Label>
                  <Select
                    value={styles.fontWeight || 'normal'}
                    onValueChange={(value) => updateStyle('fontWeight', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="bold">Negrito</SelectItem>
                      <SelectItem value="300">Leve</SelectItem>
                      <SelectItem value="500">Médio</SelectItem>
                      <SelectItem value="700">Pesado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label className="text-xs">Alinhamento</Label>
                  <Select
                    value={styles.textAlign || 'left'}
                    onValueChange={(value) => updateStyle('textAlign', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Esquerda</SelectItem>
                      <SelectItem value="center">Centro</SelectItem>
                      <SelectItem value="right">Direita</SelectItem>
                      <SelectItem value="justify">Justificado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Border & Radius */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Bordas</Label>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Espessura da Borda</Label>
                  <Select
                    value={styles.borderWidth || '1px'}
                    onValueChange={(value) => updateStyle('borderWidth', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem borda</SelectItem>
                      <SelectItem value="1px">1px</SelectItem>
                      <SelectItem value="2px">2px</SelectItem>
                      <SelectItem value="3px">3px</SelectItem>
                      <SelectItem value="4px">4px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Cor da Borda</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={styles.borderColor || '#d1d5db'}
                      onChange={(e) => updateStyle('borderColor', e.target.value)}
                      className="w-12 h-8 p-0 border rounded"
                    />
                    <Input
                      value={styles.borderColor || ''}
                      onChange={(e) => updateStyle('borderColor', e.target.value)}
                      placeholder="#d1d5db"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <Label className="text-xs">Raio da Borda</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[parseInt(styles.borderRadius?.replace('px', '') || '0')]}
                      onValueChange={([value]) => updateStyle('borderRadius', `${value}px`)}
                      max={20}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs w-8">{styles.borderRadius || '0px'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Effects */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Efeitos</Label>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Sombra</Label>
                  <Select
                    value={styles.boxShadow || 'none'}
                    onValueChange={(value) => updateStyle('boxShadow', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem sombra</SelectItem>
                      <SelectItem value="0 1px 2px rgba(0, 0, 0, 0.05)">Leve</SelectItem>
                      <SelectItem value="0 4px 6px rgba(0, 0, 0, 0.1)">Média</SelectItem>
                      <SelectItem value="0 10px 15px rgba(0, 0, 0, 0.1)">Forte</SelectItem>
                      <SelectItem value="0 20px 25px rgba(0, 0, 0, 0.15)">Muito forte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Transição</Label>
                  <Select
                    value={styles.transition || 'none'}
                    onValueChange={(value) => updateStyle('transition', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem transição</SelectItem>
                      <SelectItem value="all 0.2s ease">Rápida</SelectItem>
                      <SelectItem value="all 0.3s ease">Média</SelectItem>
                      <SelectItem value="all 0.5s ease">Lenta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Layout Editor */}
          <TabsContent value="layout" className="p-4 space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Dimensões</Label>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Largura</Label>
                  <Input
                    value={styles.width || ''}
                    onChange={(e) => updateStyle('width', e.target.value)}
                    placeholder="auto, 100%, 200px"
                  />
                </div>

                <div>
                  <Label className="text-xs">Altura</Label>
                  <Input
                    value={styles.height || ''}
                    onChange={(e) => updateStyle('height', e.target.value)}
                    placeholder="auto, 40px"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">Espaçamento</Label>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Margem</Label>
                  <Input
                    value={styles.margin || ''}
                    onChange={(e) => updateStyle('margin', e.target.value)}
                    placeholder="10px, 10px 20px"
                  />
                </div>

                <div>
                  <Label className="text-xs">Preenchimento</Label>
                  <Input
                    value={styles.padding || ''}
                    onChange={(e) => updateStyle('padding', e.target.value)}
                    placeholder="10px, 10px 20px"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">Posicionamento</Label>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Display</Label>
                  <Select
                    value={styles.display || 'block'}
                    onValueChange={(value) => updateStyle('display', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="block">Block</SelectItem>
                      <SelectItem value="inline">Inline</SelectItem>
                      <SelectItem value="inline-block">Inline Block</SelectItem>
                      <SelectItem value="flex">Flex</SelectItem>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="none">Oculto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Position</Label>
                  <Select
                    value={styles.position || 'static'}
                    onValueChange={(value) => updateStyle('position', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="static">Static</SelectItem>
                      <SelectItem value="relative">Relative</SelectItem>
                      <SelectItem value="absolute">Absolute</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="sticky">Sticky</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Code Editor */}
          <TabsContent value="code" className="p-4 space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">CSS Personalizado</Label>
              <Textarea
                value={customCSS}
                onChange={(e) => {
                  setCustomCSS(e.target.value)
                  updateStyle('customCSS', e.target.value)
                }}
                placeholder="/* Adicione seu CSS personalizado aqui */
background: linear-gradient(45deg, #f0f, #0ff);
hover:transform: scale(1.05);"
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">CSS Gerado</Label>
              <div className="bg-gray-50 p-3 rounded border">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {generateCSS()}
                </pre>
              </div>
            </div>
          </TabsContent>

          {/* Preview */}
          <TabsContent value="preview" className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-medium">Preview do Campo</Label>
              
              <div className="flex items-center gap-2">
                {['desktop', 'tablet', 'mobile'].map((mode) => (
                  <Button
                    key={mode}
                    variant={previewMode === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode(mode as any)}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>

            <Card className="p-4">
              <div 
                className={`transition-all duration-300 ${
                  previewMode === 'mobile' ? 'max-w-sm mx-auto' :
                  previewMode === 'tablet' ? 'max-w-md mx-auto' :
                  'max-w-full'
                }`}
              >
                <Label className="text-sm font-medium mb-2 block">
                  {field.label}
                  {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                </Label>
                
                <div style={styles}>
                  {field.type === 'text' && (
                    <Input placeholder="Campo de exemplo" />
                  )}
                  {field.type === 'textarea' && (
                    <Textarea placeholder="Área de texto de exemplo" rows={3} />
                  )}
                  {field.type === 'select' && (
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma opção" />
                      </SelectTrigger>
                    </Select>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="p-4 border-t flex gap-2">
        <Button onClick={() => onUpdate(styles)} className="flex-1">
          Aplicar Estilos
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

export default CSSStyleEditor
