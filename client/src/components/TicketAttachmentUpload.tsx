import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Paperclip, Upload, X, File } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TicketAttachmentUploadProps {
  ticketId: string;
  onUploadComplete?: () => void;
}

interface FileWithPreview extends File {
  preview?: string;
}

export function TicketAttachmentUpload({ ticketId, onUploadComplete }: TicketAttachmentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [description, setDescription] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (files: FileWithPreview[]) => {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`attachments`, file);
      });
      
      // Add description if provided
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Upload successful',
        description: `${selectedFiles.length} file(s) uploaded successfully.`,
      });
      
      setSelectedFiles([]);
      setDescription('');
      
      // Invalidate related queries - use the same key format as TicketDetails
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId, "attachments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId] });
      
      onUploadComplete?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload attachments.',
        variant: 'destructive',
      });
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      // Basic file validation
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `${file.name} is larger than 10MB limit.`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    const filesWithPreview = validFiles.map(file => {
      const fileWithPreview: FileWithPreview = file;
      
      // Generate preview for images
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }
      
      return fileWithPreview;
    });

    setSelectedFiles(prev => [...prev, ...filesWithPreview]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      // Cleanup preview URL
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-6 text-center">
          <input
            type="file"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            id="file-upload"
            accept="*/*"
          />
          
          <div className="flex flex-col items-center space-y-3">
            <Paperclip className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Drop files here or{' '}
                <label 
                  htmlFor="file-upload" 
                  className="text-blue-600 hover:text-blue-700 cursor-pointer underline"
                >
                  browse
                </label>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Maximum file size: 10MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="attachment-description" className="text-sm font-medium text-gray-900">
          Descrição do anexo (opcional)
        </Label>
        <Textarea
          id="attachment-description"
          placeholder="Descreva o conteúdo do anexo ou adicione observações relevantes..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[80px]"
          maxLength={500}
        />
        <p className="text-xs text-gray-500">
          {description.length}/500 caracteres
        </p>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Selected Files:</h4>
          {selectedFiles.map((file, index) => (
            <div 
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {file.preview ? (
                  <img 
                    src={file.preview} 
                    alt={file.name}
                    className="h-8 w-8 object-cover rounded"
                  />
                ) : (
                  <File className="h-6 w-6 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {/* Upload Button */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setSelectedFiles([])}
              disabled={uploadMutation.isPending}
            >
              Limpar Tudo
            </Button>
            <Button
              onClick={() => uploadMutation.mutate(selectedFiles)}
              disabled={uploadMutation.isPending || selectedFiles.length === 0}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar {selectedFiles.length} arquivo{selectedFiles.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}