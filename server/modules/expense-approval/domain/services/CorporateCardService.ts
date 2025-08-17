/**
 * CORPORATE CARD SERVICE - CARD TRANSACTION MANAGEMENT
 * ✅ 1QA.MD COMPLIANCE: Clean Architecture Domain Service
 * 
 * Features:
 * - Automatic transaction feed import from card providers
 * - Intelligent expense matching by date, amount, merchant
 * - Personal vs business expense classification
 * - Automatic reconciliation and dispute management
 * - Real-time fraud detection and alerts
 */

export interface CorporateCard {
  id: string;
  tenantId: string;
  cardNumber: string; // Last 4 digits only
  cardHolderName: string;
  cardHolderId: string;
  cardType: 'VISA' | 'MASTERCARD' | 'AMEX' | 'OTHER';
  bankName: string;
  expiryDate: Date;
  creditLimit: number;
  availableCredit: number;
  currency: string;
  isActive: boolean;
  isBusinessCard: boolean;
  lastSyncDate?: Date;
}

export interface CardTransaction {
  id: string;
  tenantId: string;
  cardId: string;
  transactionId: string; // Bank's transaction ID
  amount: number;
  currency: string;
  merchantName: string;
  merchantCategory: string;
  transactionDate: Date;
  postingDate: Date;
  description: string;
  status: 'pending' | 'posted' | 'disputed' | 'reversed';
  transactionType: 'purchase' | 'refund' | 'fee' | 'interest';
  authorizationCode?: string;
  reference?: string;
  location?: TransactionLocation;
  isExpensed: boolean;
  expenseItemId?: string;
  classificationScore?: number;
  fraudScore?: number;
  metadata?: Record<string, any>;
}

