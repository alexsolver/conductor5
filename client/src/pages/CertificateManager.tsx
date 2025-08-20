
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import { Shield, Upload, Key, CheckCircle, AlertTriangle } from 'lucide-react';
// import useLocalization from '@/hooks/useLocalization';

export default function CertificateManager() {
  // Localization temporarily disabled

  const { toast } = useToast();
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [privateKeyFile, setPrivateKeyFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [certificateName, setCertificateName] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleCertificateUpload = async () => {
    if (!certificateFile || !privateKeyFile || !certificateName) {
      toast({
        title: "Campos Obrigatórios",
        description: "Preencha todos os campos antes de continuar",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('certificate', certificateFile);
      formData.append('privateKey', privateKeyFile);
      formData.append('password', password);
      formData.append('name', certificateName);

      const response = await fetch('/api/certificates/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': "
        }
      });

      if (response.ok) {
        toast({
          title: "Certificado Instalado",
          description: "Certificado digital instalado com sucesso",
          variant: "default"
        });
        
        // Limpar formulário
        setCertificateFile(null);
        setPrivateKeyFile(null);
        setPassword('');
        setCertificateName('');
      } else {
        throw new Error('Erro ao instalar certificado');
      }
    } catch (error) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Falha ao instalar o certificado digital",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className=""
      <div className=""
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Certificados Digitais</h1>
          <p className="text-gray-600">Gerenciamento de certificados ICP-Brasil para assinaturas CLT</p>
        </div>
      </div>

      {/* Upload de Certificado */}
      <Card>
        <CardHeader>
          <CardTitle className=""
            <Upload className="h-5 w-5" />
            Instalar Novo Certificado
          </CardTitle>
        </CardHeader>
        <CardContent className=""
          <div className=""
            <div>
              <Label htmlFor="cert-name">Nome do Certificado</Label>
              <Input
                id="cert-name"
                value={certificateName}
                onChange={(e) => setCertificateName(e.target.value)}
                placeholder="Ex: Certificado ICP-Brasil 2025"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha do Certificado</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha da chave privada"
              />
            </div>
          </div>

          <div className=""
            <div>
              <Label htmlFor="certificate-file">Arquivo do Certificado (.crt/.pem)</Label>
              <Input
                id="certificate-file"
                type="file"
                accept=".crt,.pem,.cer"
                onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <Label htmlFor="private-key-file">Chave Privada (.key/.pem)</Label>
              <Input
                id="private-key-file"
                type="file"
                accept=".key,.pem"
                onChange={(e) => setPrivateKeyFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <Button 
            onClick={handleCertificateUpload}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? 'Instalando...' : 'Instalar Certificado'}
          </Button>
        </CardContent>
      </Card>

      {/* Certificados Ativos */}
      <Card>
        <CardHeader>
          <CardTitle className=""
            <Key className="h-5 w-5" />
            Certificados Instalados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className=""
            <div className=""
              <div className=""
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">CLT-Primary-Key-2025</div>
                  <div className="text-sm text-gray-600">RSA-2048 • Expira: 02/08/2026</div>
                </div>
              </div>
              <div className=""
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Ativo</span>
                <Button variant="outline" size="sm">Renovar</Button>
              </div>
            </div>

            <div className=""
              <div className=""
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-medium">Certificado-ICP-Brasil-2024</div>
                  <div className="text-sm text-gray-600">RSA-2048 • Expira: 31/12/2024</div>
                </div>
              </div>
              <div className=""
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">Expirando</span>
                <Button variant="outline" size="sm">Renovar</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações CLT */}
      <Card className=""
        <CardContent className=""
          <div className=""
            <Shield className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900">Compliance CLT</h3>
              <p className=""
                Os certificados digitais garantem a autenticidade e integridade dos registros de ponto conforme 
                a Portaria MTE 671/2021. Todos os registros são assinados digitalmente com algoritmo RSA-2048.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
