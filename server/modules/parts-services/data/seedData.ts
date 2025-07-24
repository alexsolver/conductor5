import { schemaManager } from '../../../db';
import { items, suppliers } from '../../../../shared/schema-parts-services';
import { eq, sql } from 'drizzle-orm';

// Dados iniciais para testes - seguindo requisito de não usar mock data
export async function seedPartsServicesData(tenantId: string) {
  try {
    const { db } = await schemaManager.getTenantDb(tenantId);

    console.log(`🌱 Seeding Parts & Services data for tenant: ${tenantId}`);

    // Inserir fornecedores
    const suppliersData = [
      {
        tenantId,
        name: 'SCHNEIDER ELECTRIC BRASIL LTDA',
        documentNumber: '02.312.465/0001-79',
        email: 'vendas@schneider-electric.com',
        phone: '(11) 3613-1000',
        address: 'Alameda Xingu, 512 - Alphaville',
        city: 'Barueri',
        state: 'SP',
        zipCode: '06455-911',
        contactPerson: 'Carlos Silva',
        active: true,
      },
      {
        tenantId,
        name: 'WEG EQUIPAMENTOS ELÉTRICOS S.A.',
        documentNumber: '84.429.695/0001-11',
        email: 'atendimento@weg.net',
        phone: '(47) 3276-4000',
        address: 'Av. Prefeito Waldemar Grubba, 3300',
        city: 'Jaraguá do Sul',
        state: 'SC',
        zipCode: '89256-900',
        contactPerson: 'Maria Santos',
        active: true,
      },
      {
        tenantId,
        name: 'SIEMENS LTDA',
        documentNumber: '60.838.053/0001-20',
        email: 'info.br@siemens.com',
        phone: '(11) 3933-4000',
        address: 'Rua Jati, 310 - Vila Gertrudes',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '04719-000',
        contactPerson: 'João Oliveira',
        active: true,
      },
    ];

    const createdSuppliers = await db.insert(suppliers).values(suppliersData).returning();
    console.log(`✅ Created ${createdSuppliers.length} suppliers`);

    // Inserir itens (materiais e serviços)
    const itemsData = [
      // MATERIAIS
      {
        tenantId,
        active: true,
        type: 'Material' as const,
        name: 'Disjuntor Tripolar 100A',
        integrationCode: 'DS-TP-100A',
        description: 'Disjuntor tripolar de 100 ampères para proteção de circuitos elétricos industriais',
        unitOfMeasure: 'UN',
        defaultMaintenancePlan: 'Inspeção Visual Trimestral',
        group: 'Componentes Elétricos',
        defaultChecklist: 'Verificar: conexões, aquecimento, funcionamento, isolação',
      },
      {
        tenantId,
        active: true,
        type: 'Material' as const,
        name: 'Contator 25A 220V',
        integrationCode: 'CT-25A-220V',
        description: 'Contator electromagnético para comando de motores até 25A em 220V',
        unitOfMeasure: 'UN',
        defaultMaintenancePlan: 'Inspeção Mensal',
        group: 'Componentes Elétricos',
        defaultChecklist: 'Verificar: contatos, bobina, mola de retorno, isolação',
      },
      {
        tenantId,
        active: true,
        type: 'Material' as const,
        name: 'Relé de Sobrecarga 10-16A',
        integrationCode: 'RL-SC-10-16A',
        description: 'Relé térmico para proteção de sobrecarga em motores de 10 a 16 ampères',
        unitOfMeasure: 'UN',
        defaultMaintenancePlan: 'Teste Funcional Semestral',
        group: 'Proteção Elétrica',
        defaultChecklist: 'Verificar: calibração, funcionamento, reset, contatos auxiliares',
      },
      {
        tenantId,
        active: true,
        type: 'Material' as const,
        name: 'Motor Elétrico 5CV 220/380V',
        integrationCode: 'MT-5CV-220-380',
        description: 'Motor de indução trifásico 5 cavalos, tensão dupla 220/380V, 1750 RPM',
        unitOfMeasure: 'UN',
        defaultMaintenancePlan: 'Manutenção Preventiva Anual',
        group: 'Motores',
        defaultChecklist: 'Verificar: rolamentos, vibração, temperatura, isolação, ventilação',
      },
      {
        tenantId,
        active: true,
        type: 'Material' as const,
        name: 'Cabo Flexível 4mm² Azul',
        integrationCode: 'CB-4MM-AZ',
        description: 'Cabo flexível de cobre de 4mm² com isolação PVC azul para 750V',
        unitOfMeasure: 'M',
        defaultMaintenancePlan: 'Inspeção Visual Anual',
        group: 'Cabeamento',
        defaultChecklist: 'Verificar: isolação, oxidação, fixação, identificação',
      },
      {
        tenantId,
        active: true,
        type: 'Material' as const,
        name: 'Inversor de Frequência 3CV',
        integrationCode: 'INV-3CV-220V',
        description: 'Inversor de frequência para controle de velocidade de motores até 3CV em 220V',
        unitOfMeasure: 'UN',
        defaultMaintenancePlan: 'Manutenção Preventiva Semestral',
        group: 'Automação',
        defaultChecklist: 'Verificar: ventilação, parâmetros, display, conexões, filtros',
      },
      // SERVIÇOS
      {
        tenantId,
        active: true,
        type: 'Serviço' as const,
        name: 'Manutenção Preventiva Elétrica',
        integrationCode: 'SV-MP-ELET',
        description: 'Serviço de manutenção preventiva em sistemas elétricos industriais',
        unitOfMeasure: 'HH',
        defaultMaintenancePlan: 'Execução Trimestral',
        group: 'Manutenção Preventiva',
        defaultChecklist: 'Termografia, medições, aperto de conexões, limpeza, lubrificação',
      },
      {
        tenantId,
        active: true,
        type: 'Serviço' as const,
        name: 'Instalação de Motor Elétrico',
        integrationCode: 'SV-INST-MOTOR',
        description: 'Serviço completo de instalação e comissionamento de motores elétricos',
        unitOfMeasure: 'UN',
        defaultMaintenancePlan: 'Conforme Demanda',
        group: 'Instalação',
        defaultChecklist: 'Fixação, alinhamento, conexões, teste funcional, documentação',
      },
      {
        tenantId,
        active: true,
        type: 'Serviço' as const,
        name: 'Análise Termográfica',
        integrationCode: 'SV-TERMO',
        description: 'Análise termográfica para identificação de pontos quentes em equipamentos',
        unitOfMeasure: 'HH',
        defaultMaintenancePlan: 'Execução Semestral',
        group: 'Análise Preditiva',
        defaultChecklist: 'Câmera térmica, relatório fotográfico, análise técnica, recomendações',
      },
      {
        tenantId,
        active: true,
        type: 'Serviço' as const,
        name: 'Comissionamento de Painel Elétrico',
        integrationCode: 'SV-COMM-PAINEL',
        description: 'Comissionamento completo de painéis elétricos industriais',
        unitOfMeasure: 'UN',
        defaultMaintenancePlan: 'Conforme Projeto',
        group: 'Comissionamento',
        defaultChecklist: 'Testes funcionais, medições, proteções, documentação, treinamento',
      },
    ];

    const createdItems = await db.insert(items).values(itemsData).returning();
    console.log(`✅ Created ${createdItems.length} items (${createdItems.filter(i => i.type === 'Material').length} materials, ${createdItems.filter(i => i.type === 'Serviço').length} services)`);

    console.log(`🎉 Parts & Services data seeding completed for tenant: ${tenantId}`);
    
    return {
      suppliers: createdSuppliers,
      items: createdItems,
    };
  } catch (error) {
    console.error('❌ Error seeding Parts & Services data:', error);
    throw error;
  }
}

// Função para limpar dados (útil para testes)
export async function clearPartsServicesData(tenantId: string) {
  try {
    const { db } = await schemaManager.getTenantDb(tenantId);

    await db.delete(items).where(eq(items.tenantId, tenantId));
    await db.delete(suppliers).where(eq(suppliers.tenantId, tenantId));

    console.log(`🧹 Cleared Parts & Services data for tenant: ${tenantId}`);
  } catch (error) {
    console.error('❌ Error clearing Parts & Services data:', error);
    throw error;
  }
}

// Função para verificar se já existem dados
export async function hasPartsServicesData(tenantId: string): Promise<boolean> {
  try {
    const { db } = await schemaManager.getTenantDb(tenantId);

    const itemCount = await db.select({ count: sql<number>`count(*)` }).from(items).where(eq(items.tenantId, tenantId));
    const supplierCount = await db.select({ count: sql<number>`count(*)` }).from(suppliers).where(eq(suppliers.tenantId, tenantId));

    return Number(itemCount[0].count) > 0 || Number(supplierCount[0].count) > 0;
  } catch (error) {
    console.error('❌ Error checking Parts & Services data:', error);
    return false;
  }
}