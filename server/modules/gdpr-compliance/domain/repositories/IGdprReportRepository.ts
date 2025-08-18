/**
 * GDPR Report Repository Interface - Domain Layer
 * Clean Architecture - Repository abstraction
 * Following 1qa.md enterprise patterns
 */

import { GdprReportEntity } from '../entities/GdprReport';

export interface IGdprReportRepository {
  // Basic CRUD operations
  findById(id: string, tenantId: string): Promise<GdprReportEntity | null>;
  findByTenantId(tenantId: string, filters?: GdprReportFilters): Promise<GdprReportEntity[]>;
  create(report: CreateGdprReportData): Promise<GdprReportEntity>;
  update(id: string, data: UpdateGdprReportData, tenantId: string): Promise<GdprReportEntity>;
  delete(id: string, tenantId: string, deletedBy: string): Promise<void>;
  
  // Advanced queries
  findByStatus(status: string, tenantId: string): Promise<GdprReportEntity[]>;
  findByType(reportType: string, tenantId: string): Promise<GdprReportEntity[]>;
  findByAssignedUser(userId: string, tenantId: string): Promise<GdprReportEntity[]>;
  findOverdueReports(tenantId: string): Promise<GdprReportEntity[]>;
  findHighRiskReports(tenantId: string): Promise<GdprReportEntity[]>;
  
  // Analytics
  getComplianceMetrics(tenantId: string): Promise<GdprComplianceMetrics>;
  getReportStatusDistribution(tenantId: string): Promise<StatusDistribution[]>;
  getTrendData(tenantId: string, days: number): Promise<TrendDataPoint[]>;
}

export interface GdprReportFilters {
  status?: string[];
  reportType?: string[];
  priority?: string[];
  riskLevel?: string[];
  assignedUserId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateGdprReportData {
  title: string;
  description?: string;
  reportType: string;
  priority: string;
  riskLevel?: string;
  reportData?: Record<string, any>;
  assignedUserId?: string;
  dueDate?: Date;
  createdBy: string;
  tenantId: string;
}

export interface UpdateGdprReportData {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  riskLevel?: string;
  reportData?: Record<string, any>;
  findings?: Record<string, any>;
  actionItems?: Record<string, any>;
  complianceScore?: number;
  assignedUserId?: string;
  reviewerUserId?: string;
  approverUserId?: string;
  dueDate?: Date;
  nextReviewDate?: Date;
  updatedBy: string;
}

export interface GdprComplianceMetrics {
  totalReports: number;
  activeReports: number;
  completedReports: number;
  overdueReports: number;
  averageComplianceScore: number;
  highRiskReports: number;
  reportsThisMonth: number;
  reportsLastMonth: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface TrendDataPoint {
  date: string;
  reportsCreated: number;
  reportsCompleted: number;
  averageScore: number;
}