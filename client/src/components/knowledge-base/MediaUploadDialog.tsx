// ✅ 1QA.MD COMPLIANCE: FRONTEND COMPONENT - CLEAN ARCHITECTURE
// Presentation layer component for media uploads

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Upload, File, Image, Video } from "lucide-react";
// import { useLocalization } from '@/hooks/useLocalization';

interface MediaUploadDialogProps {
  onSuccess?: (file: any) => void;
}

export function MediaUploadDialog({
  // Localization temporarily disabled
 onSuccess }: MediaUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setIsUploading(true);
    
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const uploadedFile = {
        id: "
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString()
      };

      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "" enviado com sucesso!`,
      });

      setIsOpen(false);
      onSuccess?.(uploadedFile);
    } catch (error) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: '[TRANSLATION_NEEDED]',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="h-8 w-8 text-purple-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" data-testid="button-upload-media">
          <Upload className="h-4 w-4" />
          Fazer Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload de Mídia</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            "
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Suporta imagens, vídeos e documentos (máx. 10MB)
            </p>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileInput}
              accept="image/*,video/*,.pdf,.doc,.docx"
              data-testid="input-file-upload"
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={isUploading}
            >
              {isUploading ? "Enviando..." : "Selecionar Arquivo"
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            <p>Formatos aceitos:</p>
            <ul className="list-disc list-inside mt-1">
              <li>Imagens: JPG, PNG, GIF, WebP</li>
              <li>Vídeos: MP4, WebM, MOV</li>
              <li>Documentos: PDF, DOC, DOCX</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}