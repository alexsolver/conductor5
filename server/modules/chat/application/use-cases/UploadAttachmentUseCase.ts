import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { chatMessages } from '@shared/schema-chat';
import { createId } from '@paralleldrive/cuid2';
import { Storage } from '@google-cloud/storage';
import path from 'path';

interface UploadAttachmentInput {
  chatId: string;
  senderId: string;
  senderType: 'agent' | 'customer' | 'system';
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
  tenantId: string;
}

interface UploadAttachmentOutput {
  id: string;
  url: string;
  filename: string;
  fileType: string;
  fileSize: number;
  messageId: string;
}

export class UploadAttachmentUseCase {
  constructor(private db: NodePgDatabase<any>) {}

  async execute(input: UploadAttachmentInput): Promise<UploadAttachmentOutput> {
    const { chatId, senderId, senderType, file, tenantId } = input;

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('File type not allowed');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Initialize Google Cloud Storage
    const storage = new Storage();
    const bucketName = process.env.PRIVATE_OBJECT_DIR?.split('/')[1] || 'default-bucket';
    const bucket = storage.bucket(bucketName);

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `chat-attachments/${chatId}/${createId()}${ext}`;

    // Upload to Object Storage
    const blob = bucket.file(filename);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
      },
    });

    await new Promise<void>((resolve, reject) => {
      blobStream.on('error', reject);
      blobStream.on('finish', resolve);
      blobStream.end(file.buffer);
    });

    // Make file publicly accessible
    await blob.makePublic();
    const url = `https://storage.googleapis.com/${bucketName}/${filename}`;

    // Determine message type based on MIME type
    let messageType: 'text' | 'file' | 'image' | 'system' = 'file';
    if (file.mimetype.startsWith('image/')) {
      messageType = 'image';
    }

    // Create message with attachment
    const [message] = await this.db
      .insert(chatMessages)
      .values({
        chatId,
        senderId,
        senderType,
        type: messageType,
        content: `Sent ${file.mimetype.startsWith('image/') ? 'an image' : 'a file'}: ${file.originalname}`,
        attachmentUrl: url,
        attachmentType: file.mimetype,
        attachmentName: file.originalname,
        status: 'sent',
      })
      .returning();

    return {
      id: message.id,
      url: message.attachmentUrl!,
      filename: message.attachmentName!,
      fileType: message.attachmentType!,
      fileSize: file.size,
      messageId: message.id,
    };
  }
}
