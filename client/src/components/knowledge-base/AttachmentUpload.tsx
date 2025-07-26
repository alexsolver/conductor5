/**
 * Attachment Upload Component for Knowledge Base
 * Drag & drop file upload with version control
 */

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { 
  Upload, 
  File, 
  Image as ImageIcon,
  FileText,
  Download,
  Trash2,
  Eye,
  Plus
} from 'lucide-react'
import { formatBytes } from '../../lib/utils'

interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  version: number
  uploadedAt: Date
  uploadedBy: string
  description?: string
}

interface AttachmentUploadProps {
  attachments: Attachment[]
  onUpload: (files: File[], descriptions: string[]) => void
  onDelete: (attachmentId: string) => void
  onDownload: (attachment: Attachment) => void
  maxFileSize?: number // in bytes
  acceptedTypes?: string[]
}

export function AttachmentUpload({ 
  attachments, 
  onUpload, 
  onDelete, 
  onDownload,
  maxFileSize = 200 * 1024 * 1024, // 200MB
  acceptedTypes = ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/*']
}: AttachmentUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [fileDescriptions, setFileDescriptions] = useState<{ [key: string]: string }>({})
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      if (file.size > maxFileSize) {
        console.error(`Arquivo ${file.name} excede o tamanho máximo de ${formatBytes(maxFileSize)}`)
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      setPendingFiles(validFiles)
      setShowUploadDialog(true)
      
      // Initialize descriptions
      const descriptions: { [key: string]: string } = {}
      validFiles.forEach(file => {
        descriptions[file.name] = ''
      })
      setFileDescriptions(descriptions)
    }
  }, [maxFileSize])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as any),
    maxSize: maxFileSize,
    multiple: true
  })

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return

    setIsUploading(true)
    
    // Simulate upload progress
    for (const file of pendingFiles) {
      for (let progress = 0; progress <= 100; progress += 10) {
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    const descriptions = pendingFiles.map(file => fileDescriptions[file.name] || '')
    onUpload(pendingFiles, descriptions)
    
    setPendingFiles([])
    setFileDescriptions({})
    setUploadProgress({})
    setShowUploadDialog(false)
    setIsUploading(false)
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-5 w-5" />
    if (type.includes('pdf')) return <FileText className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  const getFileTypeColor = (type: string) => {
    if (type.startsWith('image/')) return 'bg-green-100 text-green-800'
    if (type.includes('pdf')) return 'bg-red-100 text-red-800'
    if (type.includes('word')) return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Anexos
          </CardTitle>
          <CardDescription>
            Arraste arquivos aqui ou clique para selecionar. Máximo {formatBytes(maxFileSize)} por arquivo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-blue-600">Solte os arquivos aqui...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Arraste e solte arquivos aqui, ou clique para selecionar
                </p>
                <p className="text-sm text-gray-500">
                  Suporta: PDF, Word, Imagens, Texto
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar Upload de Arquivos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {pendingFiles.map((file, index) => (
              <div key={file.name} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  {getFileIcon(file.type)}
                  <div className="flex-1">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatBytes(file.size)} • {file.type}
                    </p>
                  </div>
                  <Badge className={getFileTypeColor(file.type)}>
                    {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`description-${index}`}>Descrição (opcional)</Label>
                  <Input
                    id={`description-${index}`}
                    value={fileDescriptions[file.name] || ''}
                    onChange={(e) => setFileDescriptions(prev => ({
                      ...prev,
                      [file.name]: e.target.value
                    }))}
                    placeholder="Descreva o conteúdo do arquivo..."
                  />
                </div>

                {uploadProgress[file.name] !== undefined && (
                  <div className="mt-3">
                    <Progress value={uploadProgress[file.name]} className="w-full" />
                    <p className="text-sm text-gray-500 mt-1">
                      {uploadProgress[file.name]}% concluído
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowUploadDialog(false)}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={isUploading || pendingFiles.length === 0}
            >
              {isUploading ? 'Enviando...' : `Enviar ${pendingFiles.length} arquivo(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attachments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Anexos ({attachments.length})</span>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Galeria de Imagens</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {attachments
                    .filter(att => att.type.startsWith('image/'))
                    .map(attachment => (
                      <div key={attachment.id} className="relative group">
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white"
                            onClick={() => onDownload(attachment)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <File className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum anexo encontrado</p>
              <p className="text-sm">Faça upload de arquivos para começar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attachments.map(attachment => (
                <div key={attachment.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  {getFileIcon(attachment.type)}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{attachment.name}</p>
                      {attachment.version > 1 && (
                        <Badge variant="outline">v{attachment.version}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{formatBytes(attachment.size)}</span>
                      <span>•</span>
                      <span>{attachment.uploadedAt.toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{attachment.uploadedBy}</span>
                    </div>
                    {attachment.description && (
                      <p className="text-sm text-gray-600 mt-1">{attachment.description}</p>
                    )}
                  </div>

                  <Badge className={getFileTypeColor(attachment.type)}>
                    {attachment.type.split('/')[1]?.toUpperCase() || 'FILE'}
                  </Badge>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDownload(attachment)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(attachment.url, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(attachment.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}