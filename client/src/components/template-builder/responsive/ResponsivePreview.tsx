import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Eye,
  Settings,
  Ruler
} from 'lucide-react';
interface Device {
  id: string;
  name: string;
  icon: React.ReactNode;
  width: number;
  height: number;
  category: 'desktop' | 'tablet' | 'mobile';
  userAgent?: string;
}
interface ResponsivePreviewProps {
  templateContent: React.ReactNode;
  onDeviceChange: (device: Device) => void;
}
const devices: Device[] = [
  // Desktop
  {
    id: 'desktop-1920',
    name: 'Desktop FHD',
    icon: <Monitor className="h-4 w-4" />,
    width: 1920,
    height: 1080,
    category: 'desktop'
  },
  {
    id: 'desktop-1366',
    name: 'Desktop HD',
    icon: <Monitor className="h-4 w-4" />,
    width: 1366,
    height: 768,
    category: 'desktop'
  },
  {
    id: 'desktop-1024',
    name: 'Desktop Compact',
    icon: <Monitor className="h-4 w-4" />,
    width: 1024,
    height: 768,
    category: 'desktop'
  },
  
  // Tablets
  {
    id: 'ipad-pro',
    name: 'iPad Pro',
    icon: <Tablet className="h-4 w-4" />,
    width: 1024,
    height: 1366,
    category: 'tablet'
  },
  {
    id: 'ipad',
    name: 'iPad',
    icon: <Tablet className="h-4 w-4" />,
    width: 768,
    height: 1024,
    category: 'tablet'
  },
  {
    id: 'tablet-android',
    name: 'Android Tablet',
    icon: <Tablet className="h-4 w-4" />,
    width: 800,
    height: 1280,
    category: 'tablet'
  },
  
  // Mobile
  {
    id: 'iphone-14-pro',
    name: 'iPhone 14 Pro',
    icon: <Smartphone className="h-4 w-4" />,
    width: 393,
    height: 852,
    category: 'mobile'
  },
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    icon: <Smartphone className="h-4 w-4" />,
    width: 375,
    height: 667,
    category: 'mobile'
  },
  {
    id: 'samsung-s23',
    name: 'Samsung S23',
    icon: <Smartphone className="h-4 w-4" />,
    width: 360,
    height: 780,
    category: 'mobile'
  },
  {
    id: 'pixel-7',
    name: 'Google Pixel 7',
    icon: <Smartphone className="h-4 w-4" />,
    width: 412,
    height: 915,
    category: 'mobile'
  }
];
export const ResponsivePreview: React.FC<ResponsivePreviewProps> = ({
  templateContent,
  onDeviceChange
}) => {
  const [selectedDevice, setSelectedDevice] = useState<Device>(devices[0]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [zoom, setZoom] = useState([100]);
  const [showRuler, setShowRuler] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const getCurrentDimensions = useCallback(() => {
    const device = selectedDevice;
    if (orientation === 'landscape') {
      return { width: device.height, height: device.width };
    }
    return { width: device.width, height: device.height };
  }, [selectedDevice, orientation]);
  const handleDeviceChange = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      setSelectedDevice(device);
      onDeviceChange(device);
      
      // Auto-ajustar orientação baseado no tipo de dispositivo
      if (autoRotate) {
        if (device.category === 'desktop') {
          setOrientation('landscape');
        } else if (device.category === 'mobile') {
          setOrientation('portrait');
        }
      }
    }
  };
  const handleOrientationToggle = () => {
    setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait');
  };
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'desktop': return 'bg-blue-100 text-blue-800';
      case 'tablet': return 'bg-green-100 text-green-800';
      case 'mobile': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const dimensions = getCurrentDimensions();
  const scale = zoom[0] / 100;
  return (
    <div className="w-full h-full flex flex-col>
      {/* Toolbar */}
      <div className="border-b p-4 bg-gray-50>
        <div className="flex items-center justify-between mb-4>
          <h3 className="text-lg font-semibold flex items-center>
            <Eye className="h-5 w-5 mr-2" />
            Preview Responsivo
          </h3>
          
          <div className="flex items-center space-x-2>
            <Badge className={getCategoryColor(selectedDevice.category)}>
              {selectedDevice.icon}
              <span className="text-lg">"{selectedDevice.category}</span>
            </Badge>
            
            <Badge variant="outline>
              {dimensions.width} × {dimensions.height}
            </Badge>
            
            <Badge variant="outline>
              {zoom[0]}%
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4>
          {/* Seleção de Dispositivo */}
          <div>
            <Label className="text-lg">"Dispositivo</Label>
            <Select value={selectedDevice.id} onValueChange={handleDeviceChange}>
              <SelectTrigger className="w-full>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['desktop', 'tablet', 'mobile'].map(category => (
                  <div key={category}>
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase>
                      {category}
                    </div>
                    {devices
                      .filter(device => device.category === category)
                      .map(device => (
                        <SelectItem key={device.id} value={device.id}>
                          <div className="flex items-center>
                            {device.icon}
                            <span className="text-lg">"{device.name}</span>
                            <span className="ml-auto text-xs text-gray-500>
                              {device.width}×{device.height}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Controles de Orientação */}
          <div>
            <Label className="text-lg">"Orientação</Label>
            <div className="flex items-center space-x-2 mt-1>
              <Button
                variant={orientation === 'portrait' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrientation('portrait')}
                disabled={selectedDevice.category === 'desktop'}
              >
                Portrait
              </Button>
              <Button
                variant={orientation === 'landscape' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrientation('landscape')}
              >
                Landscape
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOrientationToggle}
                title="Alternar orientação"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Zoom */}
          <div>
            <Label className="text-lg">"Zoom ({zoom[0]}%)</Label>
            <div className="flex items-center space-x-2 mt-1>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setZoom([Math.max(10, zoom[0] - 10)])}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Slider
                value={zoom}
                onValueChange={setZoom}
                min={10}
                max={200}
                step={10}
                className="flex-1"
              />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setZoom([Math.min(200, zoom[0] + 10)])}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Opções Avançadas */}
          <div>
            <Label className="text-lg">"Opções</Label>
            <div className="flex items-center space-x-4 mt-1>
              <div className="flex items-center space-x-2>
                <Switch
                  id="ruler"
                  checked={showRuler}
                  onCheckedChange={setShowRuler}
                />
                <Label htmlFor="ruler" className="text-lg">"Régua</Label>
              </div>
              
              <div className="flex items-center space-x-2>
                <Switch
                  id="grid"
                  checked={showGrid}
                  onCheckedChange={setShowGrid}
                />
                <Label htmlFor="grid" className="text-lg">"Grid</Label>
              </div>
              
              <div className="flex items-center space-x-2>
                <Switch
                  id="auto-rotate"
                  checked={autoRotate}
                  onCheckedChange={setAutoRotate}
                />
                <Label htmlFor="auto-rotate" className="text-lg">"Auto</Label>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Preview Area */}
      <div className="flex-1 p-8 bg-gray-100 overflow-auto>
        <div className="flex items-center justify-center min-h-full>
          <div className="relative>
            {/* Ruler */}
            {showRuler && (
              <>
                {/* Horizontal Ruler */}
                <div 
                  className="absolute -top-6 left-0 h-6 bg-white border-b flex"
                  style={{ width: dimensions.width * scale }}
                >
                  {Array.from({ length: Math.ceil(dimensions.width / 50) }, (_, i) => (
                    <div key={i} className="relative" style={{ width: 50 * scale }}>
                      <div className="absolute left-0 top-0 w-px h-full bg-gray-300" />
                      <div className="absolute left-1 top-1 text-xs text-gray-500>
                        {i * 50}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Vertical Ruler */}
                <div 
                  className="absolute -left-6 top-0 w-6 bg-white border-r flex flex-col"
                  style={{ height: dimensions.height * scale }}
                >
                  {Array.from({ length: Math.ceil(dimensions.height / 50) }, (_, i) => (
                    <div key={i} className="relative" style={{ height: 50 * scale }}>
                      <div className="absolute left-0 top-0 w-full h-px bg-gray-300" />
                      <div className="absolute left-1 top-1 text-xs text-gray-500 transform -rotate-90 origin-left>
                        {i * 50}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {/* Device Frame */}
            <div
              className="relative bg-white border-2 border-gray-300 shadow-2xl overflow-auto"
              style={{
                width: dimensions.width * scale,
                height: dimensions.height * scale,
                minHeight: '400px'
              }}
            >
              {/* Grid Overlay */}
              {showGrid && (
                <div 
                  className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: "px`
                  }}
                />
              )}
              {/* Template Content */}
              <div 
                className="w-full h-full"
                style={{
                  transform: ")`,
                  transformOrigin: 'top left',
                  width: dimensions.width,
                  height: dimensions.height
                }}
              >
                {templateContent}
              </div>
            </div>
            {/* Device Info */}
            <div className="absolute -bottom-8 left-0 right-0 flex justify-center>
              <Badge variant="outline" className="bg-white>
                {selectedDevice.name} • {dimensions.width}×{dimensions.height} • {orientation}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      {/* Quick Actions */}
      <div className="border-t p-2 bg-gray-50>
        <div className="flex items-center justify-center space-x-2>
          {devices.slice(0, 6).map((device) => (
            <Button
              key={device.id}
              variant={selectedDevice.id === device.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleDeviceChange(device.id)}
              className="flex items-center space-x-1"
            >
              {device.icon}
              <span className="text-lg">"{device.name.split(' ')[0]}</span>
            </Button>
          ))}
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom([100])}
            title="Reset Zoom"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ResponsivePreview;
