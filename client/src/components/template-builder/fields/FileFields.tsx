
/**
 * Componentes de upload de arquivo para o template builder
 */

import React, { useRef, useState } from 'react'
import { Label } from '../../ui/label'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Progress } from '../../ui/progress'
import { Alert, AlertDescription } from '../../ui/alert'
import { Upload, X, File, Image as ImageIcon, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { FieldComponent } from '../DragDropCanvas'

interface FileFieldProps {
  field: FieldComponent
  value?: any
  onChange?: (value: any) => void
  disabled?: boolean
}

interface FileInfo {
  name: string
  size: number
  type: string
  url?: string
  progress?: number
  error?: string
}

export const FileUploadField: React.FC<FileFieldProps> = ({ 
  field, 
  value = [], 
  onChange, 
  disabled = false 
}) => {
  const { properties = {} } = field
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  const acceptedTypes = properties.acceptedTypes || '.jpg,.png,.pdf,.doc,.docx'
  const maxSize = (properties.maxSize || 10) * 1024 * 1024 // Convert MB to bytes
  const multiple = properties.multiple || false
  const files = Array.isArray(value) ? value : (value ? [value] : [])

  const validateFile = (file: File): string | null => {
    // Verificar tamanho
    if (file.size > maxSize) {
      return `Arquivo muito grande. Máximo permitido: ${properties.maxSize}MB`
    }

    // Verificar tipo (simplificado)
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`
    const allowedExtensions = acceptedTypes.split(',').map(ext => ext.trim().toLowerCase())
    
    if (!allowedExtensions.includes(extension)) {
      return `Tipo de arquivo não permitido. Permitidos: ${acceptedTypes}`
    }

    return null
  }

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || disabled) return

    const fileArray = Array.from(selectedFiles)
    const newFiles: FileInfo[] = []

    for (const file of fileArray) {
      const error = validateFile(file)
      const fileInfo: FileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        error,
        progress: error ? undefined : 0
      }

      newFiles.push(fileInfo)
    }

    if (multiple) {
      onChange?.([...files, ...newFiles])
    } else {
      onChange?.(newFiles[0] || null)
    }

    // Simular upload
    simulateUpload(newFiles.filter(f => !f.error))
  }

  const simulateUpload = async (filesToUpload: FileInfo[]) => {
    setUploading(true)

    for (const file of filesToUpload) {
      // Simular progresso de upload
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const updatedFiles = (multiple ? files : [files]).map((f: FileInfo) =>
          f.name === file.name ? { ...f, progress } : f
        )

        if (multiple) {
          onChange?.(updatedFiles)
        } else {
          onChange?.(updatedFiles[0])
        }
      }

      // Marcar como concluído
      const finalFiles = (multiple ? files : [files]).map((f: FileInfo) =>
        f.name === file.name ? { ...f, progress: 100, url: `#uploaded-${f.name}` } : f
      )

      if (multiple) {
        onChange?.(finalFiles)
      } else {
        onChange?.(finalFiles[0])
      }
    }

    setUploading(false)
  }

  const removeFile = (fileName: string) => {
    if (disabled) return

    if (multiple) {
      const updatedFiles = files.filter((f: FileInfo) => f.name !== fileName)
      onChange?.(updatedFiles)
    } else {
      onChange?.(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {field.label}
          {properties.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Badge variant="outline" className="text-xs">upload</Badge>
      </div>

      {/* Área de Upload */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <div className="text-sm text-gray-600">
          <span className="font-medium">Clique para fazer upload</span> ou arraste arquivos aqui
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {acceptedTypes} • Máx. {properties.maxSize}MB
          {multiple && ' • Múltiplos arquivos'}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Lista de Arquivos */}
      {files.length > 0 && (
        <div className="space-y-2">
          {(multiple ? files : [files]).map((file: FileInfo, index: number) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
              <div className="flex-shrink-0">
                {file.error ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : file.progress === 100 ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <File className="w-5 h-5 text-blue-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  {!disabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.name)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                
                {file.error && (
                  <p className="text-xs text-red-500 mt-1">{file.error}</p>
                )}
                
                {file.progress !== undefined && file.progress < 100 && (
                  <Progress value={file.progress} className="h-2 mt-2" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {properties.description && (
        <p className="text-xs text-gray-500">{properties.description}</p>
      )}

      {uploading && (
        <Alert>
          <Upload className="h-4 w-4" />
          <AlertDescription>
            Fazendo upload dos arquivos...
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export const ImageUploadField: React.FC<FileFieldProps> = ({ 
  field, 
  value = [], 
  onChange, 
  disabled = false 
}) => {
  const { properties = {} } = field
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const acceptedTypes = properties.acceptedTypes || '.jpg,.jpeg,.png,.gif,.webp'
  const maxSize = (properties.maxSize || 5) * 1024 * 1024 // Convert MB to bytes
  const multiple = properties.multiple || false
  const images = Array.isArray(value) ? value : (value ? [value] : [])

  const validateImage = (file: File): string | null => {
    if (file.size > maxSize) {
      return `Imagem muito grande. Máximo permitido: ${properties.maxSize}MB`
    }

    if (!file.type.startsWith('image/')) {
      return 'Apenas arquivos de imagem são permitidos'
    }

    return null
  }

  const handleImageSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || disabled) return

    const fileArray = Array.from(selectedFiles)
    const newImages: FileInfo[] = []

    for (const file of fileArray) {
      const error = validateImage(file)
      const imageInfo: FileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        error,
        url: error ? undefined : URL.createObjectURL(file)
      }

      newImages.push(imageInfo)
    }

    if (multiple) {
      onChange?.([...images, ...newImages])
    } else {
      onChange?.(newImages[0] || null)
    }
  }

  const removeImage = (imageName: string) => {
    if (disabled) return

    if (multiple) {
      const updatedImages = images.filter((img: FileInfo) => img.name !== imageName)
      onChange?.(updatedImages)
    } else {
      onChange?.(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleImageSelect(e.dataTransfer.files)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {field.label}
          {properties.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Badge variant="outline" className="text-xs">imagem</Badge>
      </div>

      {/* Área de Upload */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <div className="text-sm text-gray-600">
          <span className="font-medium">Clique para fazer upload</span> ou arraste imagens aqui
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {acceptedTypes} • Máx. {properties.maxSize}MB
          {multiple && ' • Múltiplas imagens'}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        multiple={multiple}
        onChange={(e) => handleImageSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Preview das Imagens */}
      {images.length > 0 && (
        <div className={`grid gap-4 ${multiple ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
          {(multiple ? images : [images]).map((image: FileInfo, index: number) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border bg-gray-100">
                {image.url && !image.error ? (
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                )}
              </div>
              
              {!disabled && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeImage(image.name)}
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              
              <div className="mt-2">
                <p className="text-xs font-medium truncate">{image.name}</p>
                {image.error && (
                  <p className="text-xs text-red-500">{image.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {properties.description && (
        <p className="text-xs text-gray-500">{properties.description}</p>
      )}
    </div>
  )
}
