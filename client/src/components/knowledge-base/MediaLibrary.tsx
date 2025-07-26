import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Image as ImageIcon, 
  Video, 
  File, 
  Upload, 
  Search, 
  Filter,
  Grid3X3,
  List,
  Eye,
  Download,
  Trash2,
  Plus,
  FolderPlus,
  Tag,
  Calendar,
  FileText,
  Palette,
  Camera,
  Mic,
  Play,
  Pause,
  Volume2,
  Maximize,
  Share2,
  Copy,
  Edit3,
  MoreHorizontal
} from "lucide-react";

interface MediaFile {
  id: string;
  name: string;
  originalName: string;
  type: 'image' | 'video' | 'audio' | 'document' | '3d_model' | 'diagram';
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  tags: string[];
  description?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  folderId?: string;
}

interface MediaFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  parentId?: string;
  createdAt: string;
  fileCount: number;
}

interface MediaLibraryProps {
  onSelectFile?: (file: MediaFile) => void;
  selectionMode?: boolean;
  acceptedTypes?: string[];
}

const MediaLibrary = ({ onSelectFile, selectionMode = false, acceptedTypes }: MediaLibraryProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragover, setDragover] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: mediaFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ['/api/knowledge-base/media/files', selectedFolder, searchQuery, selectedType],
    queryFn: () => apiRequest('GET', `/api/knowledge-base/media/files?folder=${selectedFolder || ''}&search=${searchQuery}&type=${selectedType}`)
  });

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['/api/knowledge-base/media/folders'],
    queryFn: () => apiRequest('GET', '/api/knowledge-base/media/folders')
  });

  const { data: mediaStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/knowledge-base/media/stats'],
    queryFn: () => apiRequest('GET', '/api/knowledge-base/media/stats')
  });

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('POST', '/api/knowledge-base/media/upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/media/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/media/stats'] });
      setIsUploadDialogOpen(false);
      toast({ title: "Sucesso", description: "Arquivo enviado com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Erro ao enviar arquivo", variant: "destructive" });
    }
  });

  const createFolderMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/knowledge-base/media/folders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/media/folders'] });
      setIsFolderDialogOpen(false);
      toast({ title: "Sucesso", description: "Pasta criada com sucesso!" });
    }
  });

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) => apiRequest('DELETE', `/api/knowledge-base/media/files/${fileId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/media/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/media/stats'] });
      toast({ title: "Sucesso", description: "Arquivo removido com sucesso!" });
    }
  });

  // Drag and drop handlers
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragover(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragover(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragover(false);
  }, []);

  // File upload handler
  const handleFileUpload = (files: File[]) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });
    
    if (selectedFolder) {
      formData.append('folderId', selectedFolder);
    }
    
    uploadMutation.mutate(formData);
  };

  // File type icons
  const getFileIcon = (type: string, mimeType: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-6 w-6 text-blue-500" />;
      case 'video':
        return <Video className="h-6 w-6 text-purple-500" />;
      case 'audio':
        return <Mic className="h-6 w-6 text-green-500" />;
      case '3d_model':
        return <Palette className="h-6 w-6 text-orange-500" />;
      case 'diagram':
        return <Grid3X3 className="h-6 w-6 text-indigo-500" />;
      default:
        return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Preview file
  const handlePreview = (file: MediaFile) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header Statistics */}
      {!selectionMode && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Arquivos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mediaStats?.totalFiles || 0}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <FileText className="h-3 w-3 mr-1" />
                {mediaStats?.totalSize ? formatFileSize(mediaStats.totalSize) : '0 Bytes'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Imagens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mediaStats?.imageCount || 0}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <ImageIcon className="h-3 w-3 mr-1" />
                Fotos e ilustrações
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Vídeos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mediaStats?.videoCount || 0}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Video className="h-3 w-3 mr-1" />
                Conteúdo audiovisual
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mediaStats?.documentCount || 0}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <File className="h-3 w-3 mr-1" />
                PDFs e documentos
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {!selectionMode && (
            <>
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload de Mídia
                  </Button>
                </DialogTrigger>
              </Dialog>

              <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Nova Pasta
                  </Button>
                </DialogTrigger>
              </Dialog>
            </>
          )}

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar arquivos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full sm:w-64"
            />
          </div>

          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">Todos os tipos</option>
            <option value="image">Imagens</option>
            <option value="video">Vídeos</option>
            <option value="audio">Áudio</option>
            <option value="document">Documentos</option>
            <option value="3d_model">Modelos 3D</option>
            <option value="diagram">Diagramas</option>
          </select>
        </div>
      </div>

      {/* Folders Navigation */}
      {folders.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedFolder === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFolder(null)}
          >
            Todos os arquivos
          </Button>
          {folders.map((folder: MediaFolder) => (
            <Button
              key={folder.id}
              variant={selectedFolder === folder.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFolder(folder.id)}
            >
              {folder.name} ({folder.fileCount})
            </Button>
          ))}
        </div>
      )}

      {/* Drag and Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragover ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Arraste arquivos aqui ou clique para fazer upload
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Suporte para imagens, vídeos, áudio, documentos, modelos 3D e diagramas
        </p>
        <input
          type="file"
          multiple
          accept={acceptedTypes?.join(',') || "image/*,video/*,audio/*,.pdf,.doc,.docx,.obj,.fbx,.dae"}
          onChange={(e) => e.target.files && handleFileUpload(Array.from(e.target.files))}
          className="hidden"
          id="file-upload-input"
        />
        <label htmlFor="file-upload-input">
          <Button variant="outline" className="cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Selecionar Arquivos
          </Button>
        </label>
      </div>

      {/* Files Grid/List */}
      <div className={`flex-1 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4' : 'space-y-2'}`}>
        {mediaFiles.map((file: MediaFile) => (
          <Card 
            key={file.id} 
            className={`${viewMode === 'grid' ? 'aspect-square' : 'p-4'} cursor-pointer hover:shadow-md transition-shadow ${
              selectedFiles.includes(file.id) ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => {
              if (selectionMode && onSelectFile) {
                onSelectFile(file);
              } else {
                handlePreview(file);
              }
            }}
          >
            {viewMode === 'grid' ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-t-lg">
                  {file.type === 'image' && file.thumbnailUrl ? (
                    <img 
                      src={file.thumbnailUrl} 
                      alt={file.name} 
                      className="max-w-full max-h-full object-cover rounded"
                    />
                  ) : (
                    getFileIcon(file.type, file.mimeType)
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                  {file.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {file.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {file.type === 'image' && file.thumbnailUrl ? (
                    <img 
                      src={file.thumbnailUrl} 
                      alt={file.name} 
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    getFileIcon(file.type, file.mimeType)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.originalName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                  {file.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {file.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(file);
                  }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={(e) => {
                    e.stopPropagation();
                    window.open(file.url, '_blank');
                  }}>
                    <Download className="h-4 w-4" />
                  </Button>
                  {!selectionMode && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFileMutation.mutate(file.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload de Mídia</DialogTitle>
            <DialogDescription>
              Faça upload de imagens, vídeos, áudio, documentos, modelos 3D e diagramas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">Arraste arquivos aqui ou clique para selecionar</p>
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.obj,.fbx,.dae"
                onChange={(e) => e.target.files && handleFileUpload(Array.from(e.target.files))}
                className="hidden"
                id="upload-dialog-input"
              />
              <label htmlFor="upload-dialog-input">
                <Button variant="outline" className="cursor-pointer">
                  Selecionar Arquivos
                </Button>
              </label>
            </div>
            
            {uploadMutation.isPending && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Enviando arquivo...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
            <DialogDescription>
              Organize seus arquivos criando uma nova pasta
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createFolderMutation.mutate({
              name: formData.get('name'),
              description: formData.get('description'),
              color: formData.get('color') || '#3B82F6'
            });
          }} className="space-y-4">
            <div>
              <Label htmlFor="folder-name">Nome da Pasta *</Label>
              <Input id="folder-name" name="name" required />
            </div>
            <div>
              <Label htmlFor="folder-description">Descrição</Label>
              <Textarea id="folder-description" name="description" rows={2} />
            </div>
            <div>
              <Label htmlFor="folder-color">Cor</Label>
              <input 
                type="color" 
                id="folder-color" 
                name="color" 
                defaultValue="#3B82F6"
                className="w-full h-10 rounded border"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={createFolderMutation.isPending}>
                {createFolderMutation.isPending ? 'Criando...' : 'Criar Pasta'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsFolderDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          {previewFile && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getFileIcon(previewFile.type, previewFile.mimeType)}
                  {previewFile.originalName}
                </DialogTitle>
                <DialogDescription>
                  {formatFileSize(previewFile.size)} • {new Date(previewFile.createdAt).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-auto">
                {previewFile.type === 'image' && (
                  <img 
                    src={previewFile.url} 
                    alt={previewFile.originalName}
                    className="max-w-full h-auto mx-auto"
                  />
                )}
                
                {previewFile.type === 'video' && (
                  <video 
                    src={previewFile.url} 
                    controls 
                    className="max-w-full h-auto mx-auto"
                  />
                )}
                
                {previewFile.type === 'audio' && (
                  <div className="flex flex-col items-center gap-4 p-8">
                    <Mic className="h-16 w-16 text-green-500" />
                    <audio src={previewFile.url} controls className="w-full max-w-md" />
                  </div>
                )}
                
                {previewFile.type === 'document' && (
                  <div className="text-center p-8">
                    <FileText className="h-16 w-16 mx-auto text-blue-500 mb-4" />
                    <p className="text-lg font-medium mb-2">{previewFile.originalName}</p>
                    <Button onClick={() => window.open(previewFile.url, '_blank')}>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Arquivo
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => window.open(previewFile.url, '_blank')}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
                <Button variant="outline" onClick={() => {
                  navigator.clipboard.writeText(previewFile.url);
                  toast({ title: "Link copiado!", description: "URL do arquivo copiada para a área de transferência" });
                }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Link
                </Button>
                {selectionMode && onSelectFile && (
                  <Button onClick={() => {
                    onSelectFile(previewFile);
                    setIsPreviewOpen(false);
                  }}>
                    Selecionar
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaLibrary;