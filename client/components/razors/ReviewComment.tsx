import React, { useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import Image from 'next/image';
import Link from 'next/link';
import StarRating from '../ui/StarRating';
import { UserStats, getUserRank } from '@/utils/userRank';

export type Comment = {
  id: number;
  review_id: number;
  user_id: string;
  parent_comment_id: number | null;
  content?: string;
  comment_content: string;
  created_at: string;
  updated_at?: string;
  username?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  // Pour l'interface utilisateur
  replies?: Comment[];
};

type ReviewCommentProps = {
  comment: Comment;
  onCommentDelete?: (commentId: number) => Promise<void>;
  isReply?: boolean;
  level?: number;
};

const ReviewComment: React.FC<ReviewCommentProps> = ({ 
  comment, 
  onCommentDelete,
  isReply = false,
  level = 0
}) => {
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  
  const maxReplyLevel = 3; // Limiter la profondeur des réponses
  const isAuthor = user && user.id === comment.user_id;

  const handleDelete = async () => {
    if (!onCommentDelete) return;
    
    try {
      await onCommentDelete(comment.id);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setError('Impossible de supprimer ce commentaire');
    }
  };

  const handleReplySubmit = async () => {
    if (!user) {
      setError("Vous devez être connecté pour répondre");
      return;
    }
    
    if (!replyContent.trim()) {
      setError("La réponse ne peut pas être vide");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Étape 1: Insérer le commentaire
      const { data: commentData, error: insertError } = await supabaseClient
        .from('review_comments')
        .insert({
          review_id: comment.review_id,
          user_id: user.id,
          parent_comment_id: comment.id,
          comment_content: replyContent.trim()
        })
        .select(`
          id, 
          review_id,
          user_id,
          comment_content,
          parent_comment_id,
          created_at
        `);
      
      if (insertError) throw insertError;
      
      if (commentData && commentData.length > 0) {
        // Étape 2: Récupérer les données du profil séparément
        const { data: profileData, error: profileError } = await supabaseClient
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error('Erreur lors de la récupération du profil:', profileError);
        }
        
        // Créer la nouvelle réponse avec le format attendu
        const newReply: Comment = {
          ...commentData[0],
          content: commentData[0].comment_content,
          comment_content: commentData[0].comment_content,
          username: profileData?.username || user.email?.split('@')[0] || 'Utilisateur',
          full_name: profileData?.full_name || '',
          avatar_url: profileData?.avatar_url || '',
          replies: []
        };
        
        // Ajouter la réponse aux réponses existantes
        if (!comment.replies) {
          comment.replies = [newReply];
        } else {
          comment.replies.push(newReply);
        }
        
        // Réinitialiser le formulaire
        setReplyContent('');
        setShowReplyForm(false);
      }
    } catch (err) {
      console.error('Erreur lors de la soumission de la réponse:', err);
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`comment-container ${isReply ? 'ml-6' : ''}`} style={{ marginLeft: `${level * 1.5}rem` }}>
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          {comment.avatar_url ? (
            <Image
              src={comment.avatar_url}
              alt={comment.username || 'Utilisateur'}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-500 text-sm">
                {(comment.username?.[0] || comment.full_name?.[0] || 'U').toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-grow">
          <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-800">
            <div className="flex justify-between items-start mb-1">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {comment.full_name || comment.username || 'Utilisateur'}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  {new Date(comment.created_at).toLocaleDateString('fr-FR', { 
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              {isAuthor && (
                <button
                  onClick={() => handleDelete()}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Supprimer le commentaire"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {comment.comment_content || comment.content}
            </div>
          </div>
          
          {user && level < maxReplyLevel && (
            <div className="mt-2">
              {!showReplyForm ? (
                <button
                  onClick={() => setShowReplyForm(true)}
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  Répondre
                </button>
              ) : (
                <div className="mt-2 reply-form">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Écrire une réponse..."
                    className="w-full p-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    rows={2}
                  />
                  
                  {error && (
                    <p className="text-red-500 text-xs mt-1">{error}</p>
                  )}
                  
                  <div className="flex justify-end mt-2 space-x-2">
                    <button
                      onClick={() => setShowReplyForm(false)}
                      className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleReplySubmit}
                      disabled={isSubmitting || !replyContent.trim()}
                      className={`px-3 py-1 text-xs rounded-md ${
                        isSubmitting || !replyContent.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700'
                      }`}
                    >
                      {isSubmitting ? 'Envoi...' : 'Envoyer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Afficher les réponses si elles existent */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <ReviewComment
                  key={reply.id}
                  comment={reply}
                  onCommentDelete={onCommentDelete}
                  isReply={true}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewComment;
