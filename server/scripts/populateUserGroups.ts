
import { db } from '../db';
import { userGroups } from '../../shared/schema';
import { eq } from 'drizzle-orm';

interface TenantInfo {
  id: string;
  name: string;
}

const defaultGroups = [
  {
    name: 'Suporte Técnico',
    description: 'Equipe de suporte técnico especializado',
    isActive: true
  },
  {
    name: 'Telegram Notifications',
    description: 'Grupo para notificações via Telegram',
    isActive: true
  },
  {
    name: 'Administradores',
    description: 'Administradores do sistema',
    isActive: true
  },
  {
    name: 'Suporte Nível 1',
    description: 'Primeiro nível de suporte técnico',
    isActive: true
  },
  {
    name: 'Suporte Nível 2',
    description: 'Segundo nível de suporte técnico',
    isActive: true
  }
];

export async function populateUserGroups(tenantId: string) {
  try {
    console.log(`📋 Populando grupos de usuários para tenant: ${tenantId}`);

    // Verificar se já existem grupos para este tenant
    const existingGroups = await db
      .select()
      .from(userGroups)
      .where(eq(userGroups.tenantId, tenantId));

    if (existingGroups.length > 0) {
      console.log(`✅ Tenant ${tenantId} já possui ${existingGroups.length} grupos configurados`);
      return existingGroups;
    }

    // Criar grupos padrão
    const createdGroups = [];
    for (const group of defaultGroups) {
      const [newGroup] = await db
        .insert(userGroups)
        .values({
          tenantId,
          name: group.name,
          description: group.description,
          isActive: group.isActive,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      createdGroups.push(newGroup);
      console.log(`✅ Grupo criado: ${group.name}`);
    }

    console.log(`🎯 ${createdGroups.length} grupos criados com sucesso para tenant ${tenantId}`);
    return createdGroups;

  } catch (error) {
    console.error('❌ Erro ao popular grupos de usuários:', error);
    throw error;
  }
}

export async function populateAllTenantsUserGroups() {
  try {
    // Lista de tenants conhecidos (pode ser expandida conforme necessário)
    const knownTenants = [
      '3f99462f-3621-4b1b-bea8-782acc50d62e', // Tenant principal
      '715c510a-3db5-4510-880a-9a1a5c320100',
      '78a4c88e-0e85-4f7c-ad92-f472dad50d7a',
      'cb9056df-d964-43d7-8fd8-b0cc00a72056'
    ];

    console.log('🚀 Iniciando população de grupos para todos os tenants...');
    
    for (const tenantId of knownTenants) {
      await populateUserGroups(tenantId);
    }

    console.log('✅ População de grupos concluída para todos os tenants');

  } catch (error) {
    console.error('❌ Erro na população em massa de grupos:', error);
    throw error;
  }
}

// Execução direta se chamado como script
if (require.main === module) {
  populateAllTenantsUserGroups()
    .then(() => {
      console.log('✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na execução do script:', error);
      process.exit(1);
    });
}
