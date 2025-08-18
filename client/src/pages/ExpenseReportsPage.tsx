/**
 * EXPENSE REPORTS PAGE - DEPRECADO
 * ❌ Esta página foi consolidada em CorporateExpenseManagement.tsx
 * ❌ Todos os recursos foram migrados seguindo 1qa.md
 * ❌ Use /expense-management ao invés de /expense-reports
 */

import React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ExpenseReportsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect automático para a página consolidada
    navigate('/expense-management', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecionando...</h1>
        <p className="text-muted-foreground">
          Esta página foi consolidada. Redirecionando para Gestão de Despesas Corporativas.
        </p>
      </div>
    </div>
  );
}