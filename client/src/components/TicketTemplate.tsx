
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  User, 
  Building, 
  MapPin, 
  Phone, 
  FileText, 
  GitBranch,
  Server,
  Clock,
  ExternalLink 
} from "lucide-react";

interface TicketTemplateProps {
  ticket: {
    id: string;
    number: string;
    subject: string;
    description: string;
    category: string;
    subcategory?: string;
    priority: string;
    status: string;
    
    // Informações Técnicas
    prUrl?: string;
    environment?: string;
    publishedVersion?: string;
    
    // Informações do Solicitante
    callerName: string;
    callerDocument?: string;
    callerPhone?: string;
    callerAddress?: string;
    
    // Informações do Favorecido
    beneficiaryName?: string;
    beneficiaryDocument?: string;
    beneficiaryDetails?: any;
    
    // Controle de Vencimentos
    originalDueDate?: string;
    currentDueDate?: string;
    dueDateChangedReason?: string;
    
    // Datas
    createdAt: string;
    updatedAt: string;
  };
}

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800", 
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

const statusColors = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800"
};

export function TicketTemplate({ ticket }: TicketTemplateProps) {
  return (
    <div className="space-y-6">
      {/* Cabeçalho do Chamado */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">
                Chamado #{ticket.number}
              </CardTitle>
              <p className="text-lg font-medium text-muted-foreground mt-1">
                {ticket.subject}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                {ticket.priority}
              </Badge>
              <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                {ticket.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Categoria:</strong> {ticket.category}
              </span>
            </div>
            {ticket.subcategory && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Subcategoria:</strong> {ticket.subcategory}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Criado em:</strong> {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Técnicas - Específicas para categoria Publicação/Infra */}
      {(ticket.prUrl || ticket.environment || ticket.publishedVersion) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Informações Técnicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ticket.prUrl && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL do PR:</label>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <Button variant="link" size="sm" asChild>
                      <a href={ticket.prUrl} target="_blank" rel="noopener noreferrer">
                        {ticket.prUrl}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
              
              {ticket.environment && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ambiente:</label>
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{ticket.environment}</span>
                  </div>
                </div>
              )}
              
              {ticket.publishedVersion && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Versão Publicada:</label>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{ticket.publishedVersion}</Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações do Solicitante */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações do Solicitante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome:</label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{ticket.callerName}</span>
              </div>
            </div>
            
            {ticket.callerDocument && (
              <div className="space-y-2">
                <label className="text-sm font-medium">CPF/CNPJ:</label>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{ticket.callerDocument}</span>
                </div>
              </div>
            )}
            
            {ticket.callerPhone && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone:</label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{ticket.callerPhone}</span>
                </div>
              </div>
            )}
            
            {ticket.callerAddress && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Endereço:</label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{ticket.callerAddress}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informações do Favorecido */}
      {(ticket.beneficiaryName || ticket.beneficiaryDocument) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Dados do Favorecido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ticket.beneficiaryName && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome/Razão Social:</label>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{ticket.beneficiaryName}</span>
                  </div>
                </div>
              )}
              
              {ticket.beneficiaryDocument && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">CPF/CNPJ:</label>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{ticket.beneficiaryDocument}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controle de Vencimentos */}
      {(ticket.originalDueDate || ticket.currentDueDate) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Controle de Vencimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ticket.originalDueDate && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vencimento Original:</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(ticket.originalDueDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              )}
              
              {ticket.currentDueDate && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vencimento Atual:</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-orange-600">
                      {new Date(ticket.currentDueDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              )}
              
              {ticket.dueDateChangedReason && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Motivo da Alteração:</label>
                  <p className="text-sm text-muted-foreground">
                    {ticket.dueDateChangedReason}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Descrição do Chamado */}
      <Card>
        <CardHeader>
          <CardTitle>Descrição</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
