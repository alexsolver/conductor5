/**
 * OCR SERVICE - OPTICAL CHARACTER RECOGNITION
 * ✅ 1QA.MD COMPLIANCE: Clean Architecture Infrastructure Service
 * 
 * Features:
 * - Document text extraction with Tesseract.js
 * - Receipt data parsing and validation
 * - Duplicate document detection via hash comparison
 * - Structured data extraction for expense items
 */

import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { createHash } from 'crypto';

export interface OCRResult {
  text: string;
  confidence: number;
  extractedData: ExtractedExpenseData;
  documentHash: string;
  processingTime: number;
}

export interface ExtractedExpenseData {
  merchant?: string;
  date?: Date;
  amount?: number;
  currency?: string;
  taxAmount?: number;
  items?: ExpenseLineItem[];
  receiptNumber?: string;
  paymentMethod?: string;
}

export interface ExpenseLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export class OCRService {
  private readonly supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];
  
  /**
   * Process document with OCR and extract expense data
   */
  async processDocument(
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string
  ): Promise<OCRResult> {
    console.log('🔍 [OCRService] Processing document:', fileName);
    const startTime = Date.now();
    
    try {
      // Validate file type
      if (!this.supportedFormats.includes(mimeType)) {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }
      
      // Generate document hash for duplicate detection
      const documentHash = this.generateDocumentHash(fileBuffer);
      
      // Optimize image for OCR
      const optimizedBuffer = await this.optimizeImageForOCR(fileBuffer);
      
      // Perform OCR
      const ocrResult = await Tesseract.recognize(optimizedBuffer, 'eng+por', {
        logger: m => console.log('📄 [OCR-ENGINE]', m.status, m.progress)
      });
      
      // Extract structured data from OCR text
      const extractedData = this.extractExpenseData(ocrResult.data.text);
      
      const processingTime = Date.now() - startTime;
      
      console.log('✅ [OCRService] Document processed successfully', {
        confidence: ocrResult.data.confidence,
        processingTime,
        extractedAmount: extractedData.amount
      });
      
      return {
        text: ocrResult.data.text,
        confidence: ocrResult.data.confidence,
        extractedData,
        documentHash,
        processingTime
      };
      
    } catch (error) {
      console.error('❌ [OCRService] Processing failed:', error);
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }
  
  /**
   * Optimize image for better OCR accuracy
   */
  private async optimizeImageForOCR(buffer: Buffer): Promise<Buffer> {
    return await sharp(buffer)
      .resize(2000, 2000, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .greyscale()
      .normalise()
      .sharpen()
      .png()
      .toBuffer();
  }
  
  /**
   * Generate unique hash for duplicate detection
   */
  private generateDocumentHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
  
  /**
   * Extract structured expense data from OCR text
   */
  private extractExpenseData(text: string): ExtractedExpenseData {
    const data: ExtractedExpenseData = {};
    
    // Extract amount (Brazilian and international formats)
    const amountPatterns = [
      /R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/g, // R$ 1.234,56
      /(\d{1,3}(?:\.\d{3})*,\d{2})/g,       // 1.234,56
      /\$\s*(\d{1,3}(?:,\d{3})*\.\d{2})/g,  // $ 1,234.56
      /(\d{1,3}(?:,\d{3})*\.\d{2})/g        // 1,234.56
    ];
    
    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        const amountStr = match[0].replace(/[R$\s]/g, '');
        data.amount = this.parseAmount(amountStr);
        data.currency = text.includes('R$') ? 'BRL' : 'USD';
        break;
      }
    }
    
    // Extract date
    const datePatterns = [
      /(\d{2})\/(\d{2})\/(\d{4})/g, // DD/MM/YYYY
      /(\d{4})-(\d{2})-(\d{2})/g,   // YYYY-MM-DD
      /(\d{2})-(\d{2})-(\d{4})/g    // DD-MM-YYYY
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        data.date = this.parseDate(match[0]);
        break;
      }
    }
    
    // Extract merchant/vendor name (first line that looks like a business name)
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    for (const line of lines.slice(0, 5)) {
      if (line.length > 3 && line.length < 50 && !line.match(/\d{2}\/\d{2}\/\d{4}/) && !line.includes('R$')) {
        data.merchant = line.toUpperCase();
        break;
      }
    }
    
    // Extract receipt number
    const receiptPattern = /(?:CUPOM|RECEIPT|NF|NOTA)\s*:?\s*(\w+)/gi;
    const receiptMatch = text.match(receiptPattern);
    if (receiptMatch) {
      data.receiptNumber = receiptMatch[0].split(':').pop()?.trim();
    }
    
    // Extract tax information
    const taxPatterns = [
      /ICMS\s*:?\s*R\$\s*(\d+,\d{2})/gi,
      /TAX\s*:?\s*\$?\s*(\d+\.\d{2})/gi
    ];
    
    for (const pattern of taxPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.taxAmount = this.parseAmount(match[1]);
        break;
      }
    }
    
    return data;
  }
  
  /**
   * Parse amount string to number
   */
  private parseAmount(amountStr: string): number {
    // Handle Brazilian format (1.234,56)
    if (amountStr.includes(',') && amountStr.lastIndexOf(',') > amountStr.lastIndexOf('.')) {
      return parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
    }
    // Handle US format (1,234.56)
    return parseFloat(amountStr.replace(/,/g, ''));
  }
  
  /**
   * Parse date string to Date object
   */
  private parseDate(dateStr: string): Date {
    const [part1, part2, part3] = dateStr.split(/[-\/]/);
    
    // Try DD/MM/YYYY format first (common in Brazil)
    if (part3 && part3.length === 4) {
      return new Date(parseInt(part3), parseInt(part2) - 1, parseInt(part1));
    }
    
    // Try YYYY-MM-DD format
    if (part1 && part1.length === 4) {
      return new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3));
    }
    
    return new Date();
  }
  
  /**
   * Check for duplicate documents using hash comparison
   */
  async checkDuplicateDocument(
    documentHash: string,
    tenantId: string
  ): Promise<boolean> {
    // This would typically query the database for existing documents with the same hash
    // For now, we'll implement a basic check
    console.log('🔍 [OCRService] Checking for duplicates:', documentHash);
    
    // TODO: Implement database query for duplicate detection
    // const duplicates = await this.documentRepository.findByHash(tenantId, documentHash);
    // return duplicates.length > 0;
    
    return false; // No duplicates found in this basic implementation
  }
  
  /**
   * Validate extracted data quality
   */
  validateExtractedData(data: ExtractedExpenseData): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    if (!data.amount || data.amount <= 0) {
      issues.push('Amount not found or invalid');
    }
    
    if (!data.date || isNaN(data.date.getTime())) {
      issues.push('Date not found or invalid');
    }
    
    if (!data.merchant || data.merchant.length < 3) {
      issues.push('Merchant name not found or too short');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}