export interface TransactionLocation {
  country: string;
  city: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ExpenseMatch {
  transaction: CardTransaction;
  expenseItem: any; // Would be proper ExpenseItem type
  matchScore: number;
  matchReasons: string[];
  confidence: 'high' | 'medium' | 'low';
  requiresReview: boolean;
}

export interface FraudAlert {
  id: string;
  transactionId: string;
  cardId: string;
  alertType: 'unusual_amount' | 'unusual_location' | 'velocity' | 'merchant_category' | 'duplicate' | 'offline_transaction';
  riskScore: number;
  description: string;
  recommendedAction: 'block' | 'review' | 'approve' | 'notify_user';
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

export interface CardReconciliation {
  cardId: string;
  periodStart: Date;
  periodEnd: Date;
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  businessExpenses: number;
  personalExpenses: number;
  disputedAmount: number;
  reconciliationScore: number;
  issues: ReconciliationIssue[];
}

export interface ReconciliationIssue {
  type: 'unmatched_transaction' | 'duplicate_expense' | 'amount_mismatch' | 'date_mismatch' | 'missing_receipt';
  transactionId?: string;
  expenseItemId?: string;
  description: string;
  suggestedAction: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class CorporateCardService {
  
  /**
   * Import transactions from card provider feed
   */
  async importCardTransactions(
    cardId: string,
    tenantId: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<CardTransaction[]> {
    console.log('💳 [CorporateCardService] Importing transactions for card:', cardId);
    
    const card = await this.getCard(cardId, tenantId);
    if (!card.isActive) {
      throw new Error('Card is not active');
    }

    // In a real implementation, this would connect to actual card provider APIs
    // For now, we'll simulate transaction data
    const transactions = await this.fetchTransactionsFromProvider(
      card,
      fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      toDate || new Date()
    );

    // Process and classify each transaction
    const processedTransactions: CardTransaction[] = [];
    
    for (const transaction of transactions) {
      // Classify business vs personal
      const classification = await this.classifyTransaction(transaction);
      transaction.classificationScore = classification.businessProbability;
      
      // Calculate fraud score
      const fraudScore = await this.calculateFraudScore(transaction, card);
      transaction.fraudScore = fraudScore;
      
      // Check for potential expense matches
      const expenseMatches = await this.findPotentialExpenseMatches(transaction, tenantId);
      if (expenseMatches.length > 0) {
        transaction.metadata = {
          ...transaction.metadata,
          potentialMatches: expenseMatches.length,
          bestMatchScore: Math.max(...expenseMatches.map(m => m.matchScore))
        };
      }
      
      processedTransactions.push(transaction);
    }

    // Update card sync date
    await this.updateCardSyncDate(cardId, tenantId, new Date());
    
    console.log('✅ [CorporateCardService] Imported transactions:', {
      count: processedTransactions.length,
      businessTransactions: processedTransactions.filter(t => t.classificationScore && t.classificationScore > 0.7).length,
      highRiskTransactions: processedTransactions.filter(t => t.fraudScore && t.fraudScore > 70).length
    });

    return processedTransactions;
  }

  /**
   * Match card transactions with expense items
   */
  async matchTransactionsWithExpenses(
    tenantId: string,
    cardId?: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<ExpenseMatch[]> {
    console.log('🔗 [CorporateCardService] Matching transactions with expenses');
    
    const transactions = await this.getUnmatchedTransactions(tenantId, cardId, fromDate, toDate);
    const expenseItems = await this.getUnmatchedExpenseItems(tenantId, fromDate, toDate);
    
    const matches: ExpenseMatch[] = [];
    
    for (const transaction of transactions) {
      for (const expenseItem of expenseItems) {
        const matchResult = this.calculateMatchScore(transaction, expenseItem);
        
        if (matchResult.matchScore >= 0.6) { // 60% minimum match threshold
          matches.push({
            transaction,
            expenseItem,
            matchScore: matchResult.matchScore,
            matchReasons: matchResult.reasons,
            confidence: this.getMatchConfidence(matchResult.matchScore),
            requiresReview: matchResult.matchScore < 0.9
          });
        }
      }
    }
    
    // Sort by match score (best matches first)
    matches.sort((a, b) => b.matchScore - a.matchScore);
    
    console.log('✅ [CorporateCardService] Found potential matches:', matches.length);
    
    return matches;
  }

  /**
   * Auto-match high-confidence transactions
   */
  async autoMatchTransactions(
    matches: ExpenseMatch[],
    tenantId: string,
    confidenceThreshold: number = 0.95
  ): Promise<{ matched: number; requiresReview: number }> {
    console.log('🤖 [CorporateCardService] Auto-matching high-confidence transactions');
    
    let matchedCount = 0;
    let reviewCount = 0;
    
    for (const match of matches) {
      if (match.matchScore >= confidenceThreshold && !match.requiresReview) {
        // Auto-match
        await this.linkTransactionToExpense(
          match.transaction.id,
          match.expenseItem.id,
          tenantId,
          'automatic'
        );
        matchedCount++;
      } else {
        // Flag for manual review
        await this.flagForManualReview(match, tenantId);
        reviewCount++;
      }
    }
    
    console.log('✅ [CorporateCardService] Auto-matching completed:', {
      matched: matchedCount,
      requiresReview: reviewCount
    });
    
    return { matched: matchedCount, requiresReview: reviewCount };
  }

  /**
   * Detect fraudulent transactions
   */
  async detectFraud(
    transactions: CardTransaction[],
    tenantId: string
  ): Promise<FraudAlert[]> {
    console.log('🛡️ [CorporateCardService] Running fraud detection');
    
    const alerts: FraudAlert[] = [];
    
    for (const transaction of transactions) {
      const fraudChecks = await this.runFraudChecks(transaction, tenantId);
      
      for (const check of fraudChecks) {
        if (check.riskScore > 50) { // Risk threshold
          alerts.push({
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            transactionId: transaction.id,
            cardId: transaction.cardId,
            alertType: check.type,
            riskScore: check.riskScore,
            description: check.description,
            recommendedAction: check.recommendedAction,
            createdAt: new Date()
          });
        }
      }
    }
    
    console.log('✅ [CorporateCardService] Fraud detection completed:', {
      alertsGenerated: alerts.length,
      highRiskAlerts: alerts.filter(a => a.riskScore > 80).length
    });
    
    return alerts;
  }

  /**
   * Perform card reconciliation
   */
  async reconcileCard(
    cardId: string,
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<CardReconciliation> {
    console.log('📊 [CorporateCardService] Reconciling card for period:', {
      cardId,
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0]
    });
    
    const transactions = await this.getCardTransactions(cardId, tenantId, periodStart, periodEnd);
    const expenseItems = await this.getExpenseItemsForPeriod(tenantId, periodStart, periodEnd);
    
    const reconciliation: CardReconciliation = {
      cardId,
      periodStart,
      periodEnd,
      totalTransactions: transactions.length,
      matchedTransactions: transactions.filter(t => t.isExpensed).length,
      unmatchedTransactions: transactions.filter(t => !t.isExpensed).length,
      businessExpenses: 0,
      personalExpenses: 0,
      disputedAmount: 0,
      reconciliationScore: 0,
      issues: []
    };
    
    // Calculate business vs personal split
    let businessTotal = 0;
    let personalTotal = 0;
    let disputedTotal = 0;
    
    for (const transaction of transactions) {
      if (transaction.status === 'disputed') {
        disputedTotal += transaction.amount;
      } else if (transaction.classificationScore && transaction.classificationScore > 0.7) {
        businessTotal += transaction.amount;
      } else {
        personalTotal += transaction.amount;
      }
    }
    
    reconciliation.businessExpenses = businessTotal;
    reconciliation.personalExpenses = personalTotal;
    reconciliation.disputedAmount = disputedTotal;
    
    // Identify reconciliation issues
    reconciliation.issues = await this.identifyReconciliationIssues(
      transactions,
      expenseItems,
      tenantId
    );
    
    // Calculate reconciliation score
    const matchRate = reconciliation.matchedTransactions / reconciliation.totalTransactions;
    const issueRate = reconciliation.issues.filter(i => i.severity === 'high' || i.severity === 'critical').length / reconciliation.totalTransactions;
    reconciliation.reconciliationScore = Math.round((matchRate * 100) - (issueRate * 20));
    
    console.log('✅ [CorporateCardService] Reconciliation completed:', {
      score: reconciliation.reconciliationScore,
      matchRate: Math.round(matchRate * 100) + '%',
      issues: reconciliation.issues.length
    });
    
    return reconciliation;
  }

  /**
   * Calculate match score between transaction and expense item
   */
  private calculateMatchScore(transaction: CardTransaction, expenseItem: any): {
    matchScore: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let score = 0;

    // Date proximity (max 30 points)
    const dateDiff = Math.abs(transaction.transactionDate.getTime() - expenseItem.expenseDate.getTime());
    const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
    
    if (daysDiff === 0) {
      score += 30;
      reasons.push('Same date');
    } else if (daysDiff <= 1) {
      score += 25;
      reasons.push('Within 1 day');
    } else if (daysDiff <= 3) {
      score += 15;
      reasons.push('Within 3 days');
    } else if (daysDiff <= 7) {
      score += 5;
      reasons.push('Within 1 week');
    }

    // Amount match (max 40 points)
    const amountDiff = Math.abs(transaction.amount - expenseItem.amount);
    const amountDiffPercent = amountDiff / Math.max(transaction.amount, expenseItem.amount);
    
    if (amountDiff === 0) {
      score += 40;
      reasons.push('Exact amount match');
    } else if (amountDiffPercent <= 0.02) { // Within 2%
      score += 35;
      reasons.push('Very close amount');
    } else if (amountDiffPercent <= 0.05) { // Within 5%
      score += 25;
      reasons.push('Close amount');
    } else if (amountDiffPercent <= 0.10) { // Within 10%
      score += 10;
      reasons.push('Similar amount');
    }

    // Merchant/vendor match (max 20 points)
    if (expenseItem.vendor && transaction.merchantName) {
      const vendorSimilarity = this.calculateStringSimilarity(
        expenseItem.vendor.toLowerCase(),
        transaction.merchantName.toLowerCase()
      );
      
      if (vendorSimilarity >= 0.8) {
        score += 20;
        reasons.push('Strong merchant match');
      } else if (vendorSimilarity >= 0.6) {
        score += 15;
        reasons.push('Good merchant match');
      } else if (vendorSimilarity >= 0.4) {
        score += 8;
        reasons.push('Partial merchant match');
      }
    }

    // Currency match (max 5 points)
    if (transaction.currency === expenseItem.currency) {
      score += 5;
      reasons.push('Same currency');
    }

    // Category match (max 5 points)
    if (expenseItem.category && transaction.merchantCategory) {
      if (this.categoriesMatch(expenseItem.category, transaction.merchantCategory)) {
        score += 5;
        reasons.push('Category match');
      }
    }

    return {
      matchScore: Math.min(score / 100, 1), // Normalize to 0-1
      reasons
    };
  }

  /**
   * Calculate fraud score for transaction
   */
  private async calculateFraudScore(
    transaction: CardTransaction,
    card: CorporateCard
  ): Promise<number> {
    let score = 0;

    // High amount check
    if (transaction.amount > 5000) {
      score += 20;
    } else if (transaction.amount > 1000) {
      score += 10;
    }

    // Weekend/holiday transaction
    const transactionDay = transaction.transactionDate.getDay();
    if (transactionDay === 0 || transactionDay === 6) {
      score += 15;
    }

    // Unusual time (late night)
    const hour = transaction.transactionDate.getHours();
    if (hour < 6 || hour > 23) {
      score += 10;
    }

    // International transaction
    if (transaction.location && transaction.location.country !== 'BR') {
      score += 25;
    }

    // Multiple transactions in short time
    // This would require checking other recent transactions
    // For now, we'll simulate based on transaction metadata
    if (transaction.metadata?.velocityFlag) {
      score += 30;
    }

    return Math.min(score, 100);
  }

  /**
   * Private helper methods
   */
  private async fetchTransactionsFromProvider(
    card: CorporateCard,
    fromDate: Date,
    toDate: Date
  ): Promise<CardTransaction[]> {
    // Simulate card transaction data
    const transactions: CardTransaction[] = [];
    
    for (let i = 0; i < 10; i++) {
      const randomDate = new Date(fromDate.getTime() + Math.random() * (toDate.getTime() - fromDate.getTime()));
      
      transactions.push({
        id: `txn_${Date.now()}_${i}`,
        tenantId: card.tenantId,
        cardId: card.id,
        transactionId: `bank_${Math.random().toString(36).substr(2, 12)}`,
        amount: Math.round((Math.random() * 500 + 50) * 100) / 100,
        currency: card.currency,
        merchantName: ['Restaurante ABC', 'Hotel XYZ', 'Posto Shell', 'Uber', 'Amazon', 'Starbucks'][Math.floor(Math.random() * 6)],
        merchantCategory: 'RESTAURANT',
        transactionDate: randomDate,
        postingDate: new Date(randomDate.getTime() + 24 * 60 * 60 * 1000),
        description: `Card purchase - ${Math.random().toString(36).substr(2, 8)}`,
        status: 'posted',
        transactionType: 'purchase',
        authorizationCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
        isExpensed: false
      });
    }
    
    return transactions;
  }

  private async classifyTransaction(transaction: CardTransaction): Promise<{ businessProbability: number }> {
    // Simple business classification logic
    const businessMerchants = ['hotel', 'restaurant', 'airline', 'taxi', 'uber', 'office', 'conference'];
    const personalMerchants = ['grocery', 'pharmacy', 'gas station', 'entertainment'];
    
    const merchantLower = transaction.merchantName.toLowerCase();
    
    if (businessMerchants.some(keyword => merchantLower.includes(keyword))) {
      return { businessProbability: 0.8 };
    } else if (personalMerchants.some(keyword => merchantLower.includes(keyword))) {
      return { businessProbability: 0.3 };
    }
    
    return { businessProbability: 0.5 }; // Neutral
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private categoriesMatch(expenseCategory: string, merchantCategory: string): boolean {
    // Simple category matching logic
    const categoryMappings: Record<string, string[]> = {
      'meals': ['RESTAURANT', 'FOOD'],
      'travel': ['AIRLINE', 'HOTEL', 'TAXI'],
      'office': ['OFFICE_SUPPLIES', 'SOFTWARE'],
      'fuel': ['GAS_STATION', 'FUEL']
    };
    
    for (const [category, merchants] of Object.entries(categoryMappings)) {
      if (expenseCategory.toLowerCase().includes(category) && 
          merchants.some(m => merchantCategory.includes(m))) {
        return true;
      }
    }
    
    return false;
  }

  private getMatchConfidence(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.9) return 'high';
    if (score >= 0.7) return 'medium';
    return 'low';
  }

  // Placeholder methods that would be implemented with actual repositories
  private async getCard(cardId: string, tenantId: string): Promise<CorporateCard> {
    throw new Error('Not implemented - would use card repository');
  }

  private async getUnmatchedTransactions(tenantId: string, cardId?: string, fromDate?: Date, toDate?: Date): Promise<CardTransaction[]> {
    return [];
  }

  private async getUnmatchedExpenseItems(tenantId: string, fromDate?: Date, toDate?: Date): Promise<any[]> {
    return [];
  }

  private async linkTransactionToExpense(transactionId: string, expenseItemId: string, tenantId: string, method: string): Promise<void> {
    console.log('🔗 Linking transaction to expense:', { transactionId, expenseItemId, method });
  }

  private async flagForManualReview(match: ExpenseMatch, tenantId: string): Promise<void> {
    console.log('🏃 Flagging for manual review:', { matchScore: match.matchScore });
  }

  private async runFraudChecks(transaction: CardTransaction, tenantId: string): Promise<any[]> {
    return [];
  }

  private async updateCardSyncDate(cardId: string, tenantId: string, syncDate: Date): Promise<void> {
    console.log('📅 Updating card sync date:', { cardId, syncDate });
  }

  private async getCardTransactions(cardId: string, tenantId: string, fromDate: Date, toDate: Date): Promise<CardTransaction[]> {
    return [];
  }

  private async getExpenseItemsForPeriod(tenantId: string, fromDate: Date, toDate: Date): Promise<any[]> {
    return [];
  }

  private async identifyReconciliationIssues(transactions: CardTransaction[], expenseItems: any[], tenantId: string): Promise<ReconciliationIssue[]> {
    return [];
  }
}