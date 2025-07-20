
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle,
  Shield,
  Database,
  Users,
  Lock,
  Globe,
  BarChart,
  Server,
  Code,
  Layers
} from "lucide-react";

interface ComplianceItem {
  name: string;
  status: "implemented" | "partial" | "missing" | "priority";
  description?: string;
  category: string;
}

function getStatusIcon(status: ComplianceItem["status"]) {
  switch (status) {
    case "implemented":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "partial":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "missing":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "priority":
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
  }
}

function getStatusBadge(status: ComplianceItem["status"]) {
  switch (status) {
    case "implemented":
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Implementado</Badge>;
    case "partial":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">Parcial</Badge>;
    case "missing":
      return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">Faltando</Badge>;
    case "priority":
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">Prioridade</Badge>;
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "Dashboard":
      return <BarChart className="h-5 w-5" />;
    case "Arquitetura":
      return <Layers className="h-5 w-5" />;
    case "Validação":
      return <Shield className="h-5 w-5" />;
    case "Testes":
      return <Code className="h-5 w-5" />;
    case "Multitenancy":
      return <Database className="h-5 w-5" />;
    case "Autenticação":
      return <Lock className="h-5 w-5" />;
    case "Autorização":
      return <Users className="h-5 w-5" />;
    case "Segurança":
      return <Shield className="h-5 w-5" />;
    case "Performance":
      return <Server className="h-5 w-5" />;
    case "Internacionalização":
      return <Globe className="h-5 w-5" />;
    default:
      return <CheckCircle className="h-5 w-5" />;
  }
}

const clearArchitectureItems: ComplianceItem[] = [
  // Dashboard de Monitoramento
  { name: "Visualização em tempo real do status", status: "implemented", category: "Dashboard" },
  { name: "Score de saúde (0-100%) por módulo", status: "implemented", category: "Dashboard" },
  { name: "Indicadores visuais coloridos", status: "implemented", category: "Dashboard" },
  { name: "Métricas do sistema completas", status: "partial", category: "Dashboard" },
  
  // Verificação Automática
  { name: "Escaneamento de arquivos críticos", status: "implemented", category: "Validação" },
  { name: "Validação de sintaxe TypeScript", status: "implemented", category: "Validação" },
  { name: "Verificação de imports/exports", status: "implemented", category: "Validação" },
  { name: "Detecção de dependências quebradas", status: "implemented", category: "Validação" },
  
  // Camada de Entidades (Domain Layer)
  { name: "Domain Entities", status: "implemented", category: "Arquitetura" },
  { name: "Value Objects", status: "implemented", category: "Arquitetura" },
  { name: "Domain Events", status: "implemented", category: "Arquitetura" },
  { name: "Business Rules", status: "implemented", category: "Arquitetura" },
  { name: "Domain Services", status: "implemented", category: "Arquitetura" },
  { name: "Aggregates", status: "implemented", category: "Arquitetura" },
  
  // Camada de Casos de Uso
  { name: "Service Layer", status: "implemented", category: "Arquitetura" },
  { name: "Use Cases/Interactors", status: "implemented", category: "Arquitetura" },
  { name: "Input/Output Ports", status: "implemented", category: "Arquitetura" },
  { name: "Command/Query Handlers (CQRS)", status: "implemented", category: "Arquitetura" },
  { name: "DTOs e Mappers", status: "implemented", category: "Arquitetura" },
  
  // Camada de Interface
  { name: "Controller Layer", status: "implemented", category: "Arquitetura" },
  { name: "Routes Layer", status: "implemented", category: "Arquitetura" },
  { name: "API Versioning", status: "implemented", category: "Arquitetura" },
  { name: "Request/Response Validation", status: "implemented", category: "Arquitetura" },
  
  // Camada de Infraestrutura
  { name: "Repository Layer", status: "implemented", category: "Arquitetura" },
  { name: "External Service Adapters", status: "implemented", category: "Arquitetura" },
  { name: "Message Brokers", status: "implemented", category: "Arquitetura" },
  { name: "Caching Adapters", status: "implemented", category: "Arquitetura" },
  
  // Dependency Rule
  { name: "Dependency Inversion", status: "implemented", category: "Arquitetura" },
  { name: "IoC Container", status: "implemented", category: "Arquitetura" },
  { name: "Interface Segregation", status: "implemented", category: "Arquitetura" },
  
  // Testabilidade
  { name: "Unit Test Framework", status: "implemented", category: "Testes" },
  { name: "Integration Tests", status: "implemented", category: "Testes" },
  { name: "Mock/Stub Framework", status: "implemented", category: "Testes" },
  { name: "Contract Tests", status: "implemented", category: "Testes" },
];

