import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, FileIcon, Trash2, Download, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AttachmentsModalProps {
  ticketId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Attachment {
  id: string;
  filename: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  source: 'user' | 'email';
}

export default function AttachmentsModal({ ticketId, isOpen, onClose }: AttachmentsModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch attachments
  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ["/api/tickets", ticketId, "attachments"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${ticketId}/attachments`);
      return response.json();
    },
    enabled: isOpen,
  });

  // Upload attachment mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source", "user");
      
      const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload file");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Arquivo anexado com sucesso",
      });
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId, "attachments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete attachment mutation
  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const response = await apiRequest("DELETE", `/api/tickets/${ticketId}/attachments/${attachmentId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Anexo removido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId, "attachments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (30MB limit)
      if (file.size > 30 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "Arquivo muito grande. Limite máximo: 30MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Byte";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  const handleDownload = (attachment: Attachment) => {
    window.open(`/api/tickets/${ticketId}/attachments/${attachment.id}/download`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Anexos do Ticket
          </DialogTitle>
          <DialogDescription>
            Gerencie arquivos anexados ao ticket. Limite máximo: 30MB por arquivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Clique para selecionar ou arraste arquivos aqui
                  </span>
                  <Input
                    id="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileSelect}
                  />
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Máximo 30MB por arquivo
                </p>
              </div>
            </div>

            {selectedFile && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileIcon className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <Badge variant="outline">{formatFileSize(selectedFile.size)}</Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleUpload}
                      disabled={uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? "Enviando..." : "Anexar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Attachments List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Arquivos Anexados ({attachments.length})</h3>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Carregando anexos...</p>
              </div>
            ) : attachments.length === 0 ? (
              <div className="text-center py-8">
                <FileIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Nenhum arquivo anexado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachments.map((attachment: Attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <FileIcon className="w-6 h-6 text-blue-500" />
                      <div>
                        <p className="font-medium">{attachment.filename}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Badge variant={attachment.source === 'email' ? 'default' : 'secondary'}>
                            {attachment.source === 'email' ? 'Email' : 'Upload'}
                          </Badge>
                          <span>{formatFileSize(attachment.size)}</span>
                          <span>•</span>
                          <span>{new Date(attachment.uploadedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{attachment.uploadedBy}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(attachment)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteMutation.mutate(attachment.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}