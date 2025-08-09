
import { FieldLayout } from '../../domain/entities/FieldLayout';
import { IFieldLayoutRepository } from '../../domain/repositories/IFieldLayoutRepository';
import { FieldLayoutDomainService } from '../../domain/services/FieldLayoutDomainService';
import { createFieldLayoutCreatedEvent } from '../../domain/events/FieldLayoutCreatedEvent';

export interface CreateFieldLayoutCommand {
  tenantId: string;
  name: string;
  layout: any;
}

export class CreateFieldLayoutUseCase {
  constructor(
    private fieldLayoutRepository: IFieldLayoutRepository,
    private fieldLayoutDomainService: FieldLayoutDomainService
  ) {}

  async execute(command: CreateFieldLayoutCommand): Promise<FieldLayout> {
    const { tenantId, name, layout } = command;

    // Validate layout
    if (!this.fieldLayoutDomainService.validateLayout(layout)) {
      throw new Error('Invalid layout structure');
    }

    // Create field layout
    const fieldLayout = new FieldLayout({
      id: crypto.randomUUID(),
      tenantId,
      name: this.fieldLayoutDomainService.generateLayoutName(tenantId, name),
      layout,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await this.fieldLayoutRepository.save(fieldLayout);

    // Emit domain event
    const event = createFieldLayoutCreatedEvent(
      fieldLayout.id,
      tenantId,
      name,
      layout
    );
    console.log('Field layout created:', event);

    return fieldLayout;
  }
}
