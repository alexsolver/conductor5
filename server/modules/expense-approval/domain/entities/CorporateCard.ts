/**
 * CORPORATE CARD ENTITY - DOMAIN LAYER
 * ✅ 1QA.MD COMPLIANCE: Pure domain entity without external dependencies
 * ✅ CLEAN ARCHITECTURE: Domain-driven design
 * ✅ BUSINESS LOGIC: Card transaction management
 */

export interface CorporateCard {
  id: string;
  tenantId: string;
  cardNumber: string;
  cardholderName: string;
  employeeId: string;
  cardType: string;
  issuer: string;
  expiryDate: Date;
  creditLimit?: number;
  currency: string;
  isActive: boolean;
  isBlocked: boolean;
  lastSyncDate?: Date;
  createdAt: Date;
  createdById: string;
}

export interface InsertCorporateCard {
  tenantId: string;
  cardNumber: string;
  cardholderName: string;
  employeeId: string;
  cardType: string;
  issuer: string;
  expiryDate: Date;
  creditLimit?: number;
  currency?: string;
  isActive?: boolean;
  isBlocked?: boolean;
  lastSyncDate?: Date;
  createdById: string;
}

export interface CardTransaction {
  id: string;
  tenantId: string;
  cardId: string;
  transactionId: string;
  transactionDate: Date;
  postingDate?: Date;
  description: string;
  merchant?: string;
  merchantCategory?: string;
  amount: number;
  currency: string;
  amountLocal?: number;
  exchangeRate?: number;
  isPersonal: boolean;
  expenseItemId?: string;
  reconciled: boolean;
  reconciledAt?: Date;
  location?: string;
  metadata?: Record<string, any>;
  importedAt: Date;
}

export interface InsertCardTransaction {
  tenantId: string;
  cardId: string;
  transactionId: string;
  transactionDate: Date;
  postingDate?: Date;
  description: string;
  merchant?: string;
  merchantCategory?: string;
  amount: number;
  currency: string;
  amountLocal?: number;
  exchangeRate?: number;
  isPersonal?: boolean;
  expenseItemId?: string;
  reconciled?: boolean;
  reconciledAt?: Date;
  location?: string;
  metadata?: Record<string, any>;
}

/**
 * Domain service for corporate card operations
 */
export class CorporateCardService {
  /**
   * Match card transactions with expense items
   */
  static matchTransactionsWithExpenseItems(
    transactions: CardTransaction[],
    expenseItems: any[]
  ): TransactionMatchResult[] {
    const results: TransactionMatchResult[] = [];

    for (const transaction of transactions) {
      if (transaction.reconciled || transaction.isPersonal) {
        continue;
      }

      const matches = this.findPotentialMatches(transaction, expenseItems);
      
      results.push({
        transaction,
        matches,
        confidence: matches.length > 0 ? Math.max(...matches.map(m => m.confidence)) : 0,
        autoMatch: matches.some(m => m.confidence >= 0.9)
      });
    }

    return results;
  }

