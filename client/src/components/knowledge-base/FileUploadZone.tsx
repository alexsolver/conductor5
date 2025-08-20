import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
// import { useLocalization } from '@/hooks/useLocalization';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  url?: string;
}

interface FileUploadZoneProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

export function FileUploadZone({
  // Localization temporarily disabled

  onFilesUploaded,
  maxFiles = 5,
  maxFileSize = 10,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
  className = ''
}: FileUploadZoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Simulate upload process for each file
    for (const fileData of newFiles) {
      try {
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === fileData.id 
                ? { ...f, progress }
                : f
            )
          );
        }

        // Mark as completed
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileData.id 
              ? { 
                  ...f, 
                  status: 'completed' as const, 
                  progress: 100,
                  url: `/uploads/${fileData.name" // Mock URL
                }
              : f
          )
        );

        toast({
          title: "✅ Arquivo enviado",
          description: `${fileData.name} foi enviado com sucesso.`
        });

      } catch (error) {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileData.id 
              ? { ...f, status: 'error' as const }
              : f
          )
        );

        toast({
          title: '[TRANSLATION_NEEDED]',
          description: `Falha ao enviar ${fileData.name}.`,
          variant: "destructive"
        });
      }
    }

    // Notify parent component
    const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
    onFilesUploaded(completedFiles);
  }, [uploadedFiles, onFilesUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize: maxFileSize * 1024 * 1024, // Convert MB to bytes
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {})
  });

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId && f.status === 'completed');
    onFilesUploaded(updatedFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4 "`}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 mb-2">
          {isDragActive
            ? 'Solte os arquivos aqui...'
            : 'Arraste arquivos aqui ou clique para selecionar'
          }
        </p>
        <p className="text-xs text-gray-500">
          Máximo {maxFiles} arquivos • Até {maxFileSize}MB cada
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Formatos: PDF, DOC, DOCX, TXT, Imagens
        </p>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Arquivos Anexados</h4>
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center space-x-3 flex-1">
                <File className="h-5 w-5 text-gray-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                    <Badge 
                      variant={
                        file.status === 'completed' ? 'default' :
                        file.status === 'error' ? 'destructive' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {file.status === 'uploading' && 'Enviando...'}
                      {file.status === 'completed' && 'Concluído'}
                      {file.status === 'error' && '[TRANSLATION_NEEDED]'}
                    </Badge>
                  </div>
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="w-full h-1 mt-1" />
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {file.status === 'completed' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}