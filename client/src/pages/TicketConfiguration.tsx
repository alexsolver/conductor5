
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TicketConfiguration: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configurações de Tickets</h1>
        <p className="text-gray-600 mt-2">
          Configure todos os metadados e parâmetros dos tickets do sistema
        </p>
      </div>

      <Tabs defaultValue="fields" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="fields">Campos</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="priority">Prioridades</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="numbering">Numeração</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Campos</CardTitle>
              <CardDescription>
                Configure quais campos são exibidos, obrigatórios e sua ordem de apresentação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <p>Aguardando instruções para implementação...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Status</CardTitle>
              <CardDescription>
                Configure os status dos tickets, cores e transições permitidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <p>Aguardando instruções para implementação...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priority" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Prioridades</CardTitle>
              <CardDescription>
                Configure as prioridades dos tickets e suas cores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <p>Aguardando instruções para implementação...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Categorias</CardTitle>
              <CardDescription>
                Configure as categorias e subcategorias dos tickets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <p>Aguardando instruções para implementação...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="numbering" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Numeração</CardTitle>
              <CardDescription>
                Configure o formato de numeração dos tickets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <p>Aguardando instruções para implementação...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
              <CardDescription>
                Configurações avançadas de SLA, templates e automações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <p>Aguardando instruções para implementação...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TicketConfiguration;
