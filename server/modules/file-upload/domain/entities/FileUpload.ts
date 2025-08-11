/**
 * FileUpload Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for file upload management
 */

interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number; // for video/audio files
  pages?: number; // for PDF files
  encoding?: string;
  contentHash?: string; // SHA-256 hash for integrity
}

interface SecurityScan {
  scanDate: Date;
  scanResult: 'clean' | 'suspicious' | 'malicious' | 'error';
  threats: string[];
  scanEngine: string;
}

export class FileUpload {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private originalName: string,
    private filename: string, // sanitized filename
    private mimeType: string,
    private size: number,
    private path: string, // storage path
    private description: string = '',
    private category: string = 'general',
    private tags: string[] = [],
    private uploadedById: string,
    private uploadedByName: string,
    private isPublic: boolean = false,
    private status: 'uploading' | 'processing' | 'ready' | 'failed' | 'quarantined' | 'deleted' = 'uploading',
    private metadata: FileMetadata = {},
    private securityScan: SecurityScan | null = null,
    private downloadCount: number = 0,
    private lastAccessedAt: Date | null = null,
    private expiresAt: Date | null = null,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {
    this.validateFile();
  }

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getOriginalName(): string { return this.originalName; }
  getFilename(): string { return this.filename; }
  getMimeType(): string { return this.mimeType; }
  getSize(): number { return this.size; }
  getPath(): string { return this.path; }
  getDescription(): string { return this.description; }
  getCategory(): string { return this.category; }
  getTags(): string[] { return [...this.tags]; }
  getUploadedById(): string { return this.uploadedById; }
  getUploadedByName(): string { return this.uploadedByName; }
  isFilePublic(): boolean { return this.isPublic; }
  getStatus(): 'uploading' | 'processing' | 'ready' | 'failed' | 'quarantined' | 'deleted' { return this.status; }
  getMetadata(): FileMetadata { return { ...this.metadata }; }
  getSecurityScan(): SecurityScan | null { return this.securityScan; }
  getDownloadCount(): number { return this.downloadCount; }
  getLastAccessedAt(): Date | null { return this.lastAccessedAt; }
  getExpiresAt(): Date | null { return this.expiresAt; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business methods
  updateDescription(description: string): void {
    if (this.status === 'deleted') {
      throw new Error('Cannot update deleted file');
    }
    
    this.description = description.trim();
    this.updatedAt = new Date();
  }

  updateCategory(category: string): void {
    if (this.status === 'deleted') {
      throw new Error('Cannot update deleted file');
    }
    
    this.category = category.trim();
    this.updatedAt = new Date();
  }

  addTag(tag: string): void {
    if (this.status === 'deleted') {
      throw new Error('Cannot update deleted file');
    }
    
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag && !this.tags.includes(normalizedTag)) {
      this.tags.push(normalizedTag);
      this.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    if (this.status === 'deleted') {
      throw new Error('Cannot update deleted file');
    }
    
    const normalizedTag = tag.trim().toLowerCase();
    this.tags = this.tags.filter(t => t !== normalizedTag);
    this.updatedAt = new Date();
  }

  makePublic(): void {
    if (this.status === 'deleted' || this.status === 'quarantined') {
      throw new Error('Cannot make deleted or quarantined file public');
    }
    
    this.isPublic = true;
    this.updatedAt = new Date();
  }

  makePrivate(): void {
    if (this.status === 'deleted') {
      throw new Error('Cannot update deleted file');
    }
    
    this.isPublic = false;
    this.updatedAt = new Date();
  }

  markAsProcessing(): void {
    if (this.status !== 'uploading') {
      throw new Error('Can only mark uploading files as processing');
    }
    
    this.status = 'processing';
    this.updatedAt = new Date();
  }

  markAsReady(): void {
    if (this.status !== 'processing' && this.status !== 'uploading') {
      throw new Error('Can only mark processing or uploading files as ready');
    }
    
    this.status = 'ready';
    this.updatedAt = new Date();
  }

  markAsFailed(reason?: string): void {
    if (this.status === 'deleted') {
      throw new Error('Cannot update deleted file');
    }
    
    this.status = 'failed';
    if (reason) {
      this.metadata = { ...this.metadata, failure_reason: reason };
    }
    this.updatedAt = new Date();
  }

  quarantine(reason: string): void {
    if (this.status === 'deleted') {
      throw new Error('Cannot quarantine deleted file');
    }
    
    this.status = 'quarantined';
    this.isPublic = false; // Quarantined files should not be public
    this.metadata = { ...this.metadata, quarantine_reason: reason };
    this.updatedAt = new Date();
  }

  delete(): void {
    this.status = 'deleted';
    this.isPublic = false;
    this.updatedAt = new Date();
  }

  setExpiration(expiresAt: Date): void {
    if (this.status === 'deleted') {
      throw new Error('Cannot set expiration for deleted file');
    }
    
    if (expiresAt <= new Date()) {
      throw new Error('Expiration date must be in the future');
    }
    
    this.expiresAt = expiresAt;
    this.updatedAt = new Date();
  }

  removeExpiration(): void {
    this.expiresAt = null;
    this.updatedAt = new Date();
  }

  updateMetadata(metadata: Partial<FileMetadata>): void {
    if (this.status === 'deleted') {
      throw new Error('Cannot update deleted file');
    }
    
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date();
  }

  updateSecurityScan(scan: SecurityScan): void {
    this.securityScan = scan;
    
    // Auto-quarantine if malicious
    if (scan.scanResult === 'malicious') {
      this.quarantine('Malicious content detected during security scan');
    }
    
    this.updatedAt = new Date();
  }

  incrementDownloadCount(): void {
    if (this.status !== 'ready') {
      throw new Error('Cannot download files that are not ready');
    }
    
    this.downloadCount++;
    this.lastAccessedAt = new Date();
    this.updatedAt = new Date();
  }

  // Private validation
  private validateFile(): void {
    if (!this.originalName || !this.filename) {
      throw new Error('File name cannot be empty');
    }
    
    if (this.size <= 0) {
      throw new Error('File size must be greater than 0');
    }
    
    if (this.size > this.getMaxFileSize()) {
      throw new Error(`File size exceeds maximum allowed size of ${this.getMaxFileSize()} bytes`);
    }
    
    if (!this.isAllowedMimeType()) {
      throw new Error(`File type ${this.mimeType} is not allowed`);
    }
  }

  // Business queries
  isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }

