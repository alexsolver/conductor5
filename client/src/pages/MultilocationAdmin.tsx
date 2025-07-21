/**
 * Multilocation Administration Page
 * Página de administração para configurações multilocation
 * Integração com SaaS Admin hierarchy
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import MultilocationSettings from '@/components/MultilocationSettings';

export default function MultilocationAdmin() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto p-6">
      <MultilocationSettings />
    </div>
  );
}