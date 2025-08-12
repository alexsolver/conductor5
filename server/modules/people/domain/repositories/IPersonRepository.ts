/**
 * Person Repository Interface - Phase 13 Implementation
 * 
 * Interface do repositório para operações de persistência de Person
 * Define contratos para operações de dados sem dependências externas
 * 
 * @module IPersonRepository
 * @version 1.0.0
 * @created 2025-08-12 - Phase 13 Clean Architecture Implementation
 */

import { Person, PersonEntity } from '../entities/Person';

export interface PersonFilters {
  tenantId?: string;
  personType?: 'natural' | 'legal';
  isActive?: boolean;
  search?: string;
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasDocument?: boolean;
  tags?: string[];
  city?: string;
  state?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface PersonStatistics {
  totalPeople: number;
  naturalPersons: number;
  legalPersons: number;
  activePeople: number;
  inactivePeople: number;
  peopleWithEmail: number;
  peopleWithPhone: number;
  peopleWithDocument: number;
  peopleWithCompleteAddress: number;
  averageAge?: number;
  citiesCount: number;
  statesCount: number;
  tagsCount: number;
}

export interface AddressInfo {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface IPersonRepository {
  // ===== CRUD OPERATIONS =====
  
  /**
   * Create a new person
   */
  create(person: Person): Promise<Person>;
  
  /**
   * Find person by ID
   */
  findById(id: string, tenantId: string): Promise<Person | null>;
  
  /**
   * Find person by email
   */
  findByEmail(email: string, tenantId: string): Promise<Person | null>;
  
  /**
   * Find person by document (CPF or CNPJ)
   */
  findByDocument(document: string, tenantId: string): Promise<Person | null>;
  
  /**
   * Find all people with optional filtering
   */
  findAll(filters: PersonFilters): Promise<Person[]>;
  
  /**
   * Update person by ID
   */
  update(id: string, tenantId: string, updateData: Partial<Person>): Promise<Person | null>;
  
  /**
   * Delete person (soft delete)
   */
  delete(id: string, tenantId: string): Promise<boolean>;
  
  /**
   * Hard delete person
   */
  hardDelete(id: string, tenantId: string): Promise<boolean>;
  
  // ===== SEARCH OPERATIONS =====
  
  /**
   * Search people by name, email, document, or phone
   */
  search(query: string, tenantId: string, filters?: Partial<PersonFilters>): Promise<Person[]>;
  
  /**
   * Find people by person type
   */
  findByPersonType(personType: 'natural' | 'legal', tenantId: string): Promise<Person[]>;
  
  /**
   * Find people with specific tags
   */
  findByTags(tags: string[], tenantId: string): Promise<Person[]>;
  
  /**
   * Find people by location (city, state)
   */
  findByLocation(city?: string, state?: string, tenantId?: string): Promise<Person[]>;
  
  /**
   * Find people with birthdays in date range
   */
  findBirthdaysInRange(startDate: Date, endDate: Date, tenantId: string): Promise<Person[]>;
  
  /**
   * Find people by age range
   */
  findByAgeRange(minAge: number, maxAge: number, tenantId: string): Promise<Person[]>;
  
  // ===== VALIDATION OPERATIONS =====
  
  /**
   * Check if email exists
   */
  existsByEmail(email: string, tenantId: string, excludeId?: string): Promise<boolean>;
  
  /**
   * Check if document exists
   */
  existsByDocument(document: string, tenantId: string, excludeId?: string): Promise<boolean>;
  
  /**
   * Validate person data
   */
  validatePersonData(person: Partial<Person>): Promise<{
    isValid: boolean;
    errors: string[];
  }>;
  
  /**
   * Check duplicate potential
   */
  findPotentialDuplicates(person: Person): Promise<Person[]>;
  
  // ===== ANALYTICS OPERATIONS =====
  
  /**
   * Get person statistics
   */
  getStatistics(tenantId: string): Promise<PersonStatistics>;
  
  /**
   * Count people by filters
   */
  count(filters: PersonFilters): Promise<number>;
  
  /**
   * Get age distribution
   */
  getAgeDistribution(tenantId: string): Promise<Array<{
    ageRange: string;
    count: number;
    percentage: number;
  }>>;
  
  /**
   * Get location distribution
   */
  getLocationDistribution(tenantId: string): Promise<Array<{
    city: string;
    state: string;
    count: number;
  }>>;
  
