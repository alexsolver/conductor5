import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ApprovalDashboard } from '@/components/approvals/ApprovalDashboard';
import { ApprovalInstances } from '@/components/approvals/ApprovalInstances';
import { ApprovalGroupsManager } from '@/components/approvals/ApprovalGroupsManager';
import { UnifiedApprovalConfigurator } from '@/components/approvals/UnifiedApprovalConfigurator';
import { Settings, BarChart3, List, Users } from 'lucide-react';

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
            Sistema universal de aprovações hierárquicas e condicionais - Configurador unificado
          </p>
        </div>
        <Badge variant="secondary" className="text-sm" data-testid="status-badge">
          Sistema Ativo
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4" data-testid="tabs-navigation">
          <TabsTrigger value="dashboard" className="flex items-center gap-2" data-testid="tab-dashboard">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="configurator" className="flex items-center gap-2" data-testid="tab-configurator">
            <Settings className="h-4 w-4" />
            Configurador Universal
          </TabsTrigger>
          <TabsTrigger value="instances" className="flex items-center gap-2" data-testid="tab-instances">
            <List className="h-4 w-4" />
            Instâncias
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2" data-testid="tab-groups">
            <Users className="h-4 w-4" />
            Grupos
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="dashboard" data-testid="content-dashboard">
            <ApprovalDashboard />
          </TabsContent>

          <TabsContent value="configurator" data-testid="content-configurator">
            <UnifiedApprovalConfigurator />
          </TabsContent>

          <TabsContent value="instances" data-testid="content-instances">
            <ApprovalInstances />
          </TabsContent>

          <TabsContent value="groups" data-testid="content-groups">
            <ApprovalGroupsManager />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}