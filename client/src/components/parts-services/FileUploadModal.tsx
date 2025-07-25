import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, File, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FileUploadModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemTitle: string;
}

export function FileUploadModal({ isOpen, onOpenChange, itemId, itemTitle }: FileUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [description, setDescription] = useState("");
  const [attachmentType, setAttachmentType] = useState("manual");
  const [isUploading, setIsUploading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Simular progresso de upload
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simular progresso de upload
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      try {
        const response = await apiRequest('POST', `/api/parts-services/items/${itemId}/attachments`, formData);
        setUploadProgress(100);
        clearInterval(interval);
        return response;
      } catch (error) {
        clearInterval(interval);
        setUploadProgress(0);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Upload realizado com sucesso",
        description: `${selectedFiles?.length} arquivo(s) anexado(s) ao item`,
      });
      
      // Resetar form
      setSelectedFiles(null);
      setDescription("");
      setAttachmentType("manual");
      setUploadProgress(0);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ 
        queryKey: [`/api/parts-services/items/${itemId}/attachments`] 
      });
      
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro no upload",
        description: error?.message || "Falha ao enviar arquivos",
        variant: "destructive",
      });
      setUploadProgress(0);
      setIsUploading(false);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleUpload = () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione pelo menos um arquivo para upload",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    
    // Adicionar cada arquivo
    Array.from(selectedFiles).forEach((file, index) => {
      formData.append(`files`, file);
    });
    
    // Adicionar metadados
    formData.append('description', description);
    formData.append('attachmentType', attachmentType);
    formData.append('itemId', itemId);

    uploadMutation.mutate(formData);
  };

  const removeFile = (index: number) => {
    if (selectedFiles) {
      const dt = new DataTransfer();
      Array.from(selectedFiles).forEach((file, i) => {
        if (i !== index) dt.items.add(file);
      });
      setSelectedFiles(dt.files.length > 0 ? dt.files : null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Anexos - {itemTitle}
          </DialogTitle>
          <DialogDescription>
            Envie manuais, imagens, certificados e documentos relacionados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seleção de Tipo */}
          <div className="space-y-2">
            <Label htmlFor="attachment-type">Tipo de Anexo</Label>
            <select
              id="attachment-type"
              value={attachmentType}
              onChange={(e) => setAttachmentType(e.target.value)}
              className="w-full p-2 border rounded-md text-sm"
            >
              <option value="manual">Manual/Documentação</option>
              <option value="image">Imagem/Foto</option>
              <option value="certificate">Certificado</option>
              <option value="datasheet">Datasheet Técnico</option>
              <option value="other">Outro</option>
            </select>
          </div>

          {/* Seleção de Arquivo */}
          <div className="space-y-2">
            <Label htmlFor="file-input">Selecionar Arquivos</Label>
            <Input
              id="file-input"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.tiff"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              Aceitos: PDF, Word, Excel, Imagens (máx. 50MB cada)
            </p>
          </div>

          {/* Lista de Arquivos Selecionados */}
          {selectedFiles && selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Arquivos Selecionados ({selectedFiles.length})</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {Array.from(selectedFiles).map((file, index) => (
                  <Card key={index} className="p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4" />
                        <div>
                          <p className="text-sm font-medium truncate max-w-48">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva o conteúdo dos anexos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
              rows={3}
            />
          </div>

          {/* Progresso de Upload */}
          {isUploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Enviando arquivos...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFiles || selectedFiles.length === 0 || isUploading}
            >
              {isUploading ? "Enviando..." : `Upload ${selectedFiles?.length || 0} arquivo(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}