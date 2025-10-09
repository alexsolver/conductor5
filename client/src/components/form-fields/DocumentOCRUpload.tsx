/**
 * Document OCR Upload - Componente de upload e extração de documentos
 * 
 * Faz upload de imagem de CNH/RG/CPF e extrai dados automaticamente
 * usando Tesseract.js OCR
 * 
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Tesseract from 'tesseract.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentOCRUploadProps {
  documentType: 'cnh' | 'rg' | 'cpf' | 'cnpj';
  onDataExtracted: (data: ExtractedData) => void;
  className?: string;
}

interface ExtractedData {
  cpf?: string;
  rg?: string;
  name?: string;
  birthDate?: string;
  motherName?: string;
  cnhNumber?: string;
  cnhCategory?: string;
  cnhExpiryDate?: string;
  [key: string]: string | undefined;
}

export function DocumentOCRUpload({
  documentType,
  onDataExtracted,
  className
}: DocumentOCRUploadProps) {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const extractCPF = (text: string): string | undefined => {
    const cpfPattern = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
    const matches = text.match(cpfPattern);
    if (matches && matches.length > 0) {
      return matches[0].replace(/[^\d]/g, '');
    }
    return undefined;
  };

  const extractRG = (text: string): string | undefined => {
    const rgPattern = /\b\d{1,2}\.?\d{3}\.?\d{3}-?[0-9xX]\b/g;
    const matches = text.match(rgPattern);
    if (matches && matches.length > 0) {
      return matches[0];
    }
    return undefined;
  };

  const extractCNH = (text: string): string | undefined => {
    const cnhPattern = /\b\d{11}\b/g;
    const matches = text.match(cnhPattern);
    if (matches && matches.length > 0) {
      return matches[0];
    }
    return undefined;
  };

  const extractDate = (text: string): string | undefined => {
    const datePattern = /\b\d{2}\/\d{2}\/\d{4}\b/g;
    const matches = text.match(datePattern);
    if (matches && matches.length > 0) {
      return matches[0];
    }
    return undefined;
  };

  const processDocument = useCallback(async (file: File) => {
    setProcessing(true);
    setProgress(0);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      const result = await Tesseract.recognize(
        file,
        'por',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      const text = result.data.text;
      const extracted: ExtractedData = {};

      if (documentType === 'cpf' || documentType === 'rg') {
        const cpf = extractCPF(text);
        if (cpf) extracted.cpf = cpf;

        const rg = extractRG(text);
        if (rg) extracted.rg = rg;

        const lines = text.split('\n').filter(line => line.trim().length > 3);
        if (lines.length > 0) {
          extracted.name = lines[0].trim();
        }

        const birthDate = extractDate(text);
        if (birthDate) extracted.birthDate = birthDate;
      }

      if (documentType === 'cnh') {
        const cpf = extractCPF(text);
        if (cpf) extracted.cpf = cpf;

        const cnhNumber = extractCNH(text);
        if (cnhNumber) extracted.cnhNumber = cnhNumber;

        const categoryMatch = text.match(/(?:categoria|cat\.?)\s*([a-eA-E]+)/i);
        if (categoryMatch) {
          extracted.cnhCategory = categoryMatch[1].toUpperCase();
        }

        const dates = text.match(/\b\d{2}\/\d{2}\/\d{4}\b/g);
        if (dates && dates.length >= 2) {
          extracted.cnhExpiryDate = dates[dates.length - 1];
        }

        const lines = text.split('\n').filter(line => line.trim().length > 3);
        if (lines.length > 0) {
          extracted.name = lines[0].trim();
        }
      }

      setExtractedData(extracted);
      onDataExtracted(extracted);

      toast({
        title: 'Sucesso',
        description: `Dados extraídos do documento ${documentType.toUpperCase()}`,
      });

    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: 'Erro no OCR',
        description: 'Não foi possível extrair os dados do documento',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, [documentType, onDataExtracted, toast]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processDocument(acceptedFiles[0]);
    }
  }, [processDocument]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    disabled: processing
  });

  const getDocumentLabel = () => {
    const labels = {
      cnh: 'CNH',
      rg: 'RG',
      cpf: 'CPF',
      cnpj: 'CNPJ'
    };
    return labels[documentType];
  };

  return (
    <Card className={cn('border-2 border-dashed', className)}>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center gap-4 p-8 rounded-lg transition-colors cursor-pointer',
            isDragActive && 'bg-primary/5',
            processing && 'opacity-50 cursor-not-allowed'
          )}
          data-testid="dropzone-document"
        >
          <input {...getInputProps()} data-testid="input-file-upload" />

          {!previewUrl ? (
            <>
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  {isDragActive
                    ? 'Solte a imagem aqui...'
                    : `Arraste uma imagem do ${getDocumentLabel()} ou clique para selecionar`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG ou JPEG até 10MB
                </p>
              </div>
            </>
          ) : (
            <div className="relative w-full max-w-md">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full rounded-lg shadow-md"
              />
              {processing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>

        {processing && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Processando documento...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {extractedData && !processing && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Dados extraídos com sucesso
            </div>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
              {Object.entries(extractedData).map(([key, value]) => (
                value && (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">{key}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {previewUrl && !processing && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full"
            onClick={() => {
              setPreviewUrl(null);
              setExtractedData(null);
            }}
            data-testid="button-clear-upload"
          >
            Limpar e fazer novo upload
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