  /**
   * Find potential matches for a transaction
   */
  private static findPotentialMatches(
    transaction: CardTransaction,
    expenseItems: any[]
  ): TransactionMatch[] {
    const matches: TransactionMatch[] = [];

    for (const item of expenseItems) {
      const confidence = this.calculateMatchConfidence(transaction, item);
      
      if (confidence >= 0.5) { // Minimum confidence threshold
        matches.push({
          expenseItem: item,
          confidence,
          matchFactors: this.getMatchFactors(transaction, item)
        });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate match confidence between transaction and expense item
   */
  private static calculateMatchConfidence(
    transaction: CardTransaction,
    expenseItem: any
  ): number {
    let confidence = 0;
    let factors = 0;

    // Amount match (most important factor)
    const amountDiff = Math.abs(transaction.amountLocal! - expenseItem.amountLocal);
    const amountTolerance = Math.max(expenseItem.amountLocal * 0.01, 1); // 1% or $1
    
    if (amountDiff <= amountTolerance) {
      confidence += 0.4;
    } else if (amountDiff <= amountTolerance * 5) {
      confidence += 0.2;
    }
    factors += 0.4;

    // Date match
    const transactionDate = new Date(transaction.transactionDate);
    const expenseDate = new Date(expenseItem.expenseDate);
    const daysDiff = Math.abs((transactionDate.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      confidence += 0.3;
    } else if (daysDiff <= 1) {
      confidence += 0.2;
    } else if (daysDiff <= 3) {
      confidence += 0.1;
    }
    factors += 0.3;

    // Merchant/vendor match
    if (transaction.merchant && expenseItem.vendor) {
      const merchantSimilarity = this.calculateStringSimilarity(
        transaction.merchant.toLowerCase(),
        expenseItem.vendor.toLowerCase()
      );
      confidence += merchantSimilarity * 0.2;
    }
    factors += 0.2;

    // Description match
    if (transaction.description && expenseItem.description) {
      const descriptionSimilarity = this.calculateStringSimilarity(
        transaction.description.toLowerCase(),
        expenseItem.description.toLowerCase()
      );
      confidence += descriptionSimilarity * 0.1;
    }
    factors += 0.1;

    return confidence / factors;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    
    if (maxLength === 0) return 1;
    
    return 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j += 1) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get match factors for explanation
   */
  private static getMatchFactors(
    transaction: CardTransaction,
    expenseItem: any
  ): MatchFactor[] {
    const factors: MatchFactor[] = [];

    // Amount factor
    const amountDiff = Math.abs(transaction.amountLocal! - expenseItem.amountLocal);
    factors.push({
      type: 'amount',
      score: amountDiff === 0 ? 1 : Math.max(0, 1 - (amountDiff / expenseItem.amountLocal)),
      description: `Amount ${amountDiff === 0 ? 'exact match' : `difference: ${amountDiff.toFixed(2)}`}`
    });

    // Date factor
    const transactionDate = new Date(transaction.transactionDate);
    const expenseDate = new Date(expenseItem.expenseDate);
    const daysDiff = Math.abs((transactionDate.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    factors.push({
      type: 'date',
      score: Math.max(0, 1 - (daysDiff / 7)),
      description: `Date ${daysDiff === 0 ? 'exact match' : `difference: ${daysDiff} days`}`
    });

    // Merchant factor
    if (transaction.merchant && expenseItem.vendor) {
      const similarity = this.calculateStringSimilarity(
        transaction.merchant.toLowerCase(),
        expenseItem.vendor.toLowerCase()
      );
      factors.push({
        type: 'merchant',
        score: similarity,
        description: `Merchant similarity: ${(similarity * 100).toFixed(0)}%`
      });
    }

    return factors;
  }

  /**
   * Auto-reconcile transactions with high confidence matches
   */
  static autoReconcileTransactions(matchResults: TransactionMatchResult[]): ReconciliationResult[] {
    const results: ReconciliationResult[] = [];

    for (const result of matchResults) {
      if (result.autoMatch && result.matches.length > 0) {
        const bestMatch = result.matches[0];
        
        results.push({
          transaction: result.transaction,
          expenseItem: bestMatch.expenseItem,
          confidence: bestMatch.confidence,
          status: 'auto_reconciled',
          reconciledAt: new Date()
        });
      }
    }

    return results;
  }

  /**
   * Validate card transaction data
   */
  static validateCardTransaction(transaction: Partial<CardTransaction>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!transaction.transactionId) errors.push('Transaction ID is required');
    if (!transaction.transactionDate) errors.push('Transaction date is required');
    if (!transaction.description) errors.push('Description is required');
    if (!transaction.amount || transaction.amount <= 0) errors.push('Amount must be greater than zero');
    if (!transaction.currency) errors.push('Currency is required');

    // Business rules
    if (transaction.transactionDate && transaction.transactionDate > new Date()) {
      errors.push('Transaction date cannot be in the future');
    }

    if (transaction.amount && Math.abs(transaction.amount) > 100000) {
      warnings.push('High amount transaction requires review');
    }

    // Duplicate detection would require database check
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate card statement reconciliation report
   */
  static generateReconciliationReport(
    transactions: CardTransaction[],
    expenseItems: any[],
    periodStart: Date,
    periodEnd: Date
  ): ReconciliationReport {
    const periodTransactions = transactions.filter(t => 
      t.transactionDate >= periodStart && t.transactionDate <= periodEnd
    );

    const reconciledTransactions = periodTransactions.filter(t => t.reconciled);
    const unreconciledTransactions = periodTransactions.filter(t => !t.reconciled && !t.isPersonal);
    const personalTransactions = periodTransactions.filter(t => t.isPersonal);

    const totalTransactionAmount = periodTransactions.reduce((sum, t) => sum + (t.amountLocal || t.amount), 0);
    const reconciledAmount = reconciledTransactions.reduce((sum, t) => sum + (t.amountLocal || t.amount), 0);
    const unreconciledAmount = unreconciledTransactions.reduce((sum, t) => sum + (t.amountLocal || t.amount), 0);
    const personalAmount = personalTransactions.reduce((sum, t) => sum + (t.amountLocal || t.amount), 0);

    return {
      periodStart,
      periodEnd,
      totalTransactions: periodTransactions.length,
      reconciledTransactions: reconciledTransactions.length,
      unreconciledTransactions: unreconciledTransactions.length,
      personalTransactions: personalTransactions.length,
      totalAmount: totalTransactionAmount,
      reconciledAmount,
      unreconciledAmount,
      personalAmount,
      reconciliationRate: totalTransactionAmount > 0 ? (reconciledAmount / totalTransactionAmount) * 100 : 0,
      unreconciledItems: unreconciledTransactions,
      summary: {
        allReconciled: unreconciledTransactions.length === 0,
        needsAttention: unreconciledTransactions.length > 0,
        highRiskTransactions: unreconciledTransactions.filter(t => Math.abs(t.amountLocal || t.amount) > 1000)
      }
    };
  }
}

export interface TransactionMatchResult {
  transaction: CardTransaction;
  matches: TransactionMatch[];
  confidence: number;
  autoMatch: boolean;
}

export interface TransactionMatch {
  expenseItem: any;
  confidence: number;
  matchFactors: MatchFactor[];
}

export interface MatchFactor {
  type: 'amount' | 'date' | 'merchant' | 'description' | 'location';
  score: number;
  description: string;
}

export interface ReconciliationResult {
  transaction: CardTransaction;
  expenseItem: any;
  confidence: number;
  status: 'auto_reconciled' | 'manual_reconciled' | 'pending' | 'rejected';
  reconciledAt: Date;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ReconciliationReport {
  periodStart: Date;
  periodEnd: Date;
  totalTransactions: number;
  reconciledTransactions: number;
  unreconciledTransactions: number;
  personalTransactions: number;
  totalAmount: number;
  reconciledAmount: number;
  unreconciledAmount: number;
  personalAmount: number;
  reconciliationRate: number;
  unreconciledItems: CardTransaction[];
  summary: {
    allReconciled: boolean;
    needsAttention: boolean;
    highRiskTransactions: CardTransaction[];
  };
}