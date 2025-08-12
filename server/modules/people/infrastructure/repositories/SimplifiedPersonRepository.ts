/**
 * Simplified Person Repository - Phase 13 Implementation
 * 
 * Implementação simplificada do repositório de pessoas
 * Para uso imediato enquanto integração com banco não está disponível
 * 
 * @module SimplifiedPersonRepository
 * @version 1.0.0
 * @created 2025-08-12 - Phase 13 Clean Architecture Implementation
 */

import { Person } from '../../domain/entities/Person';
import { 
  IPersonRepository, 
  PersonFilters, 
  PersonStatistics, 
  AddressInfo 
} from '../../domain/repositories/IPersonRepository';

export class SimplifiedPersonRepository implements IPersonRepository {
  private people: Person[] = [];

  async create(person: Person): Promise<Person> {
    this.people.push(person);
    console.log(`[SIMPLIFIED-PERSON-REPO] Created person: ${person.id} (${person.firstName} ${person.lastName || person.companyName}) - ${person.personType} for tenant: ${person.tenantId}`);
    return person;
  }

  async findById(id: string, tenantId: string): Promise<Person | null> {
    const person = this.people.find(p => p.id === id && p.tenantId === tenantId);
    return person || null;
  }

  async findByEmail(email: string, tenantId: string): Promise<Person | null> {
    const person = this.people.find(p => 
      p.email?.toLowerCase() === email.toLowerCase() && 
      p.tenantId === tenantId
    );
    return person || null;
  }

  async findByDocument(document: string, tenantId: string): Promise<Person | null> {
    const cleanDoc = document.replace(/[^\d]/g, '');
    const person = this.people.find(p => 
      ((p.cpf?.replace(/[^\d]/g, '') === cleanDoc) || 
       (p.cnpj?.replace(/[^\d]/g, '') === cleanDoc)) && 
      p.tenantId === tenantId
    );
    return person || null;
  }

