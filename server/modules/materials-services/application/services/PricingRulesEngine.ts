
import { PricingRule, PriceListItem } from '../../../../../shared/schema-materials-services';
import { LPURepository } from '../../infrastructure/repositories/LPURepository';

export interface PriceCalculationContext {
  itemId?: string;
  serviceTypeId?: string;
  basePrice: number;
  quantity?: number;
  customerId?: string;
  customerCompanyId?: string;
  priceListId: string;
  metadata?: any;
}

export interface PriceCalculationResult {
  originalPrice: number;
  finalPrice: number;
  appliedRules: {
    ruleId: string;
    ruleName: string;
    ruleType: string;
    adjustment: number;
    adjustmentType: 'percentage' | 'fixed' | 'multiplier';
  }[];
  totalAdjustment: number;
  adjustmentPercentage: number;
}

export class PricingRulesEngine {
  constructor(private repository: LPURepository) {}

  /**
   * Aplica as regras de precificação a um preço base
   */
  async applyPricingRules(context: PriceCalculationContext): Promise<PriceCalculationResult> {
    const rules = await this.repository.getAllPricingRules(context.priceListId);
    const activeRules = rules.filter(rule => rule.isActive);
    
    // Ordena por prioridade (maior prioridade primeiro)
    const sortedRules = activeRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    let currentPrice = context.basePrice;
    const appliedRules: PriceCalculationResult['appliedRules'] = [];

    for (const rule of sortedRules) {
      if (await this.evaluateRuleConditions(rule, context)) {
        const adjustment = await this.applyRuleAction(rule, currentPrice, context);
        
        if (adjustment.applied) {
          currentPrice = adjustment.newPrice;
          appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            ruleType: rule.ruleType,
            adjustment: adjustment.adjustmentValue,
            adjustmentType: adjustment.adjustmentType
          });
        }
      }
    }

    const totalAdjustment = currentPrice - context.basePrice;
    const adjustmentPercentage = context.basePrice > 0 ? (totalAdjustment / context.basePrice) * 100 : 0;

    return {
      originalPrice: context.basePrice,
      finalPrice: currentPrice,
      appliedRules,
      totalAdjustment,
      adjustmentPercentage
    };
  }

  /**
   * Avalia se as condições de uma regra são atendidas
   */
  private async evaluateRuleConditions(rule: PricingRule, context: PriceCalculationContext): Promise<boolean> {
    if (!rule.conditions || typeof rule.conditions !== 'object') {
      return true; // Sem condições = sempre aplicável
    }

    const conditions = rule.conditions as any;

    // Condições de quantidade
    if (conditions.minQuantity && context.quantity && context.quantity < conditions.minQuantity) {
      return false;
    }
    if (conditions.maxQuantity && context.quantity && context.quantity > conditions.maxQuantity) {
      return false;
    }

    // Condições de preço
    if (conditions.minPrice && context.basePrice < conditions.minPrice) {
      return false;
    }
    if (conditions.maxPrice && context.basePrice > conditions.maxPrice) {
      return false;
    }

    // Condições de cliente
    if (conditions.customerIds && conditions.customerIds.length > 0) {
      if (!context.customerId || !conditions.customerIds.includes(context.customerId)) {
        return false;
      }
    }

    // Condições de empresa cliente
    if (conditions.customerCompanyIds && conditions.customerCompanyIds.length > 0) {
      if (!context.customerCompanyId || !conditions.customerCompanyIds.includes(context.customerCompanyId)) {
        return false;
      }
    }

    // Condições de itens específicos
    if (conditions.itemIds && conditions.itemIds.length > 0) {
      if (!context.itemId || !conditions.itemIds.includes(context.itemId)) {
        return false;
      }
    }

    // Condições de categoria/grupo
    if (conditions.itemCategories && conditions.itemCategories.length > 0) {
      // Implementar verificação de categoria do item
      // Por enquanto, considera como atendida
    }

    // Condições temporais
    if (conditions.validFrom) {
      const validFrom = new Date(conditions.validFrom);
      if (new Date() < validFrom) {
        return false;
      }
    }
    if (conditions.validTo) {
      const validTo = new Date(conditions.validTo);
      if (new Date() > validTo) {
        return false;
      }
    }

    return true;
  }

  /**
   * Aplica a ação de uma regra ao preço
   */
  private async applyRuleAction(
    rule: PricingRule, 
    currentPrice: number, 
    context: PriceCalculationContext
  ): Promise<{
    applied: boolean;
    newPrice: number;
    adjustmentValue: number;
    adjustmentType: 'percentage' | 'fixed' | 'multiplier';
  }> {
    if (!rule.actions || typeof rule.actions !== 'object') {
      return { applied: false, newPrice: currentPrice, adjustmentValue: 0, adjustmentType: 'percentage' };
    }

    const actions = rule.actions as any;
    let newPrice = currentPrice;
    let adjustmentValue = 0;
    let adjustmentType: 'percentage' | 'fixed' | 'multiplier' = 'percentage';

    switch (rule.ruleType) {
      case 'percentual':
        if (actions.percentage !== undefined) {
          adjustmentValue = actions.percentage;
          adjustmentType = 'percentage';
          newPrice = currentPrice * (1 + actions.percentage / 100);
        }
        break;

      case 'fixo':
        if (actions.fixedAmount !== undefined) {
          adjustmentValue = actions.fixedAmount;
          adjustmentType = 'fixed';
          newPrice = actions.operation === 'set' ? actions.fixedAmount : currentPrice + actions.fixedAmount;
        }
        break;

      case 'escalonado':
        if (actions.tiers && context.quantity) {
          const tier = this.findApplicableTier(actions.tiers, context.quantity);
          if (tier) {
            adjustmentValue = tier.discount || tier.markup || 0;
            adjustmentType = 'percentage';
            newPrice = currentPrice * (1 + adjustmentValue / 100);
          }
        }
        break;

      case 'dinamico':
        // Para regras dinâmicas, aplicar fatores múltiplos
        if (actions.factors) {
          let multiplier = 1;
          Object.keys(actions.factors).forEach(factor => {
            multiplier *= actions.factors[factor] || 1;
          });
          adjustmentValue = (multiplier - 1) * 100;
          adjustmentType = 'multiplier';
          newPrice = currentPrice * multiplier;
        }
        break;

      default:
        return { applied: false, newPrice: currentPrice, adjustmentValue: 0, adjustmentType: 'percentage' };
    }

    // Aplicar limites mínimos e máximos se definidos
    if (actions.minPrice && newPrice < actions.minPrice) {
      newPrice = actions.minPrice;
    }
    if (actions.maxPrice && newPrice > actions.maxPrice) {
      newPrice = actions.maxPrice;
    }

    return {
      applied: newPrice !== currentPrice,
      newPrice: Math.round(newPrice * 100) / 100, // 2 casas decimais
      adjustmentValue,
      adjustmentType
    };
  }

  /**
   * Encontra o tier aplicável para regras escalonadas
   */
  private findApplicableTier(tiers: any[], quantity: number): any | null {
    if (!Array.isArray(tiers)) return null;

    // Ordena os tiers por quantidade (menor para maior)
    const sortedTiers = tiers.sort((a, b) => (a.minQuantity || 0) - (b.minQuantity || 0));

    // Encontra o tier apropriado
    for (let i = sortedTiers.length - 1; i >= 0; i--) {
      const tier = sortedTiers[i];
      if (quantity >= (tier.minQuantity || 0)) {
        if (!tier.maxQuantity || quantity <= tier.maxQuantity) {
          return tier;
        }
      }
    }

    return null;
  }

  /**
   * Aplica regras a todos os itens de uma lista de preços
   */
  async applyRulesToPriceList(priceListId: string, tenantId: string): Promise<{
    processedItems: number;
    updatedItems: number;
    errors: string[];
  }> {
    const items = await this.repository.getPriceListItems(priceListId, tenantId);
    let processedItems = 0;
    let updatedItems = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        processedItems++;

        const context: PriceCalculationContext = {
          itemId: item.itemId || undefined,
          serviceTypeId: item.serviceTypeId || undefined,
          basePrice: Number(item.unitPrice),
          priceListId: priceListId
        };

        const result = await this.applyPricingRules(context);

        // Só atualiza se o preço mudou
        if (result.finalPrice !== result.originalPrice) {
          await this.repository.updatePriceListItem(item.id, tenantId, {
            unitPrice: result.finalPrice.toString()
          });
          updatedItems++;
        }

      } catch (error) {
        errors.push(`Erro ao processar item ${item.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    return { processedItems, updatedItems, errors };
  }

  /**
   * Recalcula preços baseado em mudanças nas regras
   */
  async recalculatePricesAfterRuleChange(ruleId: string, tenantId: string): Promise<void> {
    // Busca todas as listas de preços que podem ser afetadas
    const priceLists = await this.repository.getAllPriceLists(tenantId);

    for (const priceList of priceLists) {
      if (priceList.isActive) {
        await this.applyRulesToPriceList(priceList.id, tenantId);
      }
    }
  }
}
