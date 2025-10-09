/**
 * Document OCR Demo - Página de demonstração de OCR
 * 
 * Testa extração de dados de documentos (CNH, RG, CPF)
 * 
 * @version 1.0.0
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentOCRUpload } from '@/components/form-fields/DocumentOCRUpload';
import { FileText, CreditCard, IdCard } from 'lucide-react';

export default function DocumentOCRDemo() {
  const [cnhData, setCnhData] = useState<any>(null);
  const [rgData, setRgData] = useState<any>(null);
  const [cpfData, setCpfData] = useState<any>(null);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Extração de Dados com OCR
        </h1>
        <p className="text-muted-foreground">
          Faça upload de documentos e extraia dados automaticamente usando Tesseract.js
        </p>
      </div>

      <Tabs defaultValue="cnh" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cnh" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            CNH
          </TabsTrigger>
          <TabsTrigger value="rg" className="flex items-center gap-2">
            <IdCard className="h-4 w-4" />
            RG
          </TabsTrigger>
          <TabsTrigger value="cpf" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            CPF
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cnh" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <DocumentOCRUpload
                documentType="cnh"
                onDataExtracted={(data) => {
                  console.log('CNH Data:', data);
                  setCnhData(data);
                }}
              />
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Dados Extraídos - CNH</CardTitle>
                  <CardDescription>
                    Dados extraídos da Carteira Nacional de Habilitação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {cnhData ? (
                    <div className="space-y-2">
                      {cnhData.name && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Nome:</span>
                          <span className="font-medium">{cnhData.name}</span>
                        </div>
                      )}
                      {cnhData.cpf && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">CPF:</span>
                          <span className="font-medium">{cnhData.cpf}</span>
                        </div>
                      )}
                      {cnhData.cnhNumber && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Número CNH:</span>
                          <span className="font-medium">{cnhData.cnhNumber}</span>
                        </div>
                      )}
                      {cnhData.cnhCategory && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Categoria:</span>
                          <span className="font-medium">{cnhData.cnhCategory}</span>
                        </div>
                      )}
                      {cnhData.cnhExpiryDate && (
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Validade:</span>
                          <span className="font-medium">{cnhData.cnhExpiryDate}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum dado extraído ainda
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rg" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <DocumentOCRUpload
                documentType="rg"
                onDataExtracted={(data) => {
                  console.log('RG Data:', data);
                  setRgData(data);
                }}
              />
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Dados Extraídos - RG</CardTitle>
                  <CardDescription>
                    Dados extraídos do Registro Geral
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rgData ? (
                    <div className="space-y-2">
                      {rgData.name && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Nome:</span>
                          <span className="font-medium">{rgData.name}</span>
                        </div>
                      )}
                      {rgData.rg && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">RG:</span>
                          <span className="font-medium">{rgData.rg}</span>
                        </div>
                      )}
                      {rgData.cpf && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">CPF:</span>
                          <span className="font-medium">{rgData.cpf}</span>
                        </div>
                      )}
                      {rgData.birthDate && (
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Data Nascimento:</span>
                          <span className="font-medium">{rgData.birthDate}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum dado extraído ainda
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cpf" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <DocumentOCRUpload
                documentType="cpf"
                onDataExtracted={(data) => {
                  console.log('CPF Data:', data);
                  setCpfData(data);
                }}
              />
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Dados Extraídos - CPF</CardTitle>
                  <CardDescription>
                    Dados extraídos do documento CPF
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {cpfData ? (
                    <div className="space-y-2">
                      {cpfData.name && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Nome:</span>
                          <span className="font-medium">{cpfData.name}</span>
                        </div>
                      )}
                      {cpfData.cpf && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">CPF:</span>
                          <span className="font-medium">{cpfData.cpf}</span>
                        </div>
                      )}
                      {cpfData.birthDate && (
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Data Nascimento:</span>
                          <span className="font-medium">{cpfData.birthDate}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum dado extraído ainda
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Como usar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ol className="list-decimal list-inside space-y-2">
            <li>Selecione o tipo de documento que deseja processar (CNH, RG ou CPF)</li>
            <li>Arraste e solte uma imagem do documento ou clique para selecionar</li>
            <li>Aguarde o processamento do OCR (pode levar alguns segundos)</li>
            <li>Os dados extraídos aparecerão automaticamente no painel ao lado</li>
            <li>Para processar outro documento, clique em "Limpar e fazer novo upload"</li>
          </ol>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Dicas para melhor extração:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
              <li>Use imagens com boa iluminação</li>
              <li>Certifique-se de que o texto está legível e não borrado</li>
              <li>Evite reflexos ou sombras sobre o documento</li>
              <li>Tire fotos diretas (sem ângulos)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
