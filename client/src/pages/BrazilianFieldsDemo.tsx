/**
 * Brazilian Fields Demo Page
 * 
 * Página de demonstração dos campos de validação brasileira
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CPFField, CNPJField, CEPField, PhoneField } from '@/components/form-fields/BrazilianField';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function BrazilianFieldsDemo() {
  const [cpfData, setCpfData] = useState({ value: '', raw: '', valid: false });
  const [cnpjData, setCnpjData] = useState({ value: '', raw: '', valid: false });
  const [cepData, setCepData] = useState({ value: '', raw: '', valid: false });
  const [phoneData, setPhoneData] = useState({ value: '', raw: '', valid: false });

  const handleSubmit = () => {
    console.log('Dados do formulário:', {
      cpf: cpfData,
      cnpj: cnpjData,
      cep: cepData,
      phone: phoneData
    });

    alert(`Formulário submetido!\n\nCPF: ${cpfData.raw} (${cpfData.valid ? 'Válido' : 'Inválido'})\nCNPJ: ${cnpjData.raw} (${cnpjData.valid ? 'Válido' : 'Inválido'})\nCEP: ${cepData.raw} (${cepData.valid ? 'Válido' : 'Inválido'})\nTelefone: ${phoneData.raw} (${phoneData.valid ? 'Válido' : 'Inválido'})`);
  };

  const allValid = cpfData.valid || cnpjData.valid;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Validação Brasileira</h1>
        <p className="text-muted-foreground mt-2">
          Demonstração de campos com validação em tempo real para documentos brasileiros
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* CPF */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              CPF - Cadastro de Pessoas Físicas
              {cpfData.valid && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </CardTitle>
            <CardDescription>
              Digite um CPF válido. A validação ocorre em tempo real com verificação de dígito.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CPFField
              label="CPF"
              placeholder="000.000.000-00"
              required
              testId="cpf-input"
              onChange={(value, raw, valid) => setCpfData({ value, raw, valid })}
            />
            
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="font-semibold mb-2">Exemplos válidos:</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 111.444.777-35</li>
                <li>• 123.456.789-09</li>
              </ul>
            </div>

            {cpfData.raw && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                <div className="font-semibold text-blue-700 dark:text-blue-300">Valor bruto:</div>
                <div className="text-blue-600 dark:text-blue-400 font-mono">{cpfData.raw}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CNPJ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              CNPJ - Cadastro Nacional da Pessoa Jurídica
              {cnpjData.valid && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </CardTitle>
            <CardDescription>
              Digite um CNPJ válido. A validação ocorre em tempo real com verificação de dígito.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CNPJField
              label="CNPJ"
              placeholder="00.000.000/0000-00"
              required
              testId="cnpj-input"
              onChange={(value, raw, valid) => setCnpjData({ value, raw, valid })}
            />
            
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="font-semibold mb-2">Exemplos válidos:</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 11.222.333/0001-81</li>
                <li>• 34.028.316/0001-03</li>
              </ul>
            </div>

            {cnpjData.raw && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                <div className="font-semibold text-blue-700 dark:text-blue-300">Valor bruto:</div>
                <div className="text-blue-600 dark:text-blue-400 font-mono">{cnpjData.raw}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CEP */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              CEP - Código de Endereçamento Postal
              {cepData.valid && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </CardTitle>
            <CardDescription>
              Digite um CEP válido. Formato: 00000-000
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CEPField
              label="CEP"
              placeholder="00000-000"
              required
              testId="cep-input"
              onChange={(value, raw, valid) => setCepData({ value, raw, valid })}
            />
            
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="font-semibold mb-2">Exemplos válidos:</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 01310-100 (Av. Paulista, SP)</li>
                <li>• 20040-020 (Centro, RJ)</li>
              </ul>
            </div>

            {cepData.raw && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                <div className="font-semibold text-blue-700 dark:text-blue-300">Valor bruto:</div>
                <div className="text-blue-600 dark:text-blue-400 font-mono">{cepData.raw}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Telefone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Telefone Brasileiro
              {phoneData.valid && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </CardTitle>
            <CardDescription>
              Digite um telefone válido. Aceita fixo (10 dígitos) ou celular (11 dígitos).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PhoneField
              label="Telefone"
              placeholder="(00) 00000-0000"
              required
              testId="phone-input"
              onChange={(value, raw, valid) => setPhoneData({ value, raw, valid })}
            />
            
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="font-semibold mb-2">Exemplos válidos:</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• (11) 98765-4321 (Celular)</li>
                <li>• (21) 3456-7890 (Fixo)</li>
              </ul>
            </div>

            {phoneData.raw && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                <div className="font-semibold text-blue-700 dark:text-blue-300">Valor bruto:</div>
                <div className="text-blue-600 dark:text-blue-400 font-mono">{phoneData.raw}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Status da Validação</CardTitle>
          <CardDescription>
            Resumo dos campos preenchidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="font-medium">CPF:</span>
              <span className="flex items-center gap-2">
                {cpfData.raw ? (
                  <>
                    <code className="text-sm">{cpfData.raw}</code>
                    {cpfData.valid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground text-sm">Não preenchido</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="font-medium">CNPJ:</span>
              <span className="flex items-center gap-2">
                {cnpjData.raw ? (
                  <>
                    <code className="text-sm">{cnpjData.raw}</code>
                    {cnpjData.valid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground text-sm">Não preenchido</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="font-medium">CEP:</span>
              <span className="flex items-center gap-2">
                {cepData.raw ? (
                  <>
                    <code className="text-sm">{cepData.raw}</code>
                    {cepData.valid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground text-sm">Não preenchido</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="font-medium">Telefone:</span>
              <span className="flex items-center gap-2">
                {phoneData.raw ? (
                  <>
                    <code className="text-sm">{phoneData.raw}</code>
                    {phoneData.valid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground text-sm">Não preenchido</span>
                )}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Button 
              onClick={handleSubmit} 
              disabled={!allValid}
              className="w-full"
              data-testid="submit-button"
            >
              {allValid ? 'Enviar Formulário' : 'Preencha pelo menos CPF ou CNPJ válido'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
