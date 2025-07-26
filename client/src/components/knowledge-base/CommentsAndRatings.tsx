/**
 * Comments and Ratings Component for Knowledge Base
 * Advanced commenting system with nested replies and ratings
 */

import { useState } from 'react'
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { Textarea } from "../ui/textarea"
import { 
  Star,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Reply,
  MoreVertical,
  Flag,
  Edit,
  Trash2,
  Heart
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Separator } from "../ui/separator"

interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
    avatar?: string
    role: string
  }
  createdAt: Date
  updatedAt?: Date
  likes: number
  dislikes: number
  userReaction?: 'like' | 'dislike'
  replies: Comment[]
  isModerated: boolean
  status: 'approved' | 'pending' | 'rejected'
}

interface Rating {
  id: string
  value: number // 1-5 stars
  comment?: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  createdAt: Date
  isVerified: boolean
}

interface CommentsAndRatingsProps {
  articleId: string
  comments: Comment[]
  ratings: Rating[]
  currentUserId: string
  userRating?: number
  onAddComment: (content: string, parentId?: string) => void
  onUpdateComment: (commentId: string, content: string) => void
  onDeleteComment: (commentId: string) => void
  onReactToComment: (commentId: string, reaction: 'like' | 'dislike') => void
  onAddRating: (rating: number, comment?: string) => void
  onUpdateRating: (rating: number, comment?: string) => void
  onModerateComment: (commentId: string, action: 'approve' | 'reject') => void
  canModerate?: boolean
}

export function CommentsAndRatings({
  articleId,
  comments,
  ratings,
  currentUserId,
  userRating,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onReactToComment,
  onAddRating,
  onUpdateRating,
  onModerateComment,
  canModerate = false
}: CommentsAndRatingsProps) {
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [selectedRating, setSelectedRating] = useState(userRating || 0)
  const [ratingComment, setRatingComment] = useState('')
  const [showRatingDialog, setShowRatingDialog] = useState(false)

  // Calculate average rating
  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, rating) => sum + rating.value, 0) / ratings.length 
    : 0

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment)
      setNewComment('')
    }
  }

  const handleReply = (parentId: string) => {
    if (replyContent.trim()) {
      onAddComment(replyContent, parentId)
      setReplyContent('')
      setReplyingTo(null)
    }
  }

  const handleEditComment = (commentId: string) => {
    if (editContent.trim()) {
      onUpdateComment(commentId, editContent)
      setEditingComment(null)
      setEditContent('')
    }
  }

  const handleRatingSubmit = () => {
    if (selectedRating > 0) {
      if (userRating) {
        onUpdateRating(selectedRating, ratingComment)
      } else {
        onAddRating(selectedRating, ratingComment)
      }
      setShowRatingDialog(false)
      setRatingComment('')
    }
  }

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            } ${
              interactive ? 'cursor-pointer hover:text-yellow-400' : ''
            }`}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
          />
        ))}
      </div>
    )
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 mt-4' : ''}`}>
      <Card className={`${comment.status === 'pending' ? 'border-yellow-200 bg-yellow-50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.author.avatar} />
              <AvatarFallback>
                {comment.author.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">{comment.author.name}</span>
                <Badge variant="outline" className="text-xs">
                  {comment.author.role}
                </Badge>
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(comment.createdAt, { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </span>
                {comment.updatedAt && (
                  <Badge variant="secondary" className="text-xs">
                    editado
                  </Badge>
                )}
                {comment.status === 'pending' && (
                  <Badge variant="outline" className="text-xs text-yellow-600">
                    Aguardando moderação
                  </Badge>
                )}
              </div>

              {editingComment === comment.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEditComment(comment.id)}>
                      Salvar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setEditingComment(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                  {comment.content}
                </p>
              )}

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onReactToComment(comment.id, 'like')}
                    className={comment.userReaction === 'like' ? 'text-blue-600' : ''}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    {comment.likes}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onReactToComment(comment.id, 'dislike')}
                    className={comment.userReaction === 'dislike' ? 'text-red-600' : ''}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    {comment.dislikes}
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setReplyingTo(comment.id)}
                >
                  <Reply className="h-4 w-4 mr-1" />
                  Responder
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {comment.author.id === currentUserId && (
                      <>
                        <DropdownMenuItem onClick={() => startEditing(comment)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDeleteComment(comment.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem>
                      <Flag className="h-4 w-4 mr-2" />
                      Reportar
                    </DropdownMenuItem>
                    {canModerate && comment.status === 'pending' && (
                      <>
                        <Separator />
                        <DropdownMenuItem 
                          onClick={() => onModerateComment(comment.id, 'approve')}
                          className="text-green-600"
                        >
                          Aprovar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onModerateComment(comment.id, 'reject')}
                          className="text-red-600"
                        >
                          Rejeitar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {replyingTo === comment.id && (
                <div className="mt-4 space-y-2">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Digite sua resposta..."
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleReply(comment.id)}>
                      Responder
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setReplyingTo(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4">
                  {comment.replies.map(reply => renderComment(reply, true))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Ratings Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Avaliações ({ratings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">
                {averageRating.toFixed(1)}
              </div>
              {renderStars(Math.round(averageRating))}
              <div className="text-sm text-gray-500 mt-1">
                {ratings.length} avaliações
              </div>
            </div>

            <div className="flex-1">
              {[5, 4, 3, 2, 1].map(star => {
                const count = ratings.filter(r => r.value === star).length
                const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0
                
                return (
                  <div key={star} className="flex items-center gap-2 mb-1">
                    <span className="text-sm w-6">{star}</span>
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-8">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Star className="h-4 w-4 mr-2" />
                {userRating ? 'Atualizar Avaliação' : 'Avaliar Artigo'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {userRating ? 'Atualizar Avaliação' : 'Avaliar Artigo'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Sua avaliação
                  </label>
                  {renderStars(selectedRating, true, setSelectedRating)}
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Comentário (opcional)
                  </label>
                  <Textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Compartilhe sua experiência com este artigo..."
                    className="min-h-[100px]"
                  />
                </div>

                <Button 
                  onClick={handleRatingSubmit} 
                  className="w-full"
                  disabled={selectedRating === 0}
                >
                  {userRating ? 'Atualizar' : 'Enviar'} Avaliação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Recent Ratings */}
      {ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Avaliações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ratings.slice(0, 5).map(rating => (
                <div key={rating.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={rating.author.avatar} />
                    <AvatarFallback>
                      {rating.author.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{rating.author.name}</span>
                      {rating.isVerified && (
                        <Badge variant="secondary" className="text-xs">
                          Verificado
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(rating.createdAt, { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                    
                    {renderStars(rating.value)}
                    
                    {rating.comment && (
                      <p className="text-gray-700 mt-2">{rating.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comentários ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add Comment */}
          <div className="space-y-3 mb-6">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Adicione um comentário..."
              className="min-h-[100px]"
            />
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Comentar
            </Button>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum comentário ainda</p>
                <p className="text-sm">Seja o primeiro a comentar!</p>
              </div>
            ) : (
              comments.map(comment => renderComment(comment))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}