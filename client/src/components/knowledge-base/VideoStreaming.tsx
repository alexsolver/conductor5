import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Pause, 
  Square,
  SkipBack, 
  SkipForward,
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Download,
  Share2,
  Bookmark,
  BookmarkCheck,
  Subtitles,
  RotateCcw,
  FastForward,
  Rewind,
  PictureInPicture,
  Cast,
  Layers,
  Video,
  Camera,
  Mic,
  MicOff,
  VideoOff
} from "lucide-react";

interface VideoTrack {
  id: string;
  label: string;
  quality: string;
  resolution: string;
  bitrate: number;
}

interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  src: string;
}

interface VideoChapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  thumbnail?: string;
}

interface VideoStreamingProps {
  videoId?: string;
  src?: string;
  poster?: string;
  title?: string;
  description?: string;
  duration?: number;
  chapters?: VideoChapter[];
  subtitles?: SubtitleTrack[];
  videoTracks?: VideoTrack[];
  autoplay?: boolean;
  controls?: boolean;
  interactive?: boolean;
}

const VideoStreaming = ({ 
  videoId,
  src = "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
  poster,
  title = "Vídeo de Treinamento",
  description = "Conteúdo educacional da base de conhecimento",
  duration = 120,
  chapters = [],
  subtitles = [],
  videoTracks = [],
  autoplay = false,
  controls = true,
  interactive = true
}: VideoStreamingProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState(0);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interactiveElements, setInteractiveElements] = useState<any[]>([]);
  const [currentChapter, setCurrentChapter] = useState<VideoChapter | null>(null);

  const { toast } = useToast();

  // Formatar tempo
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Controles de reprodução
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
    setIsMuted(vol === 0);
  };

  const handleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (isFullscreen) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleChapterSelect = (chapter: VideoChapter) => {
    handleSeek(chapter.startTime);
    setCurrentChapter(chapter);
    setShowChapters(false);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({ 
      title: isBookmarked ? "Bookmark removido" : "Vídeo favoritado", 
      description: isBookmarked ? "Removido dos favoritos" : "Adicionado aos favoritos" 
    });
  };

  const handleDownload = () => {
    toast({ 
      title: "Download iniciado", 
      description: "O vídeo será baixado em breve" 
    });
  };

  const handleShare = () => {
    const currentTimeParam = `?t=${Math.floor(currentTime)}`;
    const shareUrl = `${window.location.href}${currentTimeParam}`;
    
    if (navigator.share) {
      navigator.share({
        title: title,
        text: description,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({ 
        title: "Link copiado", 
        description: "URL com timestamp atual copiada" 
      });
    }
  };

  const handlePictureInPicture = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (error) {
        toast({ 
          title: "Erro", 
          description: "Picture-in-Picture não disponível", 
          variant: "destructive" 
        });
      }
    }
  };

  // Event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Verificar capítulo atual
      if (chapters.length > 0) {
        const chapter = chapters.find(ch => 
          video.currentTime >= ch.startTime && video.currentTime < ch.endTime
        );
        if (chapter && chapter !== currentChapter) {
          setCurrentChapter(chapter);
        }
      }
    };

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setError("Erro ao carregar vídeo");
      setIsLoading(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [chapters, currentChapter]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeout);
      setShowControls(true);
      timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    if (isPlaying) {
      resetTimeout();
    } else {
      setShowControls(true);
    }

    return () => clearTimeout(timeout);
  }, [isPlaying]);

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleBookmark}>
                {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Video Container */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              src={src}
              poster={poster}
              className="w-full h-full"
              autoPlay={autoplay}
              muted={isMuted}
              onMouseMove={() => setShowControls(true)}
            />

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Carregando vídeo...</p>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                <div className="text-white text-center">
                  <VideoOff className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">{error}</p>
                  <Button variant="outline" onClick={() => {
                    setError(null);
                    if (videoRef.current) {
                      videoRef.current.load();
                    }
                  }}>
                    Tentar novamente
                  </Button>
                </div>
              </div>
            )}

            {/* Chapter Overlay */}
            {currentChapter && showControls && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded">
                <p className="text-sm font-medium">{currentChapter.title}</p>
              </div>
            )}

            {/* Interactive Elements */}
            {interactive && interactiveElements.map((element, index) => (
              <div
                key={index}
                className="absolute bg-blue-500 bg-opacity-80 text-white px-2 py-1 rounded cursor-pointer text-xs"
                style={{ 
                  left: `${element.x}%`, 
                  top: `${element.y}%`,
                  display: currentTime >= element.startTime && currentTime <= element.endTime ? 'block' : 'none'
                }}
                onClick={() => toast({ title: "Elemento interativo", description: element.content })}
              >
                {element.title}
              </div>
            ))}

            {/* Controls Overlay */}
            {controls && showControls && !error && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                {/* Progress Bar */}
                <div className="mb-4">
                  <Slider
                    value={[currentTime]}
                    max={duration}
                    step={0.1}
                    onValueChange={(value) => handleSeek(value[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-white mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleSkip(-10)} className="text-white hover:bg-white hover:bg-opacity-20">
                      <Rewind className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handlePlayPause} className="text-white hover:bg-white hover:bg-opacity-20">
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleSkip(10)} className="text-white hover:bg-white hover:bg-opacity-20">
                      <FastForward className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="sm" onClick={handleMute} className="text-white hover:bg-white hover:bg-opacity-20">
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        max={1}
                        step={0.05}
                        onValueChange={handleVolumeChange}
                        className="w-20"
                      />
                    </div>

                    <div className="text-white text-sm ml-4">
                      {playbackRate}x
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {chapters.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setShowChapters(true)} className="text-white hover:bg-white hover:bg-opacity-20">
                        <Layers className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {subtitles.length > 0 && (
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white hover:bg-opacity-20">
                        <Subtitles className="h-4 w-4" />
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" onClick={handlePictureInPicture} className="text-white hover:bg-white hover:bg-opacity-20">
                      <PictureInPicture className="h-4 w-4" />
                    </Button>

                    <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)} className="text-white hover:bg-white hover:bg-opacity-20">
                      <Settings className="h-4 w-4" />
                    </Button>

                    <Button variant="ghost" size="sm" onClick={handleFullscreen} className="text-white hover:bg-white hover:bg-opacity-20">
                      {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-900">{formatTime(duration)}</div>
              <div className="text-gray-500 text-xs">Duração</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-900">{videoTracks[selectedQuality]?.quality || "Auto"}</div>
              <div className="text-gray-500 text-xs">Qualidade</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-900">{playbackRate}x</div>
              <div className="text-gray-500 text-xs">Velocidade</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chapters Dialog */}
      <Dialog open={showChapters} onOpenChange={setShowChapters}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Capítulos do Vídeo</DialogTitle>
            <DialogDescription>
              Navegue pelos capítulos do conteúdo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                  currentChapter?.id === chapter.id ? 'bg-blue-50 border border-blue-200' : ''
                }`}
                onClick={() => handleChapterSelect(chapter)}
              >
                {chapter.thumbnail && (
                  <img 
                    src={chapter.thumbnail} 
                    alt={chapter.title}
                    className="w-16 h-9 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{chapter.title}</p>
                  <p className="text-sm text-gray-500">
                    {formatTime(chapter.startTime)} - {formatTime(chapter.endTime)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações do Vídeo</DialogTitle>
            <DialogDescription>
              Ajuste as configurações de reprodução
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Playback Speed */}
            <div>
              <label className="text-sm font-medium mb-2 block">Velocidade de Reprodução</label>
              <div className="grid grid-cols-4 gap-2">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                  <Button
                    key={speed}
                    variant={playbackRate === speed ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSpeedChange(speed)}
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
            </div>

            {/* Quality */}
            {videoTracks.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Qualidade</label>
                <div className="space-y-2">
                  {videoTracks.map((track, index) => (
                    <div
                      key={track.id}
                      className={`p-2 border rounded cursor-pointer ${
                        selectedQuality === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedQuality(index)}
                    >
                      <div className="font-medium">{track.quality}</div>
                      <div className="text-sm text-gray-500">
                        {track.resolution} • {Math.round(track.bitrate / 1000)}kbps
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subtitles */}
            {subtitles.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Legendas</label>
                <div className="space-y-2">
                  <div
                    className={`p-2 border rounded cursor-pointer ${
                      selectedSubtitle === null ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedSubtitle(null)}
                  >
                    Desligado
                  </div>
                  {subtitles.map((subtitle) => (
                    <div
                      key={subtitle.id}
                      className={`p-2 border rounded cursor-pointer ${
                        selectedSubtitle === subtitle.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedSubtitle(subtitle.id)}
                    >
                      <div className="font-medium">{subtitle.label}</div>
                      <div className="text-sm text-gray-500">{subtitle.language}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoStreaming;