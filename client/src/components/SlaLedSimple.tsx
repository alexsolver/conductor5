// Simple SLA LED Indicator Component
import React from 'react';

interface SlaLedSimpleProps {
  ticketId: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SlaLedSimple({ ticketId, size = 'md' }: SlaLedSimpleProps) {
  console.log(`🔍 [SLA-LED-SIMPLE] Rendering for ticket: ${ticketId}`);
  
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };
  
  // Simular SLA em warning (85% decorrido)
  const status = 'warning';
  const percent = 85;
  
  return (
    <div className="flex items-center space-x-2" data-testid="sla-led-simple">
      <div 
        className={`${sizeClasses[size]} bg-yellow-500 rounded-full border-2 border-yellow-300 shadow-lg`}
        title={`SLA Warning: ${percent}% decorrido`}
      />
      <span className="text-xs font-medium text-yellow-600">SLA</span>
    </div>
  );
}