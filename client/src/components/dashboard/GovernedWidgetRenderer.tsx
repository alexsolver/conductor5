// Governed Widget Renderer - Clean Architecture following 1qa.md
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { GovernedCard } from "@shared/dashboard-governance-schema";
interface GovernedWidgetProps {
  card: GovernedCard;
  tenantId: string;
  userId: string;
}
export function GovernedWidgetRenderer({ card, tenantId, userId }: GovernedWidgetProps) {
  // ✅ 1QA.MD COMPLIANCE: Fetch real data using governance rules
  const { data: kpiValue, isLoading, error } = useQuery({
    queryKey: ["
    queryFn: async () => {
      const response = await fetch("
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: card.filters,
          scope_rules: card.scope_rules,
          tenant_id: tenantId,
          user_id: userId
        })
      });
      
      if (!response.ok) throw new Error('Falha ao carregar KPI');
      
      return response.json();
    },
    enabled: card.is_active,
    refetchInterval: card.refresh_rules.mode === 'real_time' ? 5000 : (card.refresh_rules.interval || 300) * 1000,
    retry: false,
  });
  if (isLoading) {
    return (
      <Card className="h-full>
        <CardContent className="flex items-center justify-center h-full>
          <div className="text-lg">"</div>
        </CardContent>
      </Card>
    );
  }
  if (error || !kpiValue) {
    return (
      <Card className="h-full border-red-200>
        <CardContent className="flex items-center justify-center h-full text-red-500>
          <div className="text-center>
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-lg">"Erro ao carregar</p>
            <p className="text-lg">"{card.kpi.name}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => handleCardClick(card)}>
      <CardHeader className="pb-2>
        <CardTitle className="text-sm font-medium flex items-center justify-between>
          <div className="flex items-center>
            {card.layout.icon && <span className="text-lg">"{card.layout.icon}</span>}
            {card.layout.title}
          </div>
          {renderKPIBadge(kpiValue, card)}
        </CardTitle>
        {card.layout.subtitle && (
          <p className="text-lg">"{card.layout.subtitle}</p>
        )}
      </CardHeader>
      <CardContent>
        {renderCardContent(card, kpiValue)}
      </CardContent>
    </Card>
  );
}
function renderCardContent(card: GovernedCard, kpiValue: any) {
  switch (card.card_type) {
    case 'kpi_simple':
      return (
        <div className="space-y-2>
          <div className="flex items-baseline>
            <span className="text-2xl font-bold text-gray-900>
              {formatValue(kpiValue.value, card.kpi.format)}
            </span>
            <span className="text-lg">"{card.kpi.unit}</span>
          </div>
          {renderTrendIndicator(kpiValue, card)}
          <p className="text-xs text-gray-400>
            Atualizado: {new Date(kpiValue.timestamp).toLocaleTimeString('pt-BR')}
          </p>
        </div>
      );
      
    case 'metric_comparative':
      return (
        <div className="space-y-3>
          <div className="flex justify-between items-center>
            <span className="text-lg">"{formatValue(kpiValue.value, card.kpi.format)}</span>
            {card.targets && renderTargetComparison(kpiValue.value, card.targets)}
          </div>
          {kpiValue.comparison && (
            <div className="text-sm text-gray-600>
              <span>vs. período anterior: </span>
              <span className={kpiValue.comparison.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                {kpiValue.comparison.change > 0 && '+'}{kpiValue.comparison.change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      );
      
    case 'table':
      return (
        <div className="space-y-2>
          {kpiValue.data?.slice(0, 5).map((item: any, index: number) => (
            <div key={index} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0>
              <span className="text-lg">"{item.name || item.title}</span>
              <span className="text-lg">"{item.value}</span>
            </div>
          ))}
          {kpiValue.data?.length > 5 && (
            <p className="text-xs text-gray-400 text-center pt-2>
              +{kpiValue.data.length - 5} itens adicionais
            </p>
          )}
        </div>
      );
      
    case 'gauge':
      return (
        <div className="text-center space-y-2>
          {renderGaugeVisualization(kpiValue.value, card.targets)}
          <div className="text-lg">"{formatValue(kpiValue.value, card.kpi.format)}</div>
          <div className="text-lg">"{card.kpi.unit}</div>
        </div>
      );
      
    default:
      return (
        <div className="text-center text-gray-500>
          <p className="text-lg">"Tipo de visualização não implementado</p>
          <p className="text-lg">"{card.card_type}</p>
        </div>
      );
  }
}
function renderKPIBadge(kpiValue: any, card: GovernedCard) {
  if (!card.targets) return null;
  
  const value = kpiValue.value;
  const { target, warning, critical, colors } = card.targets;
  
  let status: 'good' | 'warning' | 'critical' = 'good';
  let color = colors.good;
  
  if (card.kpi.direction === 'up') {
    if (value < critical) {
      status = 'critical';
      color = colors.critical;
    } else if (value < warning) {
      status = 'warning';
      color = colors.warning;
    }
  } else if (card.kpi.direction === 'down') {
    if (value > critical) {
      status = 'critical';
      color = colors.critical;
    } else if (value > warning) {
      status = 'warning';
      color = colors.warning;
    }
  }
  
  return (
    <Badge 
      variant="outline" 
      className="text-xs" 
      style={{ borderColor: color, color }}
    >
      {status === 'good' ? '✓' : status === 'warning' ? '⚠' : '✗'}
    </Badge>
  );
}
function renderTrendIndicator(kpiValue: any, card: GovernedCard) {
  if (!kpiValue.change) return null;
  
  const isPositive = kpiValue.change > 0;
  const isGoodDirection = card.kpi.direction === 'up' ? isPositive : !isPositive;
  
  return (
    <div className="text-lg">"
      {isPositive ? (
        <TrendingUp className="w-4 h-4 mr-1" />
      ) : kpiValue.change < 0 ? (
        <TrendingDown className="w-4 h-4 mr-1" />
      ) : (
        <Minus className="w-4 h-4 mr-1" />
      )}
      <span>
        {isPositive && '+'}{kpiValue.change.toFixed(1)}%
      </span>
    </div>
  );
}
function renderTargetComparison(value: number, targets: any) {
  const percentage = (value / targets.target) * 100;
  const status = percentage >= 100 ? 'good' : percentage >= 80 ? 'warning' : 'critical';
  const colors = {
    good: '#10b981',
    warning: '#f59e0b', 
    critical: '#ef4444'
  };
  
  return (
    <div className="flex items-center>
      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2>
        <div 
          className="h-2 rounded-full transition-all"
          style={{ 
            width: "%`,
            backgroundColor: colors[status]
          }}
        />
      </div>
      <span className="text-lg">"{percentage.toFixed(0)}%</span>
    </div>
  );
}
function renderGaugeVisualization(value: number, targets: any) {
  if (!targets) return null;
  
  const percentage = (value / targets.target) * 100;
  const angle = (Math.min(percentage, 100) / 100) * 180; // Semi-circle gauge
  
  return (
    <div className="relative w-20 h-10 mx-auto>
      <svg viewBox="0 0 100 50" className="w-full h-full>
        {/* Background arc */}
        <path
          d="M 10 45 A 40 40 0 0 1 90 45"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        {/* Progress arc */}
        <path
          d={"
          fill="none"
          stroke="#10b981"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
function formatValue(value: any, format: any) {
  if (typeof value !== 'number') return value;
  
  const decimals = format?.decimals || 0;
  const prefix = format?.prefix || '';
  const suffix = format?.suffix || '';
  
  return "
}
function handleCardClick(card: GovernedCard) {
  if (card.drilldown) {
    switch (card.drilldown.type) {
      case 'report':
        window.location.href = "
        break;
      case 'table':
        window.location.href = "
        break;
      case 'dashboard':
        window.location.href = "
        break;
      case 'external_link':
        if (card.drilldown.new_window) {
          window.open(card.drilldown.target, '_blank');
        } else {
          window.location.href = card.drilldown.target;
        }
        break;
    }
  }
}