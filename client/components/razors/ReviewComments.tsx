import React, { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import Link from 'next/link';
import ReviewComment, { Comment } from './ReviewComment';

type ReviewCommentsProps = {
  reviewId: number;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
  userId?: string;
  showCommentForm?: boolean;
};

const ReviewComments: React.FC<ReviewCommentsProps> = ({ 
  reviewId,
  onCommentAdded,
  onCommentDeleted,
  userId,
  showCommentForm = true
}) => {
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(true);

  // Fonction pour organiser les commentaires en structure arborescente
  const organizeComments = (flatComments: Comment[]): Comment[] => {
    console.log('Commentaires reçus:', flatComments); // Log pour débogage
    
    const commentMap: Record<number, Comment> = {};
    const rootComments: Comment[] = [];
    
    // Première passe : créer un mapping de tous les commentaires
    flatComments.forEach(comment => {
      const commentWithReplies = { ...comment, replies: [] };
      commentMap[comment.id] = commentWithReplies;
    });
    
    // Deuxième passe : organiser les commentaires dans la structure
    flatComments.forEach(comment => {
      if (!comment.parent_comment_id) {
        // C'est un commentaire racine
        rootComments.push(commentMap[comment.id]);
      } else {
        // C'est une réponse - Vérifier que le parent existe
        const parentId = comment.parent_comment_id;
        const parent = commentMap[parentId];
        if (parent && Array.isArray(parent.replies)) {
          parent.replies.push(commentMap[comment.id]);
        } else {
          // Si le parent n'existe pas, traiter comme commentaire racine
          console.warn(`Parent comment ${parentId} not found for comment ${comment.id}`);
          rootComments.push(commentMap[comment.id]);
        }
      }
    });
    
    console.log('Commentaires organisés:', rootComments); // Log pour débogage
    return rootComments;
  };

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('=== DEBUG INFO ===');
      console.log('1. Début fetchComments avec reviewId:', reviewId);
      console.log('2. User authentifié:', user ? 'Oui' : 'Non', user ? `(${user.id})` : '');
      
      // Log la chaîne de connexion pour vérifier qu'elle est correcte
      console.log('3. Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      
      // Utiliser la version mise à jour de la fonction RPC qui inclut les statistiques utilisateur
      const { data, error: fetchError } = await supabaseClient
        .rpc('get_review_comments', { 
          review_id_param: reviewId 
        });
      
      console.log('4. Réponse RPC:', { data, error: fetchError });
      
      if (fetchError) {
        console.error('5. Erreur Supabase détaillée:', {
          message: fetchError.message,
          code: fetchError.code,
          details: fetchError.details,
          hint: fetchError.hint
        });
        throw new Error(fetchError.message || 'Impossible de charger les commentaires');
      }
      
      console.log('6. Données brutes des commentaires:', data);
      
      // Assurer que les données sont un tableau (même vide)
      const commentsArray = Array.isArray(data) ? data : (data ? [data] : []);
      
      // Vérifier si les données sont valides
      if (!commentsArray) {
        console.error('7. Données invalides:', data);
        throw new Error('Format de données invalide');
      }
      
      if (commentsArray.length === 0) {
        console.log('8. Aucun commentaire trouvé pour cette critique');
        setComments([]);
      } else {
        console.log('9. Organisation des commentaires...');
        const organizedComments = organizeComments(commentsArray);
        console.log('10. Commentaires organisés:', organizedComments);
        setComments(organizedComments);
      }
    } catch (err) {
      console.error('11. ERREUR CRITIQUE:', err);
      // Si err est un objet Error, afficher sa stack trace
      if (err instanceof Error) {
        console.error('Stack trace:', err.stack);
      }
      setError('Impossible de charger les commentaires');
    } finally {
      setLoading(false);
      console.log('=== FIN DEBUG INFO ===');
    }
  };

  useEffect(() => {
    if (reviewId) {
      fetchComments();
    }
  }, [reviewId]);

  const handleCommentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!user) {
      setSubmitError("Vous devez être connecté pour commenter.");
      return;
    }
    
    if (!newComment.trim()) {
      setSubmitError("Le commentaire ne peut pas être vide.");
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Étape 1: Insérer le commentaire
      const { data: commentData, error: insertError } = await supabaseClient
        .from('review_comments')
        .insert([
          { 
            review_id: reviewId,
            user_id: user.id,
            comment_content: newComment.trim(),
            parent_comment_id: null
          }
        ])
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
        
        // Ajouter le nouveau commentaire à la liste
        const newCommentWithUser = {
          ...commentData[0],
          content: commentData[0].comment_content, // Renommer pour la compatibilité
          username: profileData?.username || user.email?.split('@')[0] || 'Utilisateur',
          full_name: profileData?.full_name || '',
          avatar_url: profileData?.avatar_url || '',
          replies: []
        };
        
        setComments(prevComments => {
          const updatedComments = [newCommentWithUser, ...prevComments];
          return updatedComments;
        });
        
        setNewComment('');
        
        // Notifier le parent qu'un commentaire a été ajouté
        if (onCommentAdded) onCommentAdded();
      }
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      setSubmitError(error.message || "Une erreur s'est produite lors de la soumission de votre commentaire.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    try {
      const { error } = await supabaseClient
        .from('review_comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
      
      // Mettre à jour la liste des commentaires
      setComments(prevComments => {
        return prevComments.filter(c => c.id !== commentId);
      });
      
      // Notifier le parent qu'un commentaire a été supprimé
      if (onCommentDeleted) onCommentDeleted();
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      setError(error.message || "Une erreur s'est produite lors de la suppression du commentaire.");
    }
  };

  const handleReplyToComment = async (commentId: number, replyContent: string) => {
    try {
      const { data, error } = await supabaseClient
        .from('review_comments')
        .insert([
          { 
            review_id: reviewId,
            user_id: user.id,
            comment_content: replyContent.trim(),
            parent_comment_id: commentId
          }
        ])
        .select(`
          id, 
          review_id,
          user_id,
          comment_content,
          parent_comment_id,
          created_at,
          profiles:user_id (
            username,
            full_name,
            avatar_url
          )
        `);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Ajouter la nouvelle réponse à la liste
        const newReplyWithUser = {
          ...data[0],
          content: data[0].comment_content, // Renommer pour la compatibilité
          username: data[0].profiles && Array.isArray(data[0].profiles) && data[0].profiles[0]?.username ? data[0].profiles[0].username : 'Anonyme',
          full_name: data[0].profiles && Array.isArray(data[0].profiles) && data[0].profiles[0]?.full_name ? data[0].profiles[0].full_name : '',
          avatar_url: data[0].profiles && Array.isArray(data[0].profiles) && data[0].profiles[0]?.avatar_url ? data[0].profiles[0].avatar_url : '',
          replies: []
        };
        
        setComments(prevComments => {
          const updatedComments = prevComments.map(comment => {
            if (comment.id === commentId) {
              return { ...comment, replies: [...comment.replies, newReplyWithUser] };
            }
            return comment;
          });
          return updatedComments;
        });
        
        // Notifier le parent qu'un commentaire a été ajouté
        if (onCommentAdded) onCommentAdded();
      }
    } catch (error: any) {
      console.error('Error submitting reply:', error);
      setError(error.message || "Une erreur s'est produite lors de la soumission de votre réponse.");
    }
  };

  const toggleComments = () => {
    setIsCommentsOpen(!isCommentsOpen);
    if (!isCommentsOpen && reviewId) {
      fetchComments();
    }
  };

  return (
    <div className="comments-container">
      {/* Chargement et erreurs */}
      {loading && <p className="text-center py-2 text-gray-500">Chargement des commentaires...</p>}
      {error && <p className="text-center py-2 text-red-500">Erreur: {error}</p>}

      {/* Liste des commentaires */}
      {!loading && comments.length === 0 ? (
        <p className="text-center py-2 text-gray-500">Aucun commentaire pour le moment.</p>
      ) : (
        <div className="comments-list space-y-3 mb-4">
          {comments.map(comment => (
            <ReviewComment 
              key={comment.id}
              comment={comment}
              onCommentDelete={handleCommentDelete}
              isReply={false}
              level={0}
            />
          ))}
        </div>
      )}

      {/* Formulaire de commentaire */}
      {user && showCommentForm && (
        <div className="comment-form mt-3">
          <div className="flex space-x-3">
            <div className="flex-grow">
              <textarea
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                placeholder="Ajouter un commentaire..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-2">
            <button
              onClick={handleCommentSubmit}
              disabled={isSubmitting || newComment.trim() === ''}
              className={`px-4 py-1 rounded-md font-medium ${
                isSubmitting || newComment.trim() === '' 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
              }`}
            >
              {isSubmitting ? 'Envoi...' : 'Commenter'}
            </button>
          </div>
          
          {submitError && (
            <p className="text-sm text-red-500 mt-1">{submitError}</p>
          )}
        </div>
      )}
      
      {!user && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
          <p className="text-center text-gray-600 dark:text-gray-400">
            <Link href="/auth" className="text-blue-600 hover:underline dark:text-blue-400">Connectez-vous</Link> pour commenter.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewComments;
