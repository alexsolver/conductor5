import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Move,
  Eye,
  EyeOff,
  Lightbulb,
  Palette,
  Grid3X3,
  Maximize,
  Download,
  Share2,
  Settings,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Camera,
  Video
} from "lucide-react";

interface Model3D {
  id: string;
  name: string;
  description: string;
  fileUrl: string;
  thumbnailUrl: string;
  type: 'obj' | 'fbx' | 'gltf' | 'dae' | 'stl';
  size: number;
  vertexCount: number;
  faceCount: number;
  animations?: string[];
  materials?: string[];
  tags: string[];
  createdAt: string;
}

interface Model3DViewerProps {
  model?: Model3D;
  autoRotate?: boolean;
  showControls?: boolean;
  width?: number;
  height?: number;
}

const Model3DViewer = ({ model, autoRotate = false, showControls = true, width = 800, height = 600 }: Model3DViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [isWireframe, setIsWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [lightIntensity, setLightIntensity] = useState(1);
  const [selectedMaterial, setSelectedMaterial] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { toast } = useToast();

  // Simular carregamento do modelo 3D
  useEffect(() => {
    if (model) {
      setIsLoading(true);
      setError(null);
      
      // Simular carregamento
      const timer = setTimeout(() => {
        setIsLoading(false);
        toast({ 
          title: "Modelo carregado", 
          description: `${model.name} foi carregado com sucesso!` 
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [model, toast]);

  // Auto rotação
  useEffect(() => {
    if (autoRotate && !isLoading && !error) {
      const interval = setInterval(() => {
        setRotation(prev => ({
          ...prev,
          y: (prev.y + 1) % 360
        }));
      }, 50);

      return () => clearInterval(interval);
    }
  }, [autoRotate, isLoading, error]);

  // Controles de câmera
  const handleResetView = () => {
    setRotation({ x: 0, y: 0, z: 0 });
    setZoom(1);
    setPosition({ x: 0, y: 0, z: 0 });
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleRotate = (axis: 'x' | 'y' | 'z', direction: number) => {
    setRotation(prev => ({
      ...prev,
      [axis]: (prev[axis] + direction * 15) % 360
    }));
  };

  // Controles de animação
  const handlePlayAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  const handlePreviousAnimation = () => {
    if (model?.animations && model.animations.length > 0) {
      setCurrentAnimation(prev => (prev - 1 + model.animations!.length) % model.animations!.length);
    }
  };

  const handleNextAnimation = () => {
    if (model?.animations && model.animations.length > 0) {
      setCurrentAnimation(prev => (prev + 1) % model.animations!.length);
    }
  };

  // Export/Share
  const handleExportScreenshot = () => {
    // Simular captura de screenshot
    toast({ 
      title: "Screenshot capturado", 
      description: "Imagem salva na galeria de mídia" 
    });
  };

  const handleExportVideo = () => {
    // Simular export de vídeo
    toast({ 
      title: "Exportando vídeo", 
      description: "Criando vídeo de 360° do modelo..." 
    });
  };

  const handleShare = () => {
    if (navigator.share && model) {
      navigator.share({
        title: model.name,
        text: model.description,
        url: window.location.href
      });
    } else {
      // Fallback para copiar link
      navigator.clipboard.writeText(window.location.href);
      toast({ 
        title: "Link copiado", 
        description: "URL do modelo copiada para área de transferência" 
      });
    }
  };

  if (!model) {
    return (
      <Card className="w-full h-96 flex items-center justify-center">
        <CardContent>
          <div className="text-center text-gray-500">
            <Grid3X3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Nenhum modelo 3D selecionado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                {model.name}
              </CardTitle>
              <CardDescription>{model.description}</CardDescription>
            </div>
            <div className="flex gap-2">
              {model.tags.map(tag => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Viewer Container */}
          <div 
            ref={containerRef}
            className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border"
            style={{ width: width || '100%', height: height || 400 }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando modelo 3D...</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {model.vertexCount.toLocaleString()} vértices • {model.faceCount.toLocaleString()} faces
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <div className="text-center">
                  <div className="text-red-500 mb-4">
                    <Grid3X3 className="h-16 w-16 mx-auto opacity-50" />
                  </div>
                  <p className="text-red-600 font-medium">Erro ao carregar modelo</p>
                  <p className="text-red-500 text-sm mt-1">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => {
                      setError(null);
                      setIsLoading(true);
                      setTimeout(() => setIsLoading(false), 2000);
                    }}
                  >
                    Tentar novamente
                  </Button>
                </div>
              </div>
            )}

            {!isLoading && !error && (
              <>
                {/* 3D Viewport Simulation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div 
                    className="relative transform transition-transform duration-300"
                    style={{
                      transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg) scale(${zoom})`,
                      filter: isWireframe ? 'contrast(200%) brightness(120%)' : 'none'
                    }}
                  >
                    {/* Simulated 3D Model */}
                    <div className="relative">
                      <div className="w-32 h-32 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-lg shadow-2xl">
                        <div className="absolute inset-2 bg-gradient-to-tl from-blue-300 via-purple-400 to-pink-400 rounded opacity-80"></div>
                        <div className="absolute inset-4 bg-gradient-to-br from-white via-blue-200 to-purple-300 rounded opacity-60"></div>
                      </div>
                      {/* Simulated wireframe overlay */}
                      {isWireframe && (
                        <div className="absolute inset-0 border-2 border-dashed border-gray-600 rounded-lg">
                          <div className="absolute inset-2 border border-dashed border-gray-500 rounded"></div>
                          <div className="absolute inset-4 border border-dashed border-gray-400 rounded"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grid */}
                {showGrid && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-32 opacity-30"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, #ccc 1px, transparent 1px),
                        linear-gradient(to bottom, #ccc 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px',
                      perspective: '1000px',
                      transform: 'rotateX(75deg)'
                    }}
                  />
                )}

                {/* Model Info Overlay */}
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {model.type.toUpperCase()} • {(model.size / 1024 / 1024).toFixed(1)}MB
                </div>

                {/* Lighting Control */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, rgba(255,255,255,${lightIntensity * 0.3}) 0%, transparent 70%)`
                  }}
                />
              </>
            )}

            {/* Fullscreen Button */}
            <Button
              variant="outline"
              size="sm"
              className="absolute top-4 right-4 bg-white bg-opacity-90"
              onClick={() => setIsFullscreen(true)}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>

          {/* Controls */}
          {showControls && !isLoading && !error && (
            <div className="mt-4 space-y-4">
              {/* Camera Controls */}
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex gap-1 border-r pr-2">
                  <Button variant="outline" size="sm" onClick={() => handleRotate('y', -1)} title="Girar Esquerda">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleRotate('y', 1)} title="Girar Direita">
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleRotate('x', -1)} title="Girar Cima">
                    ↑
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleRotate('x', 1)} title="Girar Baixo">
                    ↓
                  </Button>
                </div>

                <div className="flex gap-1 border-r pr-2">
                  <Button variant="outline" size="sm" onClick={handleZoomIn} title="Zoom In">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleZoomOut} title="Zoom Out">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleResetView} title="Reset View">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-1 border-r pr-2">
                  <Button 
                    variant={isWireframe ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setIsWireframe(!isWireframe)}
                    title="Wireframe"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={showGrid ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setShowGrid(!showGrid)}
                    title="Grid"
                  >
                    <Move className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={handleExportScreenshot} title="Screenshot">
                    <Camera className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportVideo} title="Export Video">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare} title="Compartilhar">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Animation Controls */}
              {model.animations && model.animations.length > 0 && (
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={handlePreviousAnimation}>
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePlayAnimation}>
                      {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNextAnimation}>
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">
                      Animação: {model.animations[currentAnimation]}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Velocidade:</span>
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={animationSpeed}
                        onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-gray-500 w-8">{animationSpeed}x</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    <Lightbulb className="h-3 w-3 inline mr-1" />
                    Intensidade da Luz
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={lightIntensity}
                    onChange={(e) => setLightIntensity(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {model.materials && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      <Palette className="h-3 w-3 inline mr-1" />
                      Material
                    </label>
                    <select 
                      value={selectedMaterial} 
                      onChange={(e) => setSelectedMaterial(Number(e.target.value))}
                      className="w-full text-xs border rounded px-2 py-1"
                    >
                      {model.materials.map((material, index) => (
                        <option key={index} value={index}>{material}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    <Settings className="h-3 w-3 inline mr-1" />
                    Auto Rotação
                  </label>
                  <Button
                    variant={autoRotate ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      // This would need to be controlled by parent component
                      toast({ title: "Auto rotação", description: autoRotate ? "Desativada" : "Ativada" });
                    }}
                    className="w-full"
                  >
                    {autoRotate ? "Ativada" : "Desativada"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Model Stats */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-900">{model.vertexCount.toLocaleString()}</div>
              <div className="text-gray-500 text-xs">Vértices</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-900">{model.faceCount.toLocaleString()}</div>
              <div className="text-gray-500 text-xs">Faces</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-900">{(model.size / 1024 / 1024).toFixed(1)}MB</div>
              <div className="text-gray-500 text-xs">Tamanho</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-900">{model.type.toUpperCase()}</div>
              <div className="text-gray-500 text-xs">Formato</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <div className="h-[90vh]">
            <Model3DViewer 
              model={model} 
              autoRotate={autoRotate} 
              showControls={true}
              width={undefined}
              height={undefined}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Model3DViewer;