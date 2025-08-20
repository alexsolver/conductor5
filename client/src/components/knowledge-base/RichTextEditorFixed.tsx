import React, { useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Digite o conteúdo do artigo...",
  className = "",
  readOnly = false
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.max(300, textareaRef.current.scrollHeight) + 'px';
    }
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  if (readOnly) {
    return (
      <div
        className="prose prose-sm max-w-none min-h-[300px] p-4 border rounded-md bg-gray-50 ""
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className="rich-text-editor ">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className="min-h-[300px] resize-none border rounded-md bg-white font-mono"
        data-testid="textarea-content"
      />
      
      {/* Rich Text Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 border-x border-b rounded-b-md bg-gray-50>
        <div className="text-xs text-gray-500>
          Dica: Use markdown para formatação (ex: **negrito**, *itálico*, # Título)
        </div>
      </div>
    </div>
  );
}