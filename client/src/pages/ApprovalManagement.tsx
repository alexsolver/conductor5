import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ApprovalRulesManager } from '@/components/approvals/ApprovalRulesManager';
import { ApprovalDashboard } from '@/components/approvals/ApprovalDashboard';
import { ApprovalInstances } from '@/components/approvals/ApprovalInstances';
import { QueryBuilder } from '@/components/approvals/QueryBuilder';
import { PipelineDesigner } from '@/components/approvals/PipelineDesigner';
import { Settings, BarChart3, List, Workflow, Search } from 'lucide-react';

export function ApprovalManagement() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="container mx-auto p-6" data-testid="approval-management-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="page-title">
            Gerenciamento de Aprovações
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2" data-testid="page-description">
            Sistema universal de aprovações hierárquicas e condicionais
          </p>
        </div>
        <Badge variant="secondary" className="text-sm" data-testid="status-badge">
          Sistema Ativo
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5" data-testid="tabs-navigation">
          <TabsTrigger value="dashboard" className="flex items-center gap-2" data-testid="tab-dashboard">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2" data-testid="tab-rules">
            <Settings className="h-4 w-4" />
            Regras
          </TabsTrigger>
          <TabsTrigger value="instances" className="flex items-center gap-2" data-testid="tab-instances">
            <List className="h-4 w-4" />
            Instâncias
          </TabsTrigger>
          <TabsTrigger value="designer" className="flex items-center gap-2" data-testid="tab-designer">
            <Workflow className="h-4 w-4" />
            Designer
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-2" data-testid="tab-builder">
            <Search className="h-4 w-4" />
            Query Builder
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="dashboard" data-testid="content-dashboard">
            <ApprovalDashboard />
          </TabsContent>

          <TabsContent value="rules" data-testid="content-rules">
            <ApprovalRulesManager />
          </TabsContent>

          <TabsContent value="instances" data-testid="content-instances">
            <ApprovalInstances />
          </TabsContent>

          <TabsContent value="designer" data-testid="content-designer">
            <PipelineDesigner />
          </TabsContent>

          <TabsContent value="builder" data-testid="content-builder">
            <QueryBuilder />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}