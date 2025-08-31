import React, { useState } from 'react';
import { User as UserIcon, MessageCircle, Check, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import type { User } from '@prisma/client';

interface VotingCardProps {
  user: User;
  hasVoted: boolean;
  comment?: string;
  onVote: (userId: string, comment?: string) => void;
  onRemoveVote: (userId: string) => void;
  disabled?: boolean;
}

export function VotingCard({
  user,
  hasVoted,
  comment,
  onVote,
  onRemoveVote,
  disabled = false,
}: VotingCardProps) {
  const [showComment, setShowComment] = useState(false);
  const [commentText, setCommentText] = useState(comment || '');
  const [loading, setLoading] = useState(false);

  const handleVote = async () => {
    setLoading(true);
    try {
      if (hasVoted) {
        await onRemoveVote(user.id);
      } else {
        await onVote(user.id, commentText);
        setShowComment(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    setLoading(true);
    try {
      await onVote(user.id, commentText);
      setShowComment(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`overflow-hidden transition-all duration-200 ${
      hasVoted ? 'border-green-500 bg-green-50' : 'hover:shadow-md hover:border-gray-300'
    }`}>
      {/* Header compacto */}
      <div className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full" />
              ) : (
                <span className="text-gray-600 font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{user.name}</h3>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          {hasVoted && (
            <div className="flex items-center text-green-600">
              <Check className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Votado</span>
            </div>
          )}
        </div>
      </div>

      {/* Comentario */}
      {comment && !showComment && (
        <div className="px-4 pb-3">
          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <p className="text-sm text-blue-800">“{comment}”</p>
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="px-4 pb-4">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComment(!showComment)}
            disabled={disabled}
            className="flex-1 text-xs"
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            {showComment ? 'Cerrar' : 'Comentar'}
          </Button>
          
          {hasVoted ? (
            <Button
              variant="danger"
              size="sm"
              onClick={handleVote}
              loading={loading}
              disabled={disabled}
              className="flex-1 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Quitar
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleVote}
              loading={loading}
              disabled={disabled}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
            >
              👍 Votar
            </Button>
          )}
        </div>
      </div>

      {/* Área de comentario expandible */}
      {showComment && (
        <div className="border-t bg-gray-50 p-3">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Comentario opcional..."
            rows={2}
            className="text-sm mb-2"
          />
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowComment(false);
                setCommentText(comment || '');
              }}
              className="flex-1 text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleAddComment}
              loading={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
            >
              {hasVoted ? 'Actualizar' : 'Confirmar'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}