import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"
import { Separator } from "./ui/separator"
import { 
  Bold, 
  Italic, 
  List,
  ListOrdered,
  Quote,
  Image as ImageIcon,
  Link as LinkIcon,
  Heading2
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Input } from "./ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Label } from "./ui/label"

interface TicketDescriptionEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function TicketDescriptionEditor({ content, onChange, placeholder }: TicketDescriptionEditorProps) {
  const [linkUrl, setLinkUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Function to convert file to base64 data URL
  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Handle paste events for image insertion
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!textareaRef.current || document.activeElement !== textareaRef.current) return
      
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            try {
              const dataURL = await fileToDataURL(file)
              const markdownImage = `![Imagem colada](${dataURL})`
              console.log('Inserindo imagem colada via Ctrl+V')
              insertAtCursor(markdownImage)
            } catch (error) {
              console.error('Erro ao processar imagem colada:', error)
            }
          }
          break
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  const insertAtCursor = (text: string) => {
    if (!textareaRef.current) {
      console.log('Textarea ref não encontrado')
      return
    }
    
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = content || ''
    
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end)
    console.log('Inserindo texto:', text, 'Posição:', start, 'Novo valor:', newValue.substring(0, 100) + '...')
    onChange(newValue)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }

  const wrapSelection = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return
    
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = content || ''
    const selectedText = currentValue.substring(start, end)
    
    const newText = prefix + selectedText + suffix
    const newValue = currentValue.substring(0, start) + newText + currentValue.substring(end)
    onChange(newValue)
    
    setTimeout(() => {
      textarea.focus()
      if (selectedText) {
        textarea.setSelectionRange(start + prefix.length, end + prefix.length)
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length)
      }
    }, 0)
  }

  const addImage = () => {
    if (imageUrl.trim()) {
      const markdownImage = `![Imagem](${imageUrl.trim()})`
      console.log('Inserindo imagem:', markdownImage)
      insertAtCursor(markdownImage)
      setImageUrl('')
      setShowImageDialog(false)
    } else {
      console.log('URL da imagem está vazia')
    }
  }

  const addLink = () => {
    if (linkUrl) {
      const markdownLink = `[${linkUrl}](${linkUrl})`
      insertAtCursor(markdownLink)
      setLinkUrl('')
      setShowLinkDialog(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1 bg-gray-50">
        {/* Text Formatting */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => wrapSelection('**', '**')}
          type="button"
          title="Negrito"
        >
          <Bold className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => wrapSelection('*', '*')}
          type="button"
          title="Itálico"
        >
          <Italic className="h-3 w-3" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Heading */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertAtCursor('## ')}
          type="button"
          title="Cabeçalho"
        >
          <Heading2 className="h-3 w-3" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertAtCursor('- ')}
          type="button"
          title="Lista"
        >
          <List className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertAtCursor('1. ')}
          type="button"
          title="Lista Numerada"
        >
          <ListOrdered className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertAtCursor('> ')}
          type="button"
          title="Citação"
        >
          <Quote className="h-3 w-3" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Media & Links */}
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" type="button">
              <ImageIcon className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inserir Imagem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="imageUrl">URL da Imagem</Label>
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
              <div>
                <Label htmlFor="imageFile">Ou selecione um arquivo</Label>
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      try {
                        const dataURL = await fileToDataURL(file)
                        const markdownImage = `![${file.name}](${dataURL})`
                        console.log('Inserindo imagem do arquivo:', file.name)
                        insertAtCursor(markdownImage)
                        setShowImageDialog(false)
                      } catch (error) {
                        console.error('Erro ao processar arquivo:', error)
                      }
                    }
                  }}
                />
              </div>
              <Button 
                onClick={addImage} 
                className="w-full" 
                type="button"
                disabled={!imageUrl.trim()}
              >
                Inserir da URL
              </Button>
              <p className="text-sm text-gray-500">
                💡 Dica: Você também pode colar imagens diretamente com Ctrl+V
              </p>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" type="button">
              <LinkIcon className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inserir Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="linkUrl">URL do Link</Label>
                <Input
                  id="linkUrl"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://exemplo.com"
                />
              </div>
              <Button onClick={addLink} className="w-full" type="button">
                Inserir Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>

      {/* Editor Content */}
      <div className="min-h-[120px] max-h-[300px] overflow-y-auto relative">
        <Textarea
          ref={textareaRef}
          value={content || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Digite a descrição... (Cole imagens com Ctrl+V)"}
          className="min-h-[120px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-3"
        />
      </div>
    </div>
  )
}