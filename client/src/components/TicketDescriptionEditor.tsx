// ✅ 1QA.MD COMPLIANCE: TICKET DESCRIPTION EDITOR - Clean Architecture
// ModernRichTextEditor sem findDOMNode

import React from 'react';
import { ModernRichTextEditor } from './knowledge-base/ModernRichTextEditor';

interface TicketDescriptionEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function TicketDescriptionEditor({
  content,
  onChange,
  placeholder = "Digite a descrição do ticket...",
  readOnly = false
}: TicketDescriptionEditorProps) {
  if (readOnly) {
    return (
      <div
        className="prose prose-sm max-w-none min-h-[200px] p-4 border rounded-md bg-gray-50"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className="ticket-description-editor>
      <ModernRichTextEditor
        value={content}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className="min-h-[200px]"
        data-testid="ticket-description-editor"
      />
    </div>
  );
}