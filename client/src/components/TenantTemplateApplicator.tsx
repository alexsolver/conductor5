
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface TenantTemplateApplicatorProps {
  onTemplateApplied?: () => void;
}

export const TenantTemplateApplicator: React.FC<TenantTemplateApplicatorProps> = ({
  onTemplateApplied
}) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const applyTemplate = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/tenant/apply-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        toast({
          title: 'Template aplicado com sucesso',
          description: 'Empresa padrão e configurações de tickets foram criadas.',
        });
        onTemplateApplied?.();
      } else {
        setStatus('error');
        setMessage(data.message || 'Erro ao aplicar template');
        toast({
          title: 'Erro ao aplicar template',
          description: data.message || 'Ocorreu um erro inesperado.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erro de conexão ao aplicar template');
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Configuração do Tenant
        </CardTitle>
        <CardDescription>
          Aplicar configurações padrão da empresa e tickets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'success' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              {message}
            </AlertDescription>
          </Alert>
        )}

        {status === 'error' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {message}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Este processo irá criar:
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>Empresa padrão</li>
            <li>Configurações de campos de tickets</li>
            <li>Categorias e subcategorias</li>
            <li>Ações padrão</li>
          </ul>
        </div>

        <Button 
          onClick={applyTemplate} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Aplicando Template...
            </>
          ) : (
            'Aplicar Configurações Padrão'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
