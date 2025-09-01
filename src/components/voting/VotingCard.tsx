import React, { useState } from 'react';
import { User as UserIcon, Check, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
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
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRemoveVote = async () => {
    setLoading(true);
    try {
      await onRemoveVote(user.id);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVote = async () => {
    setLoading(true);
    try {
      await onVote(user.id, commentText.trim() || undefined);
      setShowVoteModal(false);
      setCommentText('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`overflow-hidden transition-all duration-200 ${
      hasVoted ? 'border-green-500 bg-green-50' : 'hover:shadow-md hover:border-gray-300'
    } md:p-0`}>
      {/* Layout responsive */}
      <div className="md:flex md:items-center md:justify-between md:p-4">
        {/* Info del usuario */}
        <div className="flex items-center space-x-3 pb-3 md:pb-0 md:flex-1">
          <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full" />
            ) : (
              <span className="text-gray-600 font-medium">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{user.name}</h3>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          {hasVoted && (
            <div className="flex items-center text-green-600 md:hidden">
              <Check className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Votado</span>
            </div>
          )}
        </div>
        
        {/* Nominaciones */}
        {(user as any).nominations && (user as any).nominations.length > 0 && (
          <div className="mt-2 mb-4 space-y-1 md:flex-1 md:mx-4 md:mt-0 md:mb-0">
            <p className="text-xs font-medium text-gray-600 md:mb-2">
              Nominado por ({(user as any).nominations.length}):
            </p>
            <div className="md:flex md:flex-wrap md:gap-2">
              {(user as any).nominations.map((nomination: any) => {
                const categories = [
                  { value: 'TECHNICAL', label: 'Técnico' },
                  { value: 'LEADERSHIP', label: 'Liderazgo' },
                  { value: 'COLLABORATION', label: 'Colaboración' },
                  { value: 'INNOVATION', label: 'Innovación' },
                  { value: 'MENTORSHIP', label: 'Mentoría' }
                ];
                
                const contributionTypes = [
                  { value: 'DELIVERY', label: 'Entrega' },
                  { value: 'QUALITY', label: 'Calidad' },
                  { value: 'INNOVATION', label: 'Innovación' },
                  { value: 'SUPPORT', label: 'Apoyo' },
                  { value: 'PROCESS', label: 'Procesos' }
                ];
                
                return (
                  <div key={nomination.id} className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1 md:inline-block">
                    <div className="mb-1 md:mb-0">
                      <span className="font-medium">{nomination.nominator.name}:</span> "{nomination.reason}"
                      <div className="flex flex-wrap gap-1 mt-1">
                        {nomination.project && (
                          <Badge variant="outline" size="sm" className="text-xs">
                            {nomination.project.name}
                          </Badge>
                        )}
                        {nomination.category && (
                          <Badge variant="outline" size="sm" className="text-xs bg-blue-50 text-blue-700">
                            {categories.find(c => c.value === nomination.category)?.label || nomination.category}
                          </Badge>
                        )}
                        {nomination.contributionType && (
                          <Badge variant="outline" size="sm" className="text-xs bg-purple-50 text-purple-700">
                            {contributionTypes.find(t => t.value === nomination.contributionType)?.label || nomination.contributionType}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        

        
        {/* Estado y botones */}
        <div className="md:flex md:items-center md:space-x-4">

          
          {/* Estado y botones desktop */}
          <div className="hidden md:block">
            {hasVoted && (
              <div className="flex items-center text-green-600 mb-2">
                <Check className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Votado</span>
              </div>
            )}
            {hasVoted ? (
              <Button
                variant="danger"
                size="sm"
                onClick={handleRemoveVote}
                loading={loading}
                disabled={disabled}
              >
                <X className="h-3 w-3 mr-1" />
                Quitar Voto
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setShowVoteModal(true)}
                disabled={disabled}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                👍 Votar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Comentario */}
      {comment && (
        <div className="px-4 pb-3">
          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <p className="text-sm text-blue-800">“{comment}”</p>
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="px-4 pb-4 md:hidden">
        {hasVoted ? (
          <Button
            variant="danger"
            size="sm"
            onClick={handleRemoveVote}
            loading={loading}
            disabled={disabled}
            className="w-full text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Quitar Voto
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => setShowVoteModal(true)}
            disabled={disabled}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs"
          >
            👍 Votar
          </Button>
        )}
      </div>

      {/* Modal de votación */}
      <Modal
        isOpen={showVoteModal}
        onClose={() => {
          setShowVoteModal(false);
          setCommentText('');
        }}
        title={`Votar por ${user.name}`}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Deseas agregar un comentario opcional a tu voto?
          </p>
          
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Comentario opcional (ej: Excelente trabajo en el proyecto X)..."
            rows={3}
          />
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowVoteModal(false);
                setCommentText('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmVote}
              loading={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Confirmar Voto
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}