import React, { useRef } from 'react';
import ReactQuill from 'react-quill';
// Suprimir warning temporariamente até ReactQuill atualizar
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('findDOMNode')) {
    return;
  }
  originalError.call(console, ...args);
};
import 'react-quill/dist/quill.snow.css';
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
        className="prose prose-sm max-w-none min-h-[300px] p-4 border rounded-md bg-gray-50 ""
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return (
    <div className="text-lg">"
      <ReactQuill
        theme="snow"
        value={content}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{
          minHeight: '300px',
        }}
        className="border rounded-md bg-white"
      />
    </div>
  );
}