// ✅ 1QA.MD COMPLIANCE: MODERN RICH TEXT EDITOR - NO findDOMNode
// Editor moderno sem dependência de ReactQuill para evitar warnings

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link, Quote, Code, Undo, Redo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ModernRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  'data-testid'?: string;
}

export const ModernRichTextEditor: React.FC<ModernRichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Digite o conteúdo...',
  readOnly = false,
  className = '',
  'data-testid': testId,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isInternalUpdate, setIsInternalUpdate] = useState(false);

  // Update editor content when value changes
  useEffect(() => {
    if (!editorRef.current || isInternalUpdate) return;
    
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value, isInternalUpdate]);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (!editorRef.current || readOnly) return;
    
    setIsInternalUpdate(true);
    const content = editorRef.current.innerHTML;
    onChange(content);
    
    // Reset flag after a brief delay
    setTimeout(() => setIsInternalUpdate(false), 0);
  }, [onChange, readOnly]);

  // Toolbar command execution
  const executeCommand = useCallback((command: string, value?: string) => {
    if (readOnly) return;
    
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [readOnly, handleInput]);

  // Formatting functions
  const formatText = {
    bold: () => executeCommand('bold'),
    italic: () => executeCommand('italic'),
    underline: () => executeCommand('underline'),
    insertUnorderedList: () => executeCommand('insertUnorderedList'),
    insertOrderedList: () => executeCommand('insertOrderedList'),
    createLink: () => {
      const url = prompt('Digite a URL:');
      if (url) executeCommand('createLink', url);
    },
    formatBlock: (tag: string) => executeCommand('formatBlock', tag),
    insertHTML: (html: string) => executeCommand('insertHTML', html),
    undo: () => executeCommand('undo'),
    redo: () => executeCommand('redo'),
  };

  return (
    <div className="border rounded-lg bg-background ">
      {!readOnly && (
        <div className="flex items-center gap-1 p-2 border-b bg-muted/30>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatText.bold}
            title="Negrito (Ctrl+B)"
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatText.italic}
            title="Itálico (Ctrl+I)"
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatText.underline}
            title="Sublinhado (Ctrl+U)"
            className="h-8 w-8 p-0"
          >
            <Underline className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatText.insertUnorderedList}
            title="Lista com marcadores"
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatText.insertOrderedList}
            title="Lista numerada"
            className="h-8 w-8 p-0"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatText.createLink}
            title="Inserir link"
            className="h-8 w-8 p-0"
          >
            <Link className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText.formatBlock('blockquote')}
            title="Citação"
            className="h-8 w-8 p-0"
          >
            <Quote className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText.formatBlock('pre')}
            title="Código"
            className="h-8 w-8 p-0"
          >
            <Code className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatText.undo}
            title="Desfazer (Ctrl+Z)"
            className="h-8 w-8 p-0"
          >
            <Undo className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatText.redo}
            title="Refazer (Ctrl+Y)"
            className="h-8 w-8 p-0"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleInput}
        className="min-h-[200px] p-4 prose prose-sm max-w-none focus:outline-none"
        style={{
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
        }}
        data-placeholder={placeholder}
        data-testid={testId}
        suppressContentEditableWarning={true}
      />
      
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        [contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin-left: 0;
          font-style: italic;
        }
        
        [contenteditable] pre {
          background-color: #f3f4f6;
          padding: 0.5rem;
          border-radius: 0.25rem;
          overflow-x: auto;
          font-family: monospace;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 1.5rem;
        }
        
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
      "</style>
    </div>
  );
};