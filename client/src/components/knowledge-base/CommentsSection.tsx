// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE FRONTEND - COMMENTS COMPONENT
// React component for article comments following design patterns

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, Reply, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// import { useLocalization } from '@/hooks/useLocalization';

interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorId: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  parentId?: string;
  replies?: Comment[];
}

interface CommentsSectionProps {
  articleId: string;
}

export function CommentsSection({
  // Localization temporarily disabled
 articleId }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar comentários do artigo
  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ['/api/knowledge-base/articles', articleId, 'comments'],
    queryFn: async () => {
      const response = await fetch(`/api/knowledge-base/articles/${articleId}/comments`, {
        headers: {
          'x-tenant-id': localStorage.getItem('tenantId') || '',
          'x-user-id': localStorage.getItem('userId') || '',
        }
      });
      const result = await response.json();
      return result.success ? result.data : [];
    }
  });

  // Mutação para criar comentário
  const createCommentMutation = useMutation({
    mutationFn: async (commentData: { content: string; parentId?: string }) => {
      return await apiRequest(`/api/knowledge-base/articles/${articleId}/comments`, 'POST', commentData);
    },
    onSuccess: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Comentário adicionado com sucesso"
      });
      setNewComment('');
      setReplyContent('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ 
        queryKey: ['/api/knowledge-base/articles', articleId, 'comments'] 
      });
    },
    onError: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: '[TRANSLATION_NEEDED]',
        variant: "destructive"
      });
    }
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    createCommentMutation.mutate({ content: newComment });
  };

  const handleReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    createCommentMutation.mutate({ content: replyContent, parentId });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <Card key={comment.id} className={`${isReply ? 'ml-8 mt-2' : 'mb-4'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{comment.authorName}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
                {comment.isEdited && ' • editado'}
              </p>
            </div>
          </div>
          
          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              data-testid={`button-reply-${comment.id}`}
            >
              <Reply className="h-4 w-4" />
              Responder
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm whitespace-pre-wrap" data-testid={`comment-content-${comment.id}`}>
          {comment.content}
        </p>
        
        {replyingTo === comment.id && (
          <div className="mt-4 space-y-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Escreva sua resposta..."
              rows={3}
              data-testid={`input-reply-${comment.id}`}
            />
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleReply(comment.id)}
                disabled={createCommentMutation.isPending}
                data-testid={`button-send-reply-${comment.id}`}
              >
                <Send className="h-4 w-4 mr-2" />
                Responder
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
                data-testid={`button-cancel-reply-${comment.id}`}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
        
        {/* Renderizar respostas */}
        {comment.replies?.map((reply) => renderComment(reply, true))}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <MessageCircle className="h-5 w-5 mr-2" />
          Comentários
        </h3>
        <div className="text-center text-muted-foreground">
          Carregando comentários...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="comments-section">
      <h3 className="text-lg font-semibold flex items-center">
        <MessageCircle className="h-5 w-5 mr-2" />
        Comentários ({comments.length})
      </h3>

      {/* Formulário para novo comentário */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Adicione um comentário..."
              rows={3}
              data-testid="input-new-comment"
            />
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || createCommentMutation.isPending}
              data-testid="button-add-comment"
            >
              <Send className="h-4 w-4 mr-2" />
              {createCommentMutation.isPending ? 'Enviando...' : 'Comentar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de comentários */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Seja o primeiro a comentar</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          comments
            .filter(comment => !comment.parentId) // Apenas comentários principais
            .map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  );
}