import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image', 'blockquote', 'code-block'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'link', 'image', 'blockquote',
    'code-block', 'color', 'background'
  ];

  if (readOnly) {
    return (
      <div
        className="prose prose-sm max-w-none min-h-[200px] p-4 border rounded-md bg-gray-50"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className="ticket-description-editor">
      <ReactQuill
        theme="snow"
        value={content}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{
          minHeight: '200px',
        }}
        className="border rounded-md bg-white"
      />
    </div>
  );
}