const multitenancyItems: ComplianceItem[] = [
  // Multitenancy Core
  { name: "Isolamento completo de dados por tenant", status: "implemented", category: "Multitenancy" },
  { name: "Schema dedicado por cliente", status: "implemented", category: "Multitenancy" },
  { name: "Middleware de resolução automática", status: "implemented", category: "Multitenancy" },
  { name: "Migração automática de schemas", status: "implemented", category: "Multitenancy" },
  
  // Gestão Administrativa
  { name: "Self Sign-on para novos clientes", status: "implemented", category: "Multitenancy" },
  { name: "Modo de Gestão Dual", status: "implemented", category: "Multitenancy" },
  { name: "Página pública de cadastro", status: "implemented", category: "Multitenancy" },
  { name: "Criação automática de tenant", status: "implemented", category: "Multitenancy" },
  { name: "Onboarding wizard interativo", status: "partial", category: "Multitenancy" },
  { name: "Billing self-service (Stripe)", status: "missing", category: "Multitenancy" },
  
  // Autenticação
  { name: "Sistema de autenticação local", status: "implemented", category: "Autenticação" },
  { name: "Sessões persistentes PostgreSQL", status: "implemented", category: "Autenticação" },
  { name: "JWT + Refresh Tokens", status: "implemented", category: "Autenticação" },
  { name: "OAuth2 (Auth0, Cognito)", status: "missing", category: "Autenticação" },
  { name: "Magic Link authentication", status: "implemented", category: "Autenticação" },
  { name: "Two-Factor Authentication (2FA)", status: "implemented", category: "Autenticação" },
  { name: "Brute-force protection", status: "implemented", category: "Autenticação" },
  { name: "Password reset flow", status: "implemented", category: "Autenticação" },
  { name: "Account lockout policies", status: "implemented", category: "Autenticação" },
  { name: "Rate limiting middleware", status: "implemented", category: "Autenticação" },
  { name: "Security events logging", status: "implemented", category: "Autenticação" },
  
  // Autorização
  { name: "RBAC inicial", status: "implemented", category: "Autorização" },
  { name: "RBAC/ABAC completo por tenant", status: "implemented", category: "Autorização" },
  
  // Middleware Stack
  { name: "authMiddleware", status: "implemented", category: "Segurança" },
  { name: "tenantMiddleware", status: "implemented", category: "Segurança" },
  { name: "auditMiddleware", status: "implemented", category: "Segurança" },
  { name: "securityMiddleware", status: "implemented", category: "Segurança" },
  { name: "Content Security Policy (CSP)", status: "implemented", category: "Segurança" },
  { name: "Rate limiting com Redis", status: "implemented", category: "Segurança" },
  
  // Validação & Qualidade
  { name: "Schemas com Zod", status: "implemented", category: "Validação" },
  { name: "Sanitização automática", status: "implemented", category: "Validação" },
  { name: "Validação TypeScript", status: "implemented", category: "Validação" },
  { name: "Tratamento de erros padronizado", status: "implemented", category: "Validação" },
  
  // Feature Flags
  { name: "Controle por tenant", status: "implemented", category: "Performance" },
  { name: "Rollout gradual", status: "implemented", category: "Performance" },
  { name: "A/B testing", status: "implemented", category: "Performance" },
  { name: "Feature Flags com fallback", status: "implemented", category: "Performance" },
  
  // Cache & Performance
  { name: "Redis para sessões", status: "implemented", category: "Performance" },
  { name: "Cache de queries", status: "implemented", category: "Performance" },
  { name: "Invalidação inteligente", status: "implemented", category: "Performance" },
  { name: "Rate limiting com Redis", status: "implemented", category: "Performance" },
  

  
  // Segurança & Compliance
  { name: "Criptografia end-to-end", status: "implemented", category: "Segurança" },
  { name: "GDPR compliance", status: "implemented", category: "Segurança" },
  { name: "Logs de auditoria", status: "implemented", category: "Segurança" },
  { name: "Backup automático", status: "implemented", category: "Segurança" },
];

function calculateProgress(items: ComplianceItem[]) {
  const total = items.length;
  const implemented = items.filter(item => item.status === "implemented").length;
  const partial = items.filter(item => item.status === "partial").length;
  return Math.round(((implemented + partial * 0.5) / total) * 100);
}

function groupByCategory(items: ComplianceItem[]) {
  return items.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, ComplianceItem[]>);
}

export default function Compliance() {
  const clearArchProgress = calculateProgress(clearArchitectureItems);
  const multitenancyProgress = calculateProgress(multitenancyItems);
  
  const clearArchCategories = groupByCategory(clearArchitectureItems);
  const multitenancyCategories = groupByCategory(multitenancyItems);

  return (
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Compliance</h1>
          <p className="text-blue-100">
            Verificação de conformidade arquitetural e requisitos técnicos
          </p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Clear Architecture
              </CardTitle>
              <CardDescription>
                Funcionalidades principais e estrutura arquitetural
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso Geral</span>
                  <span>{clearArchProgress}%</span>
                </div>
                <Progress value={clearArchProgress} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{clearArchitectureItems.filter(i => i.status === "implemented").length} implementados</span>
                  <span>{clearArchitectureItems.length} total</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Multitenancy
              </CardTitle>
              <CardDescription>
                Isolamento de dados e gestão multi-tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso Geral</span>
                  <span>{multitenancyProgress}%</span>
                </div>
                <Progress value={multitenancyProgress} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{multitenancyItems.filter(i => i.status === "implemented").length} implementados</span>
                  <span>{multitenancyItems.length} total</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clear Architecture Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-6 w-6" />
              1. Clear Architecture
            </CardTitle>
            <CardDescription>
              Funcionalidades principais e estrutura de arquitetura limpa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(clearArchCategories).map(([category, items]) => {
                const categoryProgress = calculateProgress(items);
                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(category)}
                      <h3 className="text-lg font-semibold">{category}</h3>
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{categoryProgress}%</span>
                        <Progress value={categoryProgress} className="w-24 h-2" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {getStatusIcon(item.status)}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(item.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Multitenancy Requirements Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              2. Requisitos - Multitenancy
            </CardTitle>
            <CardDescription>
              Isolamento de dados, autenticação e recursos multi-tenant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(multitenancyCategories).map(([category, items]) => {
                const categoryProgress = calculateProgress(items);
                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(category)}
                      <h3 className="text-lg font-semibold">{category}</h3>
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{categoryProgress}%</span>
                        <Progress value={categoryProgress} className="w-24 h-2" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {getStatusIcon(item.status)}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(item.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
  );
}