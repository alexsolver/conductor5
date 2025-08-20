import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, ArrowDown, Users, Clock, Settings } from 'lucide-react';
// import { useLocalization } from '@/hooks/useLocalization';
interface ApprovalStep {
  id: string;
  stepNumber: number;
  name: string;
  approverType: 'user' | 'group' | 'role' | 'hierarchy';
  approvers: string[];
  mode: 'ALL' | 'ANY' | 'QUORUM';
  quorumCount?: number;
  slaHours: number;
  autoApprove: boolean;
  conditions?: string;
}
export function PipelineDesigner() {
  // Localization temporarily disabled
  const [steps, setSteps] = useState<ApprovalStep[]>([
    {
      id: '1',
      stepNumber: 1,
      name: 'Aprovação Inicial',
      approverType: 'user',
      approvers: [],
      mode: 'ANY',
      slaHours: 24,
      autoApprove: false
    }
  ]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string>('');
  const approverTypes = [
    { value: 'user', label: 'Usuário Específico' },
    { value: 'group', label: '[TRANSLATION_NEEDED]' },
    { value: 'role', label: 'Função/Cargo' },
    { value: 'hierarchy', label: 'Hierarquia (Manager Chain)' }
  ];
  const decisionModes = [
    { value: 'ALL', label: '[TRANSLATION_NEEDED]' },
    { value: 'ANY', label: 'Qualquer um pode aprovar' },
    { value: 'QUORUM', label: 'Quórum (X de N)' }
  ];
  const addStep = () => {
    const newStep: ApprovalStep = {
      id: Date.now().toString(),
      stepNumber: steps.length + 1,
      name: "
      approverType: 'user',
      approvers: [],
      mode: 'ANY',
      slaHours: 24,
      autoApprove: false
    };
    setSteps(prev => [...prev, newStep]);
  };
  const removeStep = (stepId: string) => {
    setSteps(prev => {
      const newSteps = prev.filter(step => step.id !== stepId);
      return newSteps.map((step, index) => ({
        ...step,
        stepNumber: index + 1,
        name: step.name.includes('Etapa') ? "
      }));
    });
  };
  const updateStep = (stepId: string, field: keyof ApprovalStep, value: any) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, [field]: value } : step
    ));
  };
  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    setSteps(prev => {
      const currentIndex = prev.findIndex(step => step.id === stepId);
      if (
        (direction === 'up' && currentIndex === 0) ||
        (direction === 'down' && currentIndex === prev.length - 1)
      ) {
        return prev;
      }
      const newSteps = [...prev];
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      [newSteps[currentIndex], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[currentIndex]];
      
      return newSteps.map((step, index) => ({
        ...step,
        stepNumber: index + 1
      }));
    });
  };
  const simulatePipeline = () => {
    setIsSimulating(true);
    
    // Simular o fluxo de aprovação
    setTimeout(() => {
      let simulation = 'Simulação do Pipeline:\n\n';
      let totalTime = 0;
      
      steps.forEach((step, index) => {
        simulation += "\n`;
        simulation += ")\n`;
        simulation += "h\n`;
        
        if (step.autoApprove) {
          simulation += `   ✅ Auto-aprovado\n`;
          totalTime += 0.1;
        } else {
          simulation += `   ⏳ Aguardando aprovação manual\n`;
          totalTime += step.slaHours * 0.5; // Assume 50% do SLA em média
        }
        simulation += '\n';
      });
      
      simulation += "h`;
      
      setSimulationResult(simulation);
      setIsSimulating(false);
    }, 2000);
  };
  const savePipeline = () => {
    console.log('Saving pipeline:', steps);
    alert('Pipeline salvo com sucesso!');
  };
  const getTotalSLA = () => {
    return steps.reduce((total, step) => total + step.slaHours, 0);
  };
  const getStepColor = (step: ApprovalStep) => {
    if (step.autoApprove) return 'bg-green-100 border-green-300 dark:bg-green-900/20';
    if (step.slaHours <= 4) return 'bg-red-100 border-red-300 dark:bg-red-900/20';
    if (step.slaHours <= 24) return 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20';
    return 'bg-blue-100 border-blue-300 dark:bg-blue-900/20';
  };
  return (
    <div className="space-y-6" data-testid="pipeline-designer>
      <Card data-testid="pipeline-header>
        <CardHeader>
          <div className="flex items-center justify-between>
            <CardTitle className="flex items-center gap-2>
              <Settings className="h-5 w-5" />
              Pipeline Designer
            </CardTitle>
            <div className="flex items-center gap-4>
              <Badge variant="outline" data-testid="total-steps>
                {steps.length} Etapas
              </Badge>
              <Badge variant="secondary" data-testid="total-sla>
                SLA Total: {getTotalSLA()}h
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3" data-testid="pipeline-actions>
            <Button 
              onClick={addStep} 
              className="flex items-center gap-2"
              data-testid="button-add-step"
            >
              <Plus className="h-4 w-4" />
              Nova Etapa
            </Button>
            <Button 
              variant="outline" 
              onClick={simulatePipeline}
              disabled={isSimulating}
              className="flex items-center gap-2"
              data-testid="button-simulate"
            >
              <Clock className="h-4 w-4" />
              {isSimulating ? 'Simulando...' : 'Simular Pipeline'}
            </Button>
            <Button 
              variant="default" 
              onClick={savePipeline}
              className="flex items-center gap-2"
              data-testid="button-save-pipeline"
            >
              Salvar Pipeline
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Pipeline Steps */}
      <div className="space-y-4" data-testid="pipeline-steps>
        {steps.map((step, index) => (
          <Card 
            key={step.id} 
            className="" transition-all duration-200"
            data-testid={"
          >
            <CardHeader className="pb-3>
              <div className="flex items-center justify-between>
                <div className="flex items-center gap-3>
                  <Badge className="bg-white text-gray-800" data-testid={"
                    Etapa {step.stepNumber}
                  </Badge>
                  <Input
                    value={step.name}
                    onChange={(e) => updateStep(step.id, 'name', e.target.value)}
                    className="font-medium bg-transparent border-none p-0 h-auto focus:ring-0"
                    data-testid={"
                  />
                </div>
                <div className="flex items-center gap-2>
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveStep(step.id, 'up')}
                      data-testid={"
                    >
                      ↑
                    </Button>
                  )}
                  {index < steps.length - 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveStep(step.id, 'down')}
                      data-testid={"
                    >
                      ↓
                    </Button>
                  )}
                  {steps.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(step.id)}
                      data-testid={"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid={"
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300>
                    Tipo de Aprovador
                  </label>
                  <Select
                    value={step.approverType}
                    onValueChange={(value) => updateStep(step.id, 'approverType', value)}
                    data-testid={"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {approverTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300>
                    Modo de Decisão
                  </label>
                  <Select
                    value={step.mode}
                    onValueChange={(value) => updateStep(step.id, 'mode', value)}
                    data-testid={"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {decisionModes.map(mode => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300>
                    SLA (horas)
                  </label>
                  <Input
                    type="number"
                    value={step.slaHours}
                    onChange={(e) => updateStep(step.id, 'slaHours', parseInt(e.target.value) || 0)}
                    min="1"
                    data-testid={"
                  />
                </div>
                {step.mode === 'QUORUM' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300>
                      Quórum
                    </label>
                    <Input
                      type="number"
                      value={step.quorumCount || 1}
                      onChange={(e) => updateStep(step.id, 'quorumCount', parseInt(e.target.value) || 1)}
                      min="1"
                      data-testid={"
                    />
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center gap-4>
                <label className="flex items-center gap-2>
                  <input
                    type="checkbox"
                    checked={step.autoApprove}
                    onChange={(e) => updateStep(step.id, 'autoApprove', e.target.checked)}
                    className="rounded"
                    data-testid={"
                  />
                  <span className="text-lg">"Auto-aprovação</span>
                </label>
                
                <Badge 
                  variant={step.autoApprove ? "default" : "secondary"
                  data-testid={"
                >
                  {step.autoApprove ? 'Automático' : 'Manual'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Simulation Results */}
      {simulationResult && (
        <Card data-testid="simulation-results>
          <CardHeader>
            <CardTitle className="flex items-center gap-2>
              <Clock className="h-5 w-5" />
              Resultado da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm whitespace-pre-wrap" data-testid="simulation-text>
              {simulationResult}
            </pre>
          </CardContent>
        </Card>
      )}
      {/* Pipeline Flow Visualization */}
      <Card data-testid="pipeline-visualization>
        <CardHeader>
          <CardTitle>Fluxo Visual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4" data-testid="visual-flow>
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center" data-testid={"
                <div className="p-4 rounded-lg border-2 " min-w-48 text-center>
                  <div className="text-lg">"{step.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1>
                    {step.approverType} • {step.mode} • {step.slaHours}h
                  </div>
                  {step.autoApprove && (
                    <Badge variant="default" className="text-lg">"Auto</Badge>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <ArrowDown className="h-6 w-6 text-gray-400 my-2" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}