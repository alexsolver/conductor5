
export interface CreateTemplateVersionDTO {
  templateId: string;
  version: string;
  content: any;
  changelog?: string;
}