  isVideo(): boolean {
    return this.mimeType.startsWith('video/');
  }

  isAudio(): boolean {
    return this.mimeType.startsWith('audio/');
  }

  isDocument(): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];
    return documentTypes.includes(this.mimeType);
  }

  isArchive(): boolean {
    const archiveTypes = [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-tar',
      'application/gzip'
    ];
    return archiveTypes.includes(this.mimeType);
  }

  isReady(): boolean {
    return this.status === 'ready';
  }

  isProcessing(): boolean {
    return this.status === 'processing' || this.status === 'uploading';
  }

  isFailed(): boolean {
    return this.status === 'failed';
  }

  isQuarantined(): boolean {
    return this.status === 'quarantined';
  }

  isDeleted(): boolean {
    return this.status === 'deleted';
  }

  isExpired(): boolean {
    return this.expiresAt !== null && this.expiresAt <= new Date();
  }

  isAccessible(): boolean {
    return this.isReady() && !this.isExpired() && !this.isQuarantined() && !this.isDeleted();
  }

  hasSecurityScan(): boolean {
    return this.securityScan !== null;
  }

  isSecure(): boolean {
    return this.securityScan?.scanResult === 'clean';
  }

  getFileExtension(): string {
    const parts = this.originalName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  getFileSizeFormatted(): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (this.size === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(this.size) / Math.log(1024));
    return Math.round(this.size / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag.toLowerCase());
  }

  getMaxFileSize(): number {
    // 100MB default max size
    return 100 * 1024 * 1024;
  }

  private isAllowedMimeType(): boolean {
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Documents
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      // Media
      'video/mp4', 'video/avi', 'video/mov', 'audio/mp3', 'audio/wav',
      // Archives
      'application/zip', 'application/x-rar-compressed'
    ];
    
    return allowedTypes.includes(this.mimeType);
  }

  getDownloadUrl(): string {
    if (!this.isAccessible()) {
      throw new Error('File is not accessible for download');
    }
    
    // URL would be generated by infrastructure layer
    return `/api/files/${this.id}/download`;
  }

  getThumbnailUrl(): string | null {
    if (!this.isImage() || !this.isAccessible()) {
      return null;
    }
    
    return `/api/files/${this.id}/thumbnail`;
  }
}