  /**
   * Get popular tags
   */
  getPopularTags(tenantId: string, limit?: number): Promise<Array<{
    tag: string;
    count: number;
    percentage: number;
  }>>;
  
  /**
   * Get person type distribution
   */
  getPersonTypeDistribution(tenantId: string): Promise<Array<{
    personType: 'natural' | 'legal';
    count: number;
    percentage: number;
  }>>;
  
  // ===== BULK OPERATIONS =====
  
  /**
   * Create multiple people
   */
  createBulk(people: Person[]): Promise<Person[]>;
  
  /**
   * Update multiple people
   */
  updateBulk(updates: Array<{ id: string; tenantId: string; data: Partial<Person> }>): Promise<Person[]>;
  
  /**
   * Import people from data
   */
  importPeople(peopleData: Array<Partial<Person>>, tenantId: string, createdBy?: string): Promise<{
    success: Person[];
    errors: Array<{ row: number; error: string; data: Partial<Person> }>;
  }>;
  
  /**
   * Export people data
   */
  exportPeople(filters: PersonFilters): Promise<Person[]>;
  
  /**
   * Merge duplicate people
   */
  mergePeople(sourceId: string, targetId: string, tenantId: string, updatedBy?: string): Promise<Person>;
  
  // ===== CONTACT OPERATIONS =====
  
  /**
   * Find people without contact information
   */
  findWithoutContact(tenantId: string): Promise<Person[]>;
  
  /**
   * Find people without complete address
   */
  findWithoutCompleteAddress(tenantId: string): Promise<Person[]>;
  
  /**
   * Find people without documents
   */
  findWithoutDocuments(tenantId: string): Promise<Person[]>;
  
  /**
   * Update contact information
   */
  updateContactInfo(id: string, tenantId: string, contactInfo: {
    email?: string;
    phone?: string;
    cellPhone?: string;
    contactPerson?: string;
    contactPhone?: string;
  }, updatedBy?: string): Promise<Person | null>;
  
  /**
   * Update address information
   */
  updateAddress(id: string, tenantId: string, address: AddressInfo, updatedBy?: string): Promise<Person | null>;
  
  // ===== TAG OPERATIONS =====
  
  /**
   * Add tag to person
   */
  addTag(id: string, tenantId: string, tag: string, updatedBy?: string): Promise<boolean>;
  
  /**
   * Remove tag from person
   */
  removeTag(id: string, tenantId: string, tag: string, updatedBy?: string): Promise<boolean>;
  
  /**
   * Update person tags
   */
  updateTags(id: string, tenantId: string, tags: string[], updatedBy?: string): Promise<Person | null>;
  
  /**
   * Find all unique tags
   */
  getAllTags(tenantId: string): Promise<string[]>;
  
  /**
   * Rename tag across all people
   */
  renameTag(oldTag: string, newTag: string, tenantId: string, updatedBy?: string): Promise<number>;
  
  /**
   * Delete tag from all people
   */
  deleteTag(tag: string, tenantId: string, updatedBy?: string): Promise<number>;
  
  // ===== RELATIONSHIP OPERATIONS =====
  
  /**
   * Find related people (same address, phone, email domain, etc.)
   */
  findRelatedPeople(id: string, tenantId: string): Promise<Array<{
    person: Person;
    relationshipType: 'same_address' | 'same_phone' | 'same_email_domain' | 'same_company';
    similarity: number;
  }>>;
  
  /**
   * Find people in same company/family
   */
  findPeopleInSameGroup(id: string, tenantId: string): Promise<Person[]>;
  
  /**
   * Link related people
   */
  linkPeople(personId1: string, personId2: string, relationshipType: string, tenantId: string, createdBy?: string): Promise<boolean>;
  
  // ===== ACTIVITY OPERATIONS =====
  
  /**
   * Get person activity history
   */
  getPersonActivity(id: string, tenantId: string, limit?: number): Promise<Array<{
    action: string;
    timestamp: Date;
    userId?: string;
    details?: Record<string, any>;
  }>>;
  
  /**
   * Log person activity
   */
  logActivity(personId: string, tenantId: string, action: string, userId?: string, details?: Record<string, any>): Promise<void>;
  
  /**
   * Get recently created people
   */
  getRecentlyCreated(tenantId: string, days?: number, limit?: number): Promise<Person[]>;
  
  /**
   * Get recently updated people
   */
  getRecentlyUpdated(tenantId: string, days?: number, limit?: number): Promise<Person[]>;
}