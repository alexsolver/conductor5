#!/usr/bin/env tsx

/**
 * Create All Missing Clean Architecture Structures
 * Systematic creation of missing directories and files for Clean Architecture compliance
 */

import * as fs from 'fs';
import * as path from 'path';

class MissingStructureCreator {
  private readonly modules = [
    'auth', 'beneficiaries', 'custom-fields', 'customers', 'dashboard', 
    'field-layout', 'field-layouts', 'knowledge-base', 'locations', 
    'materials-services', 'notifications', 'people', 'saas-admin', 
    'schedule-management', 'technical-skills', 'template-audit', 
    'tenant-admin', 'ticket-history', 'tickets', 'timecard', 'user-management'
  ];

  private readonly structures = [
    { name: 'value-objects', layer: 'domain' },
    { name: 'services', layer: 'domain' },
    { name: 'events', layer: 'domain' },
    { name: 'repositories', layer: 'domain' },
    { name: 'dto', layer: 'application' },
    { name: 'services', layer: 'application' },
    { name: 'clients', layer: 'infrastructure' },
    { name: 'config', layer: 'infrastructure' }
  ];

  async createAllMissingStructures(): Promise<void> {
    console.log('📁 Creating All Missing Clean Architecture Structures');
    console.log('═'.repeat(70));
    
    let createdCount = 0;
    let skippedCount = 0;

    for (const module of this.modules) {
      console.log(`\n📂 Processing module: ${module}`);
      
      for (const structure of this.structures) {
        const result = await this.createStructureIfMissing(module, structure.layer, structure.name);
        if (result) {
          createdCount++;
        } else {
          skippedCount++;
        }
      }
    }

    console.log(`\n✅ Structure Creation Complete`);
    console.log(`📊 Created: ${createdCount} | Skipped: ${skippedCount}`);
  }

  private async createStructureIfMissing(
    module: string, 
    layer: string, 
    structure: string
  ): Promise<boolean> {
    const dirPath = `server/modules/${module}/${layer}/${structure}`;
    
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        
        // Create appropriate index file
        const indexPath = path.join(dirPath, 'index.ts');
        const content = this.getIndexContent(structure, layer);
        fs.writeFileSync(indexPath, content);
        
        console.log(`  ✓ Created ${layer}/${structure} for ${module}`);
        return true;
      } catch (error) {
        console.log(`  ⚠ Failed to create ${dirPath}: ${error}`);
        return false;
      }
    }
    return false;
  }

  private getIndexContent(structure: string, layer: string): string {
    const templates = {
      'value-objects': `/**
 * Value Objects
 * Clean Architecture - Domain Layer
 * Immutable objects that represent concepts from the domain
 */

export {};
`,
      'services': layer === 'domain' ? `/**
 * Domain Services
 * Clean Architecture - Domain Layer
 * Business logic that doesn't belong to entities
 */

export {};
` : `/**
 * Application Services
 * Clean Architecture - Application Layer
 * Orchestrates use cases and coordinates between layers
 */

export {};
`,
      'events': `/**
 * Domain Events
 * Clean Architecture - Domain Layer
 * Events that represent important business occurrences
 */

export {};
`,
      'repositories': `/**
 * Repository Interfaces
 * Clean Architecture - Domain Layer
 * Contracts for data persistence
 */

export {};
`,
      'dto': `/**
 * Data Transfer Objects
 * Clean Architecture - Application Layer
 * Objects for transferring data between layers
 */

export {};
`,
      'clients': `/**
 * External Service Clients
 * Clean Architecture - Infrastructure Layer
 * Adapters for external services and APIs
 */

export {};
`,
      'config': `/**
 * Configuration
 * Clean Architecture - Infrastructure Layer
 * Configuration settings and constants
 */

export {};
`
    };

    return templates[structure] || `// ${structure}\nexport {};\n`;
  }
}

// Execute creation
async function main() {
  const creator = new MissingStructureCreator();
  await creator.createAllMissingStructures();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MissingStructureCreator };