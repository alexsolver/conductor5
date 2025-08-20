import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { useLocalization } from '@/hooks/useLocalization';
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}
export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }
  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    // Log error details
    console.error('[TRANSLATION_NEEDED]', error);
    console.error('[TRANSLATION_NEEDED]', errorInfo);
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    // Send error to monitoring service (if configured)
    this.reportError(error, errorInfo);
  }
  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Implement error reporting logic here
    // This could send to Sentry, LogRocket, or custom logging service
    const errorReport = {
  // Localization temporarily disabled
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    // For now, just log to console
    console.warn('[TRANSLATION_NEEDED]', errorReport);
    
    // In production, you would send this to your error tracking service
    // Example: Sentry.captureException(error, { contexts: { errorInfo } });
  };
  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };
  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };
  private handleReload = () => {
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50>
          <Card className="w-full max-w-2xl>
            <CardHeader className="text-center>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900>
                Oops! Algo deu errado
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6>
              <Alert variant="destructive>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {this.state.error?.message || 'Um erro inesperado ocorreu no módulo de locais.'}
                </AlertDescription>
              </Alert>
              {this.props.showDetails && this.state.error && (
                <details className="bg-gray-100 p-4 rounded-lg>
                  <summary className="cursor-pointer font-medium text-sm text-gray-700>
                    Detalhes técnicos (clique para expandir)
                  </summary>
                  <div className="mt-3 text-xs font-mono text-gray-600 whitespace-pre-wrap>
                    <div className="mb-2>
                      <strong>Erro:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div className="mb-2>
                        <strong>Stack trace:</strong>
                        <pre className="text-xs overflow-auto max-h-32>
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component stack:</strong>
                        <pre className="text-xs overflow-auto max-h-32>
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center>
                {this.state.retryCount < this.maxRetries && (
                  <Button 
                    onClick={this.handleRetry}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Tentar Novamente ({this.maxRetries - this.state.retryCount} restantes)
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Ir para Dashboard
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={this.handleReload}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recarregar Página
                </Button>
              </div>
              <div className="text-center text-sm text-gray-500>
                <p>Se o problema persistir, entre em contato com o suporte técnico.</p>
                <p className="mt-1>
                  Código do erro: {this.state.error?.name || 'UNKNOWN_ERROR'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
// Hook version for functional components
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, errorInfo?: any) => {
    console.error('[TRANSLATION_NEEDED]', error);
    
    // Report error
    const errorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalInfo: errorInfo
    };
    console.warn('[TRANSLATION_NEEDED]', errorReport);
  }, []);
  return { handleError };
};
// HOC for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  WrappedComponent.displayName = ")`;
  
  return WrappedComponent;
};
