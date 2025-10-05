import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DiagnosticAuth() {
  const [tokenStatus, setTokenStatus] = useState<any>(null);
  const { toast } = useToast();

  const checkTokenStatus = () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    const status: any = {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken?.length || 0,
      refreshTokenLength: refreshToken?.length || 0,
      accessTokenValid: false,
      accessTokenExpired: false,
      tokenInfo: null
    };

    if (accessToken) {
      try {
        const parts = accessToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          status.accessTokenValid = true;
          status.tokenInfo = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            tenantId: payload.tenantId,
            issuedAt: new Date(payload.iat * 1000).toLocaleString(),
            expiresAt: new Date(payload.exp * 1000).toLocaleString(),
            expired: payload.exp * 1000 < Date.now()
          };
          status.accessTokenExpired = status.tokenInfo.expired;
        }
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }

    setTokenStatus(status);
  };

  const clearTokens = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast({
      title: "✅ Tokens limpos",
      description: "Todos os tokens foram removidos. Faça login novamente.",
    });
    checkTokenStatus();
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      window.location.href = '/auth';
    }, 2000);
  };

  useEffect(() => {
    checkTokenStatus();
  }, []);

  if (!tokenStatus) {
    return <div className="p-8">Carregando diagnóstico...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            Diagnóstico de Autenticação
          </CardTitle>
          <CardDescription>
            Verifique o status dos seus tokens de autenticação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Access Token Status */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Access Token</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                {tokenStatus.hasAccessToken ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Presente
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    <XCircle className="h-3 w-3 mr-1" />
                    Ausente
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Tamanho:</span>
                <Badge variant={tokenStatus.accessTokenLength < 20 ? "destructive" : "outline"}>
                  {tokenStatus.accessTokenLength} caracteres
                </Badge>
              </div>

              {tokenStatus.accessTokenLength > 0 && tokenStatus.accessTokenLength < 20 && (
                <div className="col-span-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800 font-semibold">
                    ❌ Token corrompido detectado! Token muito curto ({tokenStatus.accessTokenLength} caracteres).
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Um token JWT válido deve ter centenas de caracteres. Clique em "Limpar Tokens" abaixo.
                  </p>
                </div>
              )}
            </div>

            {tokenStatus.tokenInfo && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md space-y-2">
                <h4 className="font-medium text-sm">Informações do Token:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Usuário:</span>
                    <span className="ml-2 font-mono text-xs">{tokenStatus.tokenInfo.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Função:</span>
                    <Badge className="ml-2">{tokenStatus.tokenInfo.role}</Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Emitido em:</span>
                    <span className="ml-2">{tokenStatus.tokenInfo.issuedAt}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Expira em:</span>
                    <span className={`ml-2 ${tokenStatus.accessTokenExpired ? 'text-red-600 font-semibold' : ''}`}>
                      {tokenStatus.tokenInfo.expiresAt}
                    </span>
                  </div>
                </div>

                {tokenStatus.accessTokenExpired && (
                  <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-md">
                    <p className="text-sm text-orange-800">
                      ⚠️ Token expirado! Faça login novamente ou limpe os tokens.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Refresh Token Status */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Refresh Token</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                {tokenStatus.hasRefreshToken ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Presente
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    <XCircle className="h-3 w-3 mr-1" />
                    Ausente
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Tamanho:</span>
                <Badge variant="outline">
                  {tokenStatus.refreshTokenLength} caracteres
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={checkTokenStatus} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Status
            </Button>
            
            <Button onClick={clearTokens} variant="destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Limpar Tokens e Fazer Login
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-medium text-sm text-blue-900 mb-2">💡 Como resolver problemas de autenticação:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal ml-4">
              <li>Clique em "Limpar Tokens e Fazer Login"</li>
              <li>Você será redirecionado para a página de login</li>
              <li>Faça login novamente com suas credenciais</li>
              <li>Se o problema persistir, limpe o cache do navegador (Ctrl+Shift+Del)</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