  async findAll(filters: PersonFilters): Promise<Person[]> {
    let filteredPeople = this.people.filter(person => {
      if (filters.tenantId && person.tenantId !== filters.tenantId) return false;
      if (filters.personType && person.personType !== filters.personType) return false;
      if (filters.isActive !== undefined && person.isActive !== filters.isActive) return false;
      if (filters.hasEmail !== undefined && !!person.email !== filters.hasEmail) return false;
      if (filters.hasPhone !== undefined && !!(person.phone || person.cellPhone) !== filters.hasPhone) return false;
      if (filters.hasDocument !== undefined && !!(person.cpf || person.cnpj) !== filters.hasDocument) return false;
      if (filters.city && person.address?.city?.toLowerCase() !== filters.city.toLowerCase()) return false;
      if (filters.state && person.address?.state?.toLowerCase() !== filters.state.toLowerCase()) return false;
      if (filters.tags && filters.tags.length > 0) {
        const hasAllTags = filters.tags.every(tag => person.tags?.includes(tag));
        if (!hasAllTags) return false;
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = person.firstName.toLowerCase().includes(searchLower);
        const matchesLastName = person.lastName?.toLowerCase().includes(searchLower);
        const matchesCompany = person.companyName?.toLowerCase().includes(searchLower);
        const matchesEmail = person.email?.toLowerCase().includes(searchLower);
        const matchesPhone = person.phone?.includes(searchLower);
        const matchesCellPhone = person.cellPhone?.includes(searchLower);
        const matchesDocument = person.cpf?.includes(searchLower) || person.cnpj?.includes(searchLower);
        if (!matchesName && !matchesLastName && !matchesCompany && !matchesEmail && !matchesPhone && !matchesCellPhone && !matchesDocument) return false;
      }
      if (filters.createdAfter && person.createdAt < filters.createdAfter) return false;
      if (filters.createdBefore && person.createdAt > filters.createdBefore) return false;
      return true;
    });

    return filteredPeople.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async update(id: string, tenantId: string, updateData: Partial<Person>): Promise<Person | null> {
    const index = this.people.findIndex(p => p.id === id && p.tenantId === tenantId);
    if (index === -1) return null;

    this.people[index] = { ...this.people[index], ...updateData, updatedAt: new Date() };
    console.log(`[SIMPLIFIED-PERSON-REPO] Updated person: ${id} for tenant: ${tenantId}`);
    return this.people[index];
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const index = this.people.findIndex(p => p.id === id && p.tenantId === tenantId);
    if (index === -1) return false;

    this.people[index].isActive = false;
    this.people[index].updatedAt = new Date();
    console.log(`[SIMPLIFIED-PERSON-REPO] Soft deleted person: ${id} for tenant: ${tenantId}`);
    return true;
  }

  async hardDelete(id: string, tenantId: string): Promise<boolean> {
    const index = this.people.findIndex(p => p.id === id && p.tenantId === tenantId);
    if (index === -1) return false;

    this.people.splice(index, 1);
    console.log(`[SIMPLIFIED-PERSON-REPO] Hard deleted person: ${id} for tenant: ${tenantId}`);
    return true;
  }

  async search(query: string, tenantId: string, filters?: Partial<PersonFilters>): Promise<Person[]> {
    const searchFilters: PersonFilters = {
      tenantId,
      search: query,
      ...filters
    };
    
    return await this.findAll(searchFilters);
  }

  async findByPersonType(personType: 'natural' | 'legal', tenantId: string): Promise<Person[]> {
    return this.people.filter(p => p.personType === personType && p.tenantId === tenantId);
  }

  async findByTags(tags: string[], tenantId: string): Promise<Person[]> {
    return this.people.filter(p => 
      p.tenantId === tenantId && 
      tags.every(tag => p.tags?.includes(tag))
    );
  }

  async findByLocation(city?: string, state?: string, tenantId?: string): Promise<Person[]> {
    return this.people.filter(p => {
      if (tenantId && p.tenantId !== tenantId) return false;
      if (city && p.address?.city?.toLowerCase() !== city.toLowerCase()) return false;
      if (state && p.address?.state?.toLowerCase() !== state.toLowerCase()) return false;
      return true;
    });
  }

  async findBirthdaysInRange(startDate: Date, endDate: Date, tenantId: string): Promise<Person[]> {
    return this.people.filter(p => 
      p.tenantId === tenantId && 
      p.birthDate && 
      p.birthDate >= startDate && 
      p.birthDate <= endDate
    );
  }

  async findByAgeRange(minAge: number, maxAge: number, tenantId: string): Promise<Person[]> {
    const today = new Date();
    return this.people.filter(p => {
      if (p.tenantId !== tenantId || !p.birthDate) return false;
      
      const age = today.getFullYear() - p.birthDate.getFullYear();
      const monthDiff = today.getMonth() - p.birthDate.getMonth();
      const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < p.birthDate.getDate()) 
        ? age - 1 : age;
      
      return finalAge >= minAge && finalAge <= maxAge;
    });
  }

  async existsByEmail(email: string, tenantId: string, excludeId?: string): Promise<boolean> {
    return this.people.some(person => 
      person.email?.toLowerCase() === email.toLowerCase() && 
      person.tenantId === tenantId && 
      (!excludeId || person.id !== excludeId)
    );
  }

  async existsByDocument(document: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const cleanDoc = document.replace(/[^\d]/g, '');
    return this.people.some(person => 
      ((person.cpf?.replace(/[^\d]/g, '') === cleanDoc) || 
       (person.cnpj?.replace(/[^\d]/g, '') === cleanDoc)) && 
      person.tenantId === tenantId && 
      (!excludeId || person.id !== excludeId)
    );
  }

