import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
// import useLocalization from '@/hooks/useLocalization';
  Shield, 
  FileCheck, 
  Database, 
  Key,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Hash,
  Lock,
  RefreshCw
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
interface IntegrityCheck {
  isValid: boolean;
  errors: string[];
  timestamp: string;
  tenantId: string;
}
interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  performedAt: string;
  timecardEntryId: string;
  nsr: number;
  reason?: string;
  ipAddress: string;
  auditHash: string;
}
interface ComplianceReport {
  id: string;
  reportType: string;
  periodStart: string;
  periodEnd: string;
  totalRecords: number;
  totalEmployees: number;
  totalHours: string;
  createdAt: string;
  isSubmittedToAuthorities: boolean;
}
interface BackupStatus {
  backupDate: string;
  recordCount: number;
  backupSize: number;
  isVerified: boolean;
  verificationDate?: string;
  compressionType: string;
}
interface DigitalKey {
  id: string;
  keyName: string;
  keyAlgorithm: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  isExpired: boolean;
}
export default function CLTCompliance() {
  // Localization temporarily disabled
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Mutation para reconstituir cadeia de integridade
  const rebuildIntegrityMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/timecard/compliance/rebuild-integrity', {});
    },
    onSuccess: (data) => {
      toast({
        title: "Cadeia Reconstituída",
        description: " registros corrigidos com sucesso",
        variant: "default"
      });
      // Atualiza a verificação de integridade
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/compliance/integrity-check'] });
    },
    onError: (error) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Falha ao reconstituir cadeia de integridade",
        variant: "destructive"
      });
      console.error('[TRANSLATION_NEEDED]', error);
    }
  });
  const [selectedPeriod, setSelectedPeriod] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  // 🔴 Verificação de Integridade
  const { data: integrityCheck, isLoading: integrityLoading } = useQuery({
    queryKey: ['/api/timecard/compliance/integrity-check'],
    retry: false
  });
  // 🔴 Logs de Auditoria
  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ['/api/timecard/compliance/audit-log'],
    retry: false
  });
  // 🔴 Status dos Backups
  const { data: backupStatus, isLoading: backupLoading } = useQuery({
    queryKey: ['/api/timecard/compliance/backups'],
    retry: false
  });
  // 🔴 Chaves Digitais
  const { data: digitalKeys, isLoading: keysLoading } = useQuery({
    queryKey: ['/api/timecard/compliance/keys'],
    retry: false
  });
  // 🔴 Relatórios de Compliance
  const { data: complianceReports, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/timecard/compliance/reports'],
    retry: false
  });
  // 🔴 Gerar Relatório
  const generateReportMutation = useMutation({
    mutationFn: async (data: { reportType: string; periodStart: string; periodEnd: string }) => {
      return await apiRequest('POST', '/api/timecard/compliance/generate-report', data);
    },
    onSuccess: () => {
      toast({
        title: "Relatório Gerado",
        description: "Relatório de compliance gerado com sucesso",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/compliance/reports'] });
    },
    onError: (error) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "
        variant: "destructive"
      });
    }
  });
  // 🔴 Verificar Backup
  const verifyBackupMutation = useMutation({
    mutationFn: async (backupDate: string) => {
      return await apiRequest('POST', '/api/timecard/compliance/verify-backup', { backupDate });
    },
    onSuccess: (data) => {
      toast({
        title: data.isValid ? "Backup Válido" : "Backup Comprometido",
        description: data.message,
        variant: data.isValid ? "default" : "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/compliance/backups'] });
    }
  });
  const handleGenerateReport = () => {
    generateReportMutation.mutate({
      reportType: 'MONTHLY',
      periodStart: selectedPeriod.start,
      periodEnd: selectedPeriod.end
    });
  };
  return (
    <div className=""
      <div className=""
        <div>
          <h1 className=""
            <Shield className="text-red-600" />
            CLT Compliance
          </h1>
          <p className=""
            Sistema de conformidade CLT - Portaria 671/2021 MTE
          </p>
        </div>
      </div>
      <Tabs defaultValue="integrity" className=""
        <TabsList className=""
          <TabsTrigger value="integrity">Integridade</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="keys">Chaves</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>
        {/* 🔴 VERIFICAÇÃO DE INTEGRIDADE */}
        <TabsContent value="integrity>
          <Card>
            <CardHeader>
              <CardTitle className=""
                <Hash className="h-5 w-5" />
                Verificação de Integridade da Cadeia
              </CardTitle>
              <CardDescription>
                Validação criptográfica SHA-256 dos registros de ponto
              </CardDescription>
            </CardHeader>
            <CardContent>
              {integrityLoading ? (
                <div className=""
                  <div className="text-lg">"</div>
                </div>
              ) : integrityCheck ? (
                <div className=""
                  <Alert className={integrityCheck.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50>
                    <div className=""
                      {integrityCheck.isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription>
                        <strong>
                          {integrityCheck.isValid ? 'CADEIA ÍNTEGRA' : 'CADEIA COMPROMETIDA'}
                        </strong>
                        {!integrityCheck.isValid && (
                          <div className=""
                            {integrityCheck.errors.map((error, index) => (
                              <div key={index} className=""
                                • {error}
                              </div>
                            ))}
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </Alert>
                  
                  <div className=""
                    <div>
                      <span className="text-lg">"Status:</span>
                      <Badge className={integrityCheck.isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800>
                        {integrityCheck.isValid ? 'VÁLIDA' : 'INVÁLIDA'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-lg">"Verificado em:</span>
                      <span className=""
                        {new Date(integrityCheck.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Botão para reconstituir cadeia comprometida */}
                  {!integrityCheck.isValid && (
                    <div className=""
                      <div className=""
                        <div>
                          <h4 className=""
                            Cadeia de Integridade Comprometida
                          </h4>
                          <p className=""
                            A cadeia de integridade dos registros CLT está comprometida e precisa ser reconstituída.
                          </p>
                        </div>
                        <Button 
                          onClick={() => rebuildIntegrityMutation.mutate()}
                          disabled={rebuildIntegrityMutation.isPending}
                          variant="outline"
                          size="sm"
                          className="ml-4 border-red-300 text-red-700 hover:bg-red-50"
                        >
                          {rebuildIntegrityMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Reconstituindo...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Reconstituir Cadeia
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Não foi possível verificar a integridade da cadeia. Verifique sua conexão.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* 🔴 TRILHA DE AUDITORIA */}
        <TabsContent value="audit>
          <Card>
            <CardHeader>
              <CardTitle className=""
                <FileCheck className="h-5 w-5" />
                Trilha de Auditoria
              </CardTitle>
              <CardDescription>
                Histórico completo de todas as operações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className=""
                  <div className="text-lg">"</div>
                </div>
              ) : auditLogs?.logs ? (
                <div className=""
                  {auditLogs.logs.slice(0, 10).map((log: AuditLogEntry) => (
                    <div key={log.id} className=""
                      <div className=""
                        <div className=""
                          <Badge variant="outline">NSR {log.nsr}</Badge>
                          <Badge className={
                            log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                            log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                            log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {log.action}
                          </Badge>
                        </div>
                        <span className=""
                          {new Date(log.performedAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      
                      <div className=""
                        <div>
                          <span className="text-lg">"IP:</span> {log.ipAddress}
                        </div>
                        <div>
                          <span className="text-lg">"Hash:</span>
                          <code className=""
                            {log.auditHash.substring(0, 16)}...
                          </code>
                        </div>
                      </div>
                      
                      {log.reason && (
                        <div className=""
                          <span className="text-lg">"Motivo:</span> {log.reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum log de auditoria encontrado ou erro ao carregar dados.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* 🔴 STATUS DOS BACKUPS */}
        <TabsContent value="backups>
          <Card>
            <CardHeader>
              <CardTitle className=""
                <Database className="h-5 w-5" />
                Status dos Backups
              </CardTitle>
              <CardDescription>
                Monitoramento dos backups automáticos diários
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backupLoading ? (
                <div className=""
                  <div className="text-lg">"</div>
                </div>
              ) : backupStatus?.backups ? (
                <div className=""
                  <div className=""
                    <div className=""
                      <div className=""
                        {backupStatus.summary?.totalBackups || 0}
                      </div>
                      <div className="text-lg">"Total Backups</div>
                    </div>
                    <div className=""
                      <div className=""
                        {backupStatus.summary?.verifiedBackups || 0}
                      </div>
                      <div className="text-lg">"Verificados</div>
                    </div>
                    <div className=""
                      <div className=""
                        {Math.round((backupStatus.summary?.totalSize || 0) / 1024 / 1024)}MB
                      </div>
                      <div className="text-lg">"Tamanho Total</div>
                    </div>
                  </div>
                  <div className=""
                    {backupStatus.backups.slice(0, 15).map((backup: BackupStatus, index: number) => (
                      <div key={index} className=""
                        <div className=""
                          <div className=""
                            {backup.isVerified ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-orange-600" />
                            )}
                            <span className=""
                              {new Date(backup.backupDate).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          
                          <div className=""
                            <span>{backup.recordCount} registros</span>
                            <span>•</span>
                            <span>{Math.round(backup.backupSize / 1024)}KB</span>
                            <span>•</span>
                            <span>{backup.compressionType}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => verifyBackupMutation.mutate(backup.backupDate)}
                          disabled={verifyBackupMutation.isPending}
                        >
                          Verificar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum backup encontrado ou erro ao carregar dados.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* 🔴 CHAVES DIGITAIS */}
        <TabsContent value="keys>
          <Card>
            <CardHeader>
              <CardTitle className=""
                <Key className="h-5 w-5" />
                Chaves de Assinatura Digital
              </CardTitle>
              <CardDescription>
                Gerenciamento das chaves RSA-2048 para assinatura digital
              </CardDescription>
            </CardHeader>
            <CardContent>
              {keysLoading ? (
                <div className=""
                  <div className="text-lg">"</div>
                </div>
              ) : digitalKeys?.keys ? (
                <div className=""
                  <div className=""
                    <div className=""
                      <div className=""
                        {digitalKeys.summary?.totalKeys || 0}
                      </div>
                      <div className="text-lg">"Total Chaves</div>
                    </div>
                    <div className=""
                      <div className=""
                        {digitalKeys.summary?.activeKeys || 0}
                      </div>
                      <div className="text-lg">"Ativas</div>
                    </div>
                    <div className=""
                      <div className=""
                        {digitalKeys.summary?.expiredKeys || 0}
                      </div>
                      <div className="text-lg">"Expiradas</div>
                    </div>
                    <div className=""
                      <div className=""
                        {digitalKeys.summary?.revokedKeys || 0}
                      </div>
                      <div className="text-lg">"Revogadas</div>
                    </div>
                  </div>
                  <div className=""
                    {digitalKeys.keys.map((key: DigitalKey) => (
                      <div key={key.id} className=""
                        <div className=""
                          <div className=""
                            <Lock className="h-4 w-4" />
                            <span className="text-lg">"{key.keyName}</span>
                          </div>
                          <div className=""
                            <Badge className={
                              key.isActive && !key.isExpired ? 'bg-green-100 text-green-800' :
                              key.isExpired ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {key.isActive && !key.isExpired ? 'ATIVA' : 
                               key.isExpired ? 'EXPIRADA' : 'INATIVA'}
                            </Badge>
                            <Badge variant="outline>
                              {key.keyAlgorithm}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className=""
                          <div>
                            <span className="text-lg">"Criada em:</span>
                            <span className=""
                              {new Date(key.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <div>
                            <span className="text-lg">"Expira em:</span>
                            <span className=""
                              {new Date(key.expiresAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhuma chave digital encontrada ou erro ao carregar dados.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* 🔴 RELATÓRIOS DE COMPLIANCE */}
        <TabsContent value="reports>
          <Card>
            <CardHeader>
              <CardTitle className=""
                <Download className="h-5 w-5" />
                Relatórios de Compliance
              </CardTitle>
              <CardDescription>
                Geração e download de relatórios para fiscalização
              </CardDescription>
            </CardHeader>
            <CardContent className=""
              <div className=""
                <div>
                  <label className="text-lg">"Data Inicial</label>
                  <input
                    type="date"
                    className="block w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    value={selectedPeriod.start}
                    onChange={(e) => setSelectedPeriod(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-lg">"Data Final</label>
                  <input
                    type="date"
                    className="block w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    value={selectedPeriod.end}
                    onChange={(e) => setSelectedPeriod(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
                <Button
                  onClick={handleGenerateReport}
                  disabled={generateReportMutation.isPending}
                >
                  {generateReportMutation.isPending ? 'Gerando...' : 'Gerar Relatório'}
                </Button>
              </div>
              {reportsLoading ? (
                <div className=""
                  <div className="text-lg">"</div>
                </div>
              ) : complianceReports?.reports ? (
                <div className=""
                  {complianceReports.reports.map((report: ComplianceReport) => (
                    <div key={report.id} className=""
                      <div className=""
                        <div className=""
                          <span className="text-lg">"{report.reportType}</span>
                          <Badge variant="outline>
                            {new Date(report.periodStart).toLocaleDateString('pt-BR')} - {' '}
                            {new Date(report.periodEnd).toLocaleDateString('pt-BR')}
                          </Badge>
                        </div>
                        <div className=""
                          {report.totalRecords} registros • {report.totalEmployees} funcionários • {report.totalHours}h
                        </div>
                      </div>
                      
                      <div className=""
                        {report.isSubmittedToAuthorities && (
                          <Badge className=""
                            Enviado
                          </Badge>
                        )}
                        <Button size="sm" variant="outline>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum relatório encontrado. Gere o primeiro relatório usando o botão acima.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}