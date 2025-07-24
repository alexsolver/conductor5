import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Upload, FileText, Download, Trash2, Plus } from 'lucide-react';

interface ItemAttachmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
}

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export function ItemAttachmentsModal({ isOpen, onClose, itemId, itemName }: ItemAttachmentsModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar anexos do item
  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['/api/parts-services-complete/items', itemId, 'attachments'],
    queryFn: () => apiRequest('GET', `/api/parts-services-complete/items/${itemId}/attachments`),
    enabled: isOpen && !!itemId,
  });

  // Mutation para upload de anexo
  const uploadMutation = useMutation({
    mutationFn: async (data: { file: File; fileName: string }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('fileName', data.fileName);
      formData.append('fileSize', data.file.size.toString());
      formData.append('mimeType', data.file.type);
      formData.append('fileUrl', `uploads/${data.fileName}`); // Simulated URL

      return apiRequest('POST', `/api/parts-services-complete/items/${itemId}/attachments`, formData);
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Anexo adicionado com sucesso!',
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/parts-services-complete/items', itemId, 'attachments'] 
      });
      setSelectedFile(null);
      setIsUploading(false);
    },
    onError: (error) => {
      console.error('Error uploading attachment:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao fazer upload do anexo',
        variant: 'destructive',
      });
      setIsUploading(false);
    },
  });

  // Mutation para deletar anexo
  const deleteMutation = useMutation({
    mutationFn: (attachmentId: string) => 
      apiRequest('DELETE', `/api/parts-services-complete/attachments/${attachmentId}`),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Anexo removido com sucesso!',
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/parts-services-complete/items', itemId, 'attachments'] 
      });
    },
    onError: (error) => {
      console.error('Error deleting attachment:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover anexo',
        variant: 'destructive',
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamanho do arquivo (máximo 200MB)
      if (file.size > 200 * 1024 * 1024) {
        toast({
          title: 'Erro',
          description: 'Arquivo muito grande. Máximo 200MB permitido.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      setIsUploading(true);
      uploadMutation.mutate({
        file: selectedFile,
        fileName: selectedFile.name,
      });
    }
  };

  const handleDelete = (attachmentId: string) => {
    if (window.confirm('Tem certeza que deseja remover este anexo?')) {
      deleteMutation.mutate(attachmentId);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return '🖼️';
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word')) return '📝';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📊';
    return '📎';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Anexos do Item: {itemName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Clique para selecionar um arquivo ou arraste aqui
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    Máximo 200MB - Todos os tipos de arquivo aceitos
                  </span>
                </Label>
                <Input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileSelect}
                />
              </div>
            </div>

            {selectedFile && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{isUploading ? 'Enviando...' : 'Adicionar'}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Attachments List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Anexos ({attachments?.attachments?.length || 0})
            </h3>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Carregando anexos...</p>
              </div>
            ) : attachments?.attachments?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2">Nenhum anexo encontrado</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {attachments?.attachments?.map((attachment: Attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {getFileIcon(attachment.mimeType)}
                      </div>
                      <div>
                        <p className="font-medium">{attachment.fileName}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(attachment.fileSize)} • {' '}
                          Enviado em {new Date(attachment.uploadedAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(attachment.fileUrl, '_blank')}
                        className="flex items-center space-x-1"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(attachment.id)}
                        disabled={deleteMutation.isPending}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Remover</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}