  async validatePersonData(person: Partial<Person>): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!person.firstName) errors.push('Nome/Razão social é obrigatório');
    if (!person.personType) errors.push('Tipo de pessoa é obrigatório');
    if (!person.tenantId) errors.push('Tenant ID é obrigatório');
    
    if (person.personType === 'natural') {
      if (!person.lastName) errors.push('Sobrenome é obrigatório para pessoa física');
      if (person.companyName) errors.push('Nome da empresa não deve ser preenchido para pessoa física');
    } else if (person.personType === 'legal') {
      if (!person.companyName) errors.push('Nome da empresa é obrigatório para pessoa jurídica');
      if (person.lastName) errors.push('Sobrenome não deve ser preenchido para pessoa jurídica');
    }

    if (person.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email)) {
      errors.push('Email inválido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async findPotentialDuplicates(person: Person): Promise<Person[]> {
    const duplicates: Person[] = [];
    
    // Check by email
    if (person.email) {
      const byEmail = await this.findByEmail(person.email, person.tenantId);
      if (byEmail && byEmail.id !== person.id) {
        duplicates.push(byEmail);
      }
    }
    
    // Check by document
    const document = person.cpf || person.cnpj;
    if (document) {
      const byDocument = await this.findByDocument(document, person.tenantId);
      if (byDocument && byDocument.id !== person.id) {
        duplicates.push(byDocument);
      }
    }
    
    return Array.from(new Set(duplicates));
  }

  async getStatistics(tenantId: string): Promise<PersonStatistics> {
    const tenantPeople = this.people.filter(p => p.tenantId === tenantId);
    
    const totalPeople = tenantPeople.length;
    const naturalPersons = tenantPeople.filter(p => p.personType === 'natural').length;
    const legalPersons = tenantPeople.filter(p => p.personType === 'legal').length;
    const activePeople = tenantPeople.filter(p => p.isActive).length;
    const inactivePeople = tenantPeople.filter(p => !p.isActive).length;
    const peopleWithEmail = tenantPeople.filter(p => p.email).length;
    const peopleWithPhone = tenantPeople.filter(p => p.phone || p.cellPhone).length;
    const peopleWithDocument = tenantPeople.filter(p => p.cpf || p.cnpj).length;
    const peopleWithCompleteAddress = tenantPeople.filter(p => 
      p.address?.street && p.address?.number && p.address?.city && p.address?.state && p.address?.zipCode
    ).length;
    
    // Calculate average age
    const peopleWithBirthDate = tenantPeople.filter(p => p.birthDate);
    const averageAge = peopleWithBirthDate.length > 0 
      ? peopleWithBirthDate.reduce((sum, p) => {
          const age = new Date().getFullYear() - p.birthDate!.getFullYear();
          return sum + age;
        }, 0) / peopleWithBirthDate.length
      : undefined;
    
    // Count unique cities and states
    const cities = new Set(tenantPeople.map(p => p.address?.city).filter(Boolean));
    const states = new Set(tenantPeople.map(p => p.address?.state).filter(Boolean));
    
    // Count unique tags
    const allTags = tenantPeople.flatMap(p => p.tags || []);
    const uniqueTags = Array.from(new Set(allTags));
    
    return {
      totalPeople,
      naturalPersons,
      legalPersons,
      activePeople,
      inactivePeople,
      peopleWithEmail,
      peopleWithPhone,
      peopleWithDocument,
      peopleWithCompleteAddress,
      averageAge,
      citiesCount: cities.size,
      statesCount: states.size,
      tagsCount: uniqueTags.size
    };
  }

  async count(filters: PersonFilters): Promise<number> {
    const people = await this.findAll(filters);
    return people.length;
  }

  async getAgeDistribution(tenantId: string): Promise<Array<{ ageRange: string; count: number; percentage: number }>> {
    const tenantPeople = this.people.filter(p => p.tenantId === tenantId && p.birthDate && p.personType === 'natural');
    const total = tenantPeople.length;
    
    if (total === 0) return [];
    
    const ageRanges = [
      { min: 0, max: 17, label: '0-17' },
      { min: 18, max: 25, label: '18-25' },
      { min: 26, max: 35, label: '26-35' },
      { min: 36, max: 45, label: '36-45' },
      { min: 46, max: 55, label: '46-55' },
      { min: 56, max: 65, label: '56-65' },
      { min: 66, max: 120, label: '66+' }
    ];
    
    const distribution = ageRanges.map(range => {
      const count = tenantPeople.filter(p => {
        const age = new Date().getFullYear() - p.birthDate!.getFullYear();
        return age >= range.min && age <= range.max;
      }).length;
      
      return {
        ageRange: range.label,
        count,
        percentage: Math.round((count / total) * 100 * 100) / 100
      };
    });
    
    return distribution.filter(d => d.count > 0);
  }

  async getLocationDistribution(tenantId: string): Promise<Array<{ city: string; state: string; count: number }>> {
    const tenantPeople = this.people.filter(p => p.tenantId === tenantId && p.address?.city && p.address?.state);
    
    const locationMap = new Map<string, { city: string; state: string; count: number }>();
    
    tenantPeople.forEach(person => {
      const key = `${person.address!.city}|${person.address!.state}`;
      const existing = locationMap.get(key);
      
      if (existing) {
        existing.count++;
      } else {
        locationMap.set(key, {
          city: person.address!.city!,
          state: person.address!.state!,
          count: 1
        });
      }
    });
    
    return Array.from(locationMap.values()).sort((a, b) => b.count - a.count);
  }

  async getPopularTags(tenantId: string, limit = 10): Promise<Array<{ tag: string; count: number; percentage: number }>> {
    const tenantPeople = this.people.filter(p => p.tenantId === tenantId);
    const allTags = tenantPeople.flatMap(p => p.tags || []);
    const total = allTags.length;
    
    if (total === 0) return [];
    
    const tagCounts = new Map<string, number>();
    allTags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
    
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: Math.round((count / total) * 100 * 100) / 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async getPersonTypeDistribution(tenantId: string): Promise<Array<{ personType: 'natural' | 'legal'; count: number; percentage: number }>> {
    const tenantPeople = this.people.filter(p => p.tenantId === tenantId);
    const total = tenantPeople.length;
    
    if (total === 0) return [];
    
    const natural = tenantPeople.filter(p => p.personType === 'natural').length;
    const legal = tenantPeople.filter(p => p.personType === 'legal').length;
    
    const results: Array<{ personType: 'natural' | 'legal'; count: number; percentage: number }> = [];
    
    if (natural > 0) {
      results.push({
        personType: 'natural' as const,
        count: natural,
        percentage: Math.round((natural / total) * 100 * 100) / 100
      });
    }
    
    if (legal > 0) {
      results.push({
        personType: 'legal' as const,
        count: legal,
        percentage: Math.round((legal / total) * 100 * 100) / 100
      });
    }
    
    return results;
  }

  // Simplified bulk operations
  async createBulk(people: Person[]): Promise<Person[]> {
    const createdPeople: Person[] = [];
    for (const person of people) {
      createdPeople.push(await this.create(person));
    }
    console.log(`[SIMPLIFIED-PERSON-REPO] Created ${createdPeople.length} people in bulk`);
    return createdPeople;
  }

  async updateBulk(updates: Array<{ id: string; tenantId: string; data: Partial<Person> }>): Promise<Person[]> {
    const updatedPeople: Person[] = [];
    
    for (const update of updates) {
      const updatedPerson = await this.update(update.id, update.tenantId, update.data);
      if (updatedPerson) {
        updatedPeople.push(updatedPerson);
      }
    }

    console.log(`[SIMPLIFIED-PERSON-REPO] Updated ${updatedPeople.length} people in bulk`);
    return updatedPeople;
  }

  async importPeople(peopleData: Array<Partial<Person>>, tenantId: string, createdBy?: string): Promise<{
    success: Person[];
    errors: Array<{ row: number; error: string; data: Partial<Person> }>;
  }> {
    const success: Person[] = [];
    const errors: Array<{ row: number; error: string; data: Partial<Person> }> = [];

    for (let i = 0; i < peopleData.length; i++) {
      const personData = peopleData[i];
      
      try {
        const validation = await this.validatePersonData({ ...personData, tenantId });
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }

        // Check for duplicates
        if (personData.email && await this.existsByEmail(personData.email, tenantId)) {
          throw new Error(`Email '${personData.email}' já está em uso`);
        }

        const document = personData.cpf || personData.cnpj;
        if (document && await this.existsByDocument(document, tenantId)) {
          const docType = personData.cpf ? 'CPF' : 'CNPJ';
          throw new Error(`${docType} '${document}' já está em uso`);
        }

        const person: Person = {
          id: `person_import_${Date.now()}_${i}`,
          tenantId,
          personType: personData.personType!,
          firstName: personData.firstName!,
          lastName: personData.lastName,
          companyName: personData.companyName,
          email: personData.email,
          phone: personData.phone,
          cellPhone: personData.cellPhone,
          cpf: personData.cpf,
          cnpj: personData.cnpj,
          rg: personData.rg,
          birthDate: personData.birthDate,
          address: personData.address,
          contactPerson: personData.contactPerson,
          contactPhone: personData.contactPhone,
          notes: personData.notes,
          tags: personData.tags || [],
          isActive: personData.isActive !== false,
          metadata: personData.metadata,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy,
          updatedBy: undefined
        };

        const createdPerson = await this.create(person);
        success.push(createdPerson);

      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: personData
        });
      }
    }

    console.log(`[SIMPLIFIED-PERSON-REPO] Imported ${success.length} people, ${errors.length} errors`);
    return { success, errors };
  }

  async exportPeople(filters: PersonFilters): Promise<Person[]> {
    return await this.findAll(filters);
  }

  async mergePeople(sourceId: string, targetId: string, tenantId: string, updatedBy?: string): Promise<Person> {
    const source = await this.findById(sourceId, tenantId);
    const target = await this.findById(targetId, tenantId);
    
    if (!source || !target) {
      throw new Error('Source or target person not found');
    }

    // Merge data (target takes precedence, but fill missing fields from source)
    const mergedData: Partial<Person> = {
      firstName: target.firstName || source.firstName,
      lastName: target.lastName || source.lastName,
      companyName: target.companyName || source.companyName,
      email: target.email || source.email,
      phone: target.phone || source.phone,
      cellPhone: target.cellPhone || source.cellPhone,
      cpf: target.cpf || source.cpf,
      cnpj: target.cnpj || source.cnpj,
      rg: target.rg || source.rg,
      birthDate: target.birthDate || source.birthDate,
      address: target.address || source.address,
      contactPerson: target.contactPerson || source.contactPerson,
      contactPhone: target.contactPhone || source.contactPhone,
      notes: [target.notes, source.notes].filter(Boolean).join('\n---\n') || undefined,
      tags: [...new Set([...(target.tags || []), ...(source.tags || [])])],
      metadata: { ...(source.metadata || {}), ...(target.metadata || {}) },
      updatedBy,
      updatedAt: new Date()
    };

    // Update target with merged data
    const updated = await this.update(targetId, tenantId, mergedData);
    
    // Deactivate source
    await this.delete(sourceId, tenantId);
    
    console.log(`[SIMPLIFIED-PERSON-REPO] Merged person ${sourceId} into ${targetId}`);
    return updated!;
  }

  // Simplified tag and contact operations
  async addTag(id: string, tenantId: string, tag: string, updatedBy?: string): Promise<boolean> {
    const person = await this.findById(id, tenantId);
    if (!person) return false;

    const tags = person.tags || [];
    if (!tags.includes(tag)) {
      tags.push(tag);
      await this.update(id, tenantId, { tags, updatedBy, updatedAt: new Date() });
    }
    
    return true;
  }

  async removeTag(id: string, tenantId: string, tag: string, updatedBy?: string): Promise<boolean> {
    const person = await this.findById(id, tenantId);
    if (!person) return false;

    const tags = (person.tags || []).filter(t => t !== tag);
    await this.update(id, tenantId, { tags, updatedBy, updatedAt: new Date() });
    
    return true;
  }

  async updateTags(id: string, tenantId: string, tags: string[], updatedBy?: string): Promise<Person | null> {
    return await this.update(id, tenantId, { tags, updatedBy, updatedAt: new Date() });
  }

  async getAllTags(tenantId: string): Promise<string[]> {
    const tenantPeople = this.people.filter(p => p.tenantId === tenantId);
    const allTags = tenantPeople.flatMap(p => p.tags || []);
    return Array.from(new Set(allTags)).sort();
  }

  async renameTag(oldTag: string, newTag: string, tenantId: string, updatedBy?: string): Promise<number> {
    let count = 0;
    const tenantPeople = this.people.filter(p => p.tenantId === tenantId && p.tags?.includes(oldTag));
    
    for (const person of tenantPeople) {
      const tags = (person.tags || []).map(t => t === oldTag ? newTag : t);
      await this.update(person.id, tenantId, { tags, updatedBy, updatedAt: new Date() });
      count++;
    }
    
    console.log(`[SIMPLIFIED-PERSON-REPO] Renamed tag '${oldTag}' to '${newTag}' for ${count} people`);
    return count;
  }

  async deleteTag(tag: string, tenantId: string, updatedBy?: string): Promise<number> {
    let count = 0;
    const tenantPeople = this.people.filter(p => p.tenantId === tenantId && p.tags?.includes(tag));
    
    for (const person of tenantPeople) {
      const tags = (person.tags || []).filter(t => t !== tag);
      await this.update(person.id, tenantId, { tags, updatedBy, updatedAt: new Date() });
      count++;
    }
    
    console.log(`[SIMPLIFIED-PERSON-REPO] Deleted tag '${tag}' from ${count} people`);
    return count;
  }

  // Simplified contact and relationship operations
  async findWithoutContact(tenantId: string): Promise<Person[]> {
    return this.people.filter(p => 
      p.tenantId === tenantId && 
      !p.email && 
      !p.phone && 
      !p.cellPhone
    );
  }

  async findWithoutCompleteAddress(tenantId: string): Promise<Person[]> {
    return this.people.filter(p => 
      p.tenantId === tenantId && 
      (!p.address || !p.address.street || !p.address.number || !p.address.city || !p.address.state || !p.address.zipCode)
    );
  }

  async findWithoutDocuments(tenantId: string): Promise<Person[]> {
    return this.people.filter(p => 
      p.tenantId === tenantId && 
      !p.cpf && 
      !p.cnpj
    );
  }

  async updateContactInfo(id: string, tenantId: string, contactInfo: {
    email?: string;
    phone?: string;
    cellPhone?: string;
    contactPerson?: string;
    contactPhone?: string;
  }, updatedBy?: string): Promise<Person | null> {
    return await this.update(id, tenantId, { ...contactInfo, updatedBy, updatedAt: new Date() });
  }

  async updateAddress(id: string, tenantId: string, address: AddressInfo, updatedBy?: string): Promise<Person | null> {
    return await this.update(id, tenantId, { address, updatedBy, updatedAt: new Date() });
  }

  // Simplified activity and relationship operations (basic implementations)
  async findRelatedPeople(id: string, tenantId: string): Promise<Array<{
    person: Person;
    relationshipType: 'same_address' | 'same_phone' | 'same_email_domain' | 'same_company';
    similarity: number;
  }>> {
    const person = await this.findById(id, tenantId);
    if (!person) return [];
    
    const related: Array<{
      person: Person;
      relationshipType: 'same_address' | 'same_phone' | 'same_email_domain' | 'same_company';
      similarity: number;
    }> = [];
    
    const otherPeople = this.people.filter(p => p.tenantId === tenantId && p.id !== id);
    
    otherPeople.forEach(other => {
      // Same address
      if (person.address?.street && other.address?.street === person.address.street) {
        related.push({ person: other, relationshipType: 'same_address', similarity: 0.8 });
      }
      
      // Same phone
      if ((person.phone && other.phone === person.phone) || (person.cellPhone && other.cellPhone === person.cellPhone)) {
        related.push({ person: other, relationshipType: 'same_phone', similarity: 0.9 });
      }
      
      // Same email domain
      if (person.email && other.email) {
        const personDomain = person.email.split('@')[1];
        const otherDomain = other.email.split('@')[1];
        if (personDomain === otherDomain) {
          related.push({ person: other, relationshipType: 'same_email_domain', similarity: 0.6 });
        }
      }
      
      // Same company (for legal persons)
      if (person.personType === 'legal' && other.personType === 'legal' && 
          person.companyName === other.companyName) {
        related.push({ person: other, relationshipType: 'same_company', similarity: 0.7 });
      }
    });
    
    return related.sort((a, b) => b.similarity - a.similarity);
  }

  async findPeopleInSameGroup(id: string, tenantId: string): Promise<Person[]> {
    const related = await this.findRelatedPeople(id, tenantId);
    return related.map(r => r.person);
  }

  async linkPeople(personId1: string, personId2: string, relationshipType: string, tenantId: string, createdBy?: string): Promise<boolean> {
    // Simple implementation - just log the relationship
    console.log(`[SIMPLIFIED-PERSON-REPO] Linked ${personId1} and ${personId2} with relationship: ${relationshipType}`);
    return true;
  }

  async getPersonActivity(id: string, tenantId: string, limit = 50): Promise<Array<{
    action: string;
    timestamp: Date;
    userId?: string;
    details?: Record<string, any>;
  }>> {
    // Simple implementation - return empty array
    return [];
  }

  async logActivity(personId: string, tenantId: string, action: string, userId?: string, details?: Record<string, any>): Promise<void> {
    console.log(`[SIMPLIFIED-PERSON-REPO] Activity logged for ${personId}: ${action}`);
  }

  async getRecentlyCreated(tenantId: string, days = 7, limit = 10): Promise<Person[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.people
      .filter(p => p.tenantId === tenantId && p.createdAt >= cutoffDate)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getRecentlyUpdated(tenantId: string, days = 7, limit = 10): Promise<Person[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.people
      .filter(p => p.tenantId === tenantId && p.updatedAt >= cutoffDate)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }
}