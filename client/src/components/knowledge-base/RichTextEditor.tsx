// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE RICH TEXT EDITOR - CLEAN ARCHITECTURE
// Presentation layer component with TipTap integration

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Underline, List, ListOrdered, Link, Image, Code, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function RichTextEditor({ content, onChange, placeholder, readOnly = false }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4 border rounded-md',
      },
    },
  });

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive, 
    icon: Icon, 
    tooltip 
  }: { 
    onClick: () => void; 
    isActive: boolean; 
    icon: React.ElementType; 
    tooltip: string;
  }) => (
    <Toggle 
      pressed={isActive}
      onPressedChange={onClick}
      size="sm"
      title={tooltip}
      data-testid={`editor-${tooltip.toLowerCase().replace(' ', '-')}`}
    >
      <Icon className="h-4 w-4" />
    </Toggle>
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      {!readOnly && (
        <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            icon={Bold}
            tooltip="Bold"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            icon={Italic}
            tooltip="Italic"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            icon={Underline}
            tooltip="Strikethrough"
          />
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            icon={List}
            tooltip="Bullet List"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            icon={ListOrdered}
            tooltip="Numbered List"
          />
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            icon={Quote}
            tooltip="Quote"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            icon={Code}
            tooltip="Inline Code"
          />
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = window.prompt('Enter URL:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            data-testid="editor-link"
          >
            <Link className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = window.prompt('Enter image URL:');
              if (url) {
                // For now, insert as markdown-style image
                editor.chain().focus().insertContent(`![image](${url})`).run();
              }
            }}
            data-testid="editor-image"
          >
            <Image className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <EditorContent 
        editor={editor} 
        className={`min-h-[200px] ${readOnly ? 'p-4' : ''}`}
        data-testid="rich-text-editor-content"
      />
      
      {placeholder && !content && !readOnly && (
        <div className="absolute top-[60px] left-4 text-muted-foreground pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  );
}