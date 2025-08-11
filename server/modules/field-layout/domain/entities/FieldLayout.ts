
export interface FieldLayoutProps {
  id: string;
  tenantId: string;
  name: string;
  layout: any;
  isActive: boolean;
  createdAt: Date;
  modifiedAt: Date;
}

export class FieldLayout {
  constructor(private props: FieldLayoutProps) {}

  get id(): string {
    return this.props.id;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get layout(): any {
    return this.props.layout;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get modifiedAt(): Date {
    return this.props.modifiedAt;
  }

  public changeLayout(layout: any): void {
    this.props.layout = layout;
    this.props.modifiedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
  }

  public deactivate(): void {
    this.props.isActive = false;
  }
}
