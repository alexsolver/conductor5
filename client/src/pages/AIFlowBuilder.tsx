import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Play, 
  Save, 
  Settings,
  Trash2,
  Copy,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function AIFlowBuilder() {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [flowName, setFlowName] = useState('Novo Fluxo');
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const { toast } = useToast();

  // Fetch available node types
  const { data: nodeTypesData } = useQuery({
    queryKey: ['/api/ai-flows/nodes/available'],
  });

  const nodeCategories = nodeTypesData?.data?.categories || [];
  const availableNodes = nodeTypesData?.data?.nodes || [];

  // Save flow mutation
  const saveFlowMutation = useMutation({
    mutationFn: async (flowData: any) => {
      return apiRequest('POST', '/api/ai-flows', flowData);
    },
    onSuccess: () => {
      toast({ title: 'Fluxo salvo com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-flows'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao salvar fluxo', 
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleAddNode = (nodeType: any) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: nodeType.type,
      position: { x: nodes.length * 200 + 100, y: 100 },
      data: {
        label: nodeType.name,
        icon: nodeType.icon,
        color: nodeType.color,
        config: {}
      }
    };

    setNodes([...nodes, newNode]);
    toast({ title: `Nó "${nodeType.name}" adicionado` });
  };

  const handleSaveFlow = () => {
    const flowData = {
      name: flowName,
      description: 'Fluxo criado visualmente',
      status: 'draft',
      nodes,
      edges,
      category: 'custom'
    };

    saveFlowMutation.mutate(flowData);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setEdges(edges.filter(e => e.source !== nodeId && e.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleConnectNodes = (sourceId: string, targetId: string) => {
    const newEdge = {
      id: `edge-${Date.now()}`,
      source: sourceId,
      target: targetId
    };

    setEdges([...edges, newEdge]);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sparkles className="h-6 w-6 text-primary" />
            <div>
              <Input 
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 p-0 h-auto"
                placeholder="Nome do Fluxo"
                data-testid="input-flow-name"
              />
              <p className="text-sm text-muted-foreground">
                {nodes.length} nós • {edges.length} conexões
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" data-testid="button-test-flow">
              <Play className="h-4 w-4 mr-2" />
              Testar
            </Button>
            <Button 
              size="sm" 
              onClick={handleSaveFlow}
              disabled={saveFlowMutation.isPending}
              data-testid="button-save-flow"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveFlowMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Node Library Sidebar */}
        <div className="w-80 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Biblioteca de Nós</h3>
            <p className="text-sm text-muted-foreground">
              Arraste e solte para adicionar
            </p>
          </div>

          <ScrollArea className="flex-1">
            <Tabs defaultValue={nodeCategories[0]?.value} className="p-4">
              <TabsList className="grid grid-cols-2 gap-1 w-full h-auto">
                {nodeCategories.slice(0, 8).map((cat: any) => (
                  <TabsTrigger 
                    key={cat.value} 
                    value={cat.value}
                    className="text-xs"
                    data-testid={`tab-${cat.value}`}
                  >
                    {cat.label.split(' ')[0]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {nodeCategories.map((category: any) => (
                <TabsContent key={category.value} value={category.value} className="mt-4 space-y-2">
                  {availableNodes
                    .filter((node: any) => node.category === category.value)
                    .map((node: any) => (
                      <Card 
                        key={node.type}
                        className="p-3 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleAddNode(node)}
                        data-testid={`node-card-${node.type}`}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: node.color }}
                          >
                            {node.icon.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm">{node.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {node.description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                </TabsContent>
              ))}
            </Tabs>
          </ScrollArea>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-muted/10 relative overflow-auto">
          <div className="absolute inset-0 flex items-center justify-center">
            {nodes.length === 0 ? (
              <div className="text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Comece seu fluxo</h3>
                <p className="text-muted-foreground max-w-sm">
                  Selecione um nó da biblioteca à esquerda para começar a construir seu agente de IA
                </p>
              </div>
            ) : (
              <div className="p-8 w-full">
                {/* Simple linear flow visualization */}
                <div className="flex items-center gap-4 flex-wrap">
                  {nodes.map((node, index) => (
                    <div key={node.id} className="flex items-center gap-4">
                      <Card 
                        className={`p-4 cursor-pointer transition-all ${
                          selectedNode?.id === node.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedNode(node)}
                        data-testid={`node-${node.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: node.data.color }}
                          >
                            {node.data.icon?.charAt(0) || '•'}
                          </div>
                          <div>
                            <h4 className="font-medium">{node.data.label}</h4>
                            <div className="flex gap-1 mt-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNode(node.id);
                                }}
                                data-testid={`button-delete-${node.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                      
                      {index < nodes.length - 1 && (
                        <ArrowRight className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div className="w-80 border-l bg-card flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Configuração</h3>
                <p className="text-sm text-muted-foreground">{selectedNode.data.label}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedNode(null)}
                data-testid="button-close-config"
              >
                ✕
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <div>
                  <Label>Nome do Nó</Label>
                  <Input 
                    value={selectedNode.data.label}
                    onChange={(e) => {
                      const updated = nodes.map(n => 
                        n.id === selectedNode.id 
                          ? { ...n, data: { ...n.data, label: e.target.value }}
                          : n
                      );
                      setNodes(updated);
                      setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, label: e.target.value }});
                    }}
                    data-testid="input-node-name"
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  Configurações específicas do nó virão aqui baseado no tipo
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
