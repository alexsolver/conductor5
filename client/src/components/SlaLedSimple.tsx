// ✅ 1QA.MD COMPLIANCE: SIMPLE SLA PROGRESS BAR WITH REAL BACKEND INTEGRATION
// Simple SLA Progress Bar Indicator Component with real data and gradient colors

import React from 'react';
import { SlaLed } from './SlaLed';

interface SlaLedSimpleProps {
  ticketId: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SlaLedSimple({ ticketId, size = 'md' }: SlaLedSimpleProps) {
  console.log(`🔍 [SLA-LED-SIMPLE] Rendering for ticket: ${ticketId}`);
  console.log(`🔍 [SLA-LED-SIMPLE] Using real SLA data from backend`);
  
  // Usar o componente principal SlaLed que já está integrado com o backend
  return (
    <div data-testid="sla-led-simple">
      <SlaLed 
        ticketId={ticketId}
        size={size}
        showText={false}
        className="inline-flex"
      />
    </div>
  );
}