import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import Link from 'next/link';
import Image from 'next/image';
import { getGentlenessColor, getGentlenessLabel } from '@/utils/gentleness';
import StarRating from '../ui/StarRating';
import EditableStarRating from '../ui/EditableStarRating';
import { getUserRank, UserStats } from '@/utils/userRank';
import ReviewComments from './ReviewComments';

// Import React Quill dynamically to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <p>Chargement de l'éditeur...</p>
});

// Toolbar configuration for the editor
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{'list': 'ordered'}, {'list': 'bullet'}],
    ['link'],
    ['clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'link'
];

export type Review = {
  id: number;
  user_id: string;
  razor_id: number;
  gentleness_rating: number;
  review_content: string; // Le contenu HTML de l'avis
  likes_count: number;
  comments_count: number; // Ajout du compteur de commentaires
  created_at: string;
  updated_at: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  user_has_liked?: boolean;
  // Nouvelles notations en étoiles
  efficiency_gentleness_ratio?: number;
  lather_evacuation?: number;
  handle_grip?: number;
  overall_rating?: number;
  // Statistiques utilisateur pour le calcul des étoiles
  razors_created?: number;
  comments_posted?: number;
  reviews_posted?: number;
  likes_received?: number;
  owned_razors?: number;
  wishlisted_razors?: number;
  favorite_razors?: number;
};

type RichReviewEditorProps = {
  razorId: number;
  reviews: Review[];
  onReviewsUpdate: (reviews: Review[]) => void;
};

const RichReviewEditor: React.FC<RichReviewEditorProps> = ({ 
  razorId, 
  reviews, 
  onReviewsUpdate 
}) => {
  const [reviewContent, setReviewContent] = useState<string>('');
  const [gentlenessRating, setGentlenessRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});
  const [openComments, setOpenComments] = useState<number | null>(null);
  
  // Nouvelles notations en étoiles
  const [efficiencyRatio, setEfficiencyRatio] = useState<number>(3);
  const [latherEvacuation, setLatherEvacuation] = useState<number>(3);
  const [handleGrip, setHandleGrip] = useState<number>(3);
  const [overallRating, setOverallRating] = useState<number>(3);
  
  const user = useUser();
  const supabaseClient = useSupabaseClient();

  // Vérifier si l'utilisateur est admin
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  // Vérifier le statut admin de l'utilisateur
  useEffect(() => {
    if (user) {
      const checkUserIsAdmin = async () => {
        const { data, error } = await supabaseClient
          .from('admins')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (data && !error) {
          setIsAdmin(true);
        }
      };
      
      checkUserIsAdmin();
    }
  }, [user, supabaseClient]);

  // Vérifier si l'utilisateur a déjà soumis un avis
  const userReview = user ? reviews.find(review => review.user_id === user.id) : null;

  // Si l'utilisateur a déjà soumis un avis, charger le contenu existant
  React.useEffect(() => {
    if (userReview) {
      setReviewContent(userReview.review_content || '');
      setGentlenessRating(userReview.gentleness_rating);
      
      // Charger les notations en étoiles si elles existent
      if (userReview.efficiency_gentleness_ratio) setEfficiencyRatio(userReview.efficiency_gentleness_ratio);
      if (userReview.lather_evacuation) setLatherEvacuation(userReview.lather_evacuation);
      if (userReview.handle_grip) setHandleGrip(userReview.handle_grip);
      if (userReview.overall_rating) setOverallRating(userReview.overall_rating);
    }
  }, [userReview]);

  // Fonction pour supprimer un avis
  const handleDeleteReview = async (reviewId?: number) => {
    if (!user) {
      return;
    }
    
    const reviewToDelete = reviewId ? reviews.find(r => r.id === reviewId) : userReview;
    
    if (!reviewToDelete) {
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est irréversible.')) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const { error } = await supabaseClient
        .from('razor_reviews')
        .delete()
        .eq('id', reviewToDelete.id);
      
      if (error) throw error;
      
      // Mettre à jour l'UI en supprimant l'avis
      const updatedReviews = reviews.filter(review => review.id !== reviewToDelete.id);
      onReviewsUpdate(updatedReviews);
      
      // Réinitialiser les états
      setReviewContent('');
      setGentlenessRating(null);
      setEfficiencyRatio(3);
      setLatherEvacuation(3);
      setHandleGrip(3);
      setOverallRating(3);
      
      setSuccessMessage('Votre avis a été supprimé avec succès!');
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error: any) {
      console.error('Erreur lors de la suppression de l\'avis:', error);
      setErrorMessage(`Erreur: ${error.message}. Veuillez réessayer.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction utilitaire pour convertir le format des statistiques utilisateur
  const extractUserStats = (review: Review): UserStats => {
    return {
      razorsCreated: review.razors_created || 0,
      commentsPosted: review.comments_posted || 0,
      reviewsPosted: review.reviews_posted || 0,
      likesReceived: review.likes_received || 0,
      ownedRazors: review.owned_razors || 0,
      wishlistedRazors: review.wishlisted_razors || 0,
      favoriteRazors: review.favorite_razors || 0,
    };
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const reviewData = {
        user_id: user.id,
        razor_id: razorId,
        review_content: reviewContent,
        efficiency_gentleness_ratio: efficiencyRatio,
        lather_evacuation: latherEvacuation,
        handle_grip: handleGrip,
        overall_rating: overallRating
      };

      // Vérifier si l'utilisateur a déjà un avis
      if (userReview) {
        // Mettre à jour l'avis existant
        const { error } = await supabaseClient
          .from('razor_reviews')
          .update({
            review_content: reviewContent,
            efficiency_gentleness_ratio: efficiencyRatio,
            lather_evacuation: latherEvacuation,
            handle_grip: handleGrip,
            overall_rating: overallRating,
            updated_at: new Date().toISOString()
          })
          .eq('id', userReview.id);

        if (error) throw error;
        
        // Mettre à jour les avis localement
        const updatedReviews = reviews.map(review => 
          review.id === userReview.id 
            ? { 
                ...review, 
                review_content: reviewContent,
                efficiency_gentleness_ratio: efficiencyRatio,
                lather_evacuation: latherEvacuation,
                handle_grip: handleGrip,
                overall_rating: overallRating,
                updated_at: new Date().toISOString(),
                comments_count: review.comments_count // Maintenir le compteur de commentaires
              } 
            : review
        );
        
        onReviewsUpdate(updatedReviews);
        setSuccessMessage('Votre avis a été mis à jour avec succès!');
      } else {
        // Créer un nouvel avis
        const { data: insertedData, error: insertError } = await supabaseClient
          .from('razor_reviews')
          .insert([reviewData])
          .select();

        if (insertError) throw insertError;
        
        if (insertedData && insertedData[0]) {
          // Récupérer les informations du profil séparément
          const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('id', user.id)
            .single();
            
          if (profileError) {
            console.warn('Erreur lors de la récupération du profil:', profileError);
          }
          
          // Formater le nouvel avis
          const newReview: Review = {
            ...insertedData[0],
            username: profileData?.username || null,
            full_name: profileData?.full_name || null,
            avatar_url: profileData?.avatar_url || null,
            likes_count: 0,
            comments_count: 0, // Ajout du compteur de commentaires
            user_has_liked: false
          };
          
          // Ajouter le nouvel avis à la liste
          onReviewsUpdate([newReview, ...reviews]);
          setSuccessMessage('Votre avis a été publié avec succès!');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la soumission de l\'avis:', error);
      // Afficher plus de détails sur l'erreur
      const errorMessage = error instanceof Error 
        ? `${error.message}` 
        : 'Une erreur inconnue s\'est produite';
      setErrorMessage(`Erreur: ${errorMessage}. Veuillez réessayer.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeReview = async (reviewId: number) => {
    if (!user) return;

    try {
      // Vérifier si l'utilisateur a déjà aimé cet avis
      const { data: existingLike, error: checkError } = await supabaseClient
        .from('review_likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('review_id', reviewId);

      if (checkError) throw checkError;

      if (existingLike && existingLike.length > 0) {
        // L'utilisateur a déjà aimé cet avis, supprimer le like
        const { error: deleteError } = await supabaseClient
          .from('review_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('review_id', reviewId);

        if (deleteError) throw deleteError;

        // Mettre à jour le décompte des likes
        const updatedReviews = reviews.map(review => 
          review.id === reviewId 
            ? { 
                ...review, 
                likes_count: Math.max(0, review.likes_count - 1),
                user_has_liked: false
              } 
            : review
        );
        
        onReviewsUpdate(updatedReviews);
      } else {
        // L'utilisateur n'a pas encore aimé cet avis, ajouter un like
        const { error: insertError } = await supabaseClient
          .from('review_likes')
          .insert([{ 
            user_id: user.id, 
            review_id: reviewId 
          }]);

        if (insertError) throw insertError;

        // Mettre à jour le décompte des likes
        const updatedReviews = reviews.map(review => 
          review.id === reviewId 
            ? { 
                ...review, 
                likes_count: review.likes_count + 1,
                user_has_liked: true
              } 
            : review
        );
        
        onReviewsUpdate(updatedReviews);
      }
    } catch (error) {
      console.error('Erreur lors de la gestion du like:', error);
    }
  };

  // Fonction pour afficher/masquer les commentaires
  const toggleComments = (reviewId: number) => {
    if (openComments === reviewId) {
      setOpenComments(null);
    } else {
      setOpenComments(reviewId);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4">Avis et tests de rasoirs</h2>
      
      {user ? (
        <div className="mb-8">
          {userReview ? (
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-medium">Modifier votre avis</h3>
              {/* Ajout des étoiles pour l'utilisateur connecté */}
              {user && (
                <span className="inline-flex ml-4 items-center">
                  <StarRating 
                    rating={userReview && userReview.razors_created !== undefined ? 
                      getUserRank(extractUserStats(userReview)).stars : 0}
                    size="sm"
                    showValue={false}
                  />
                  <span className="text-xs text-gray-500 ml-1">
                    {userReview && userReview.razors_created !== undefined ? 
                      getUserRank(extractUserStats(userReview)).title : 'Novice du Rasage'}
                  </span>
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-medium">Ajouter votre avis</h3>
            </div>
          )}
          {/* Nouvelles notations en étoiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <EditableStarRating 
              label="Avis général"
              rating={overallRating}
              onChange={setOverallRating}
              showValue={true}
              size="md"
            />
            
            <EditableStarRating 
              label="Ratio douceur/efficacité"
              rating={efficiencyRatio}
              onChange={setEfficiencyRatio}
              showValue={true}
              size="md"
            />
            
            <EditableStarRating 
              label="Evacuation de la mousse"
              rating={latherEvacuation}
              onChange={setLatherEvacuation}
              showValue={true}
              size="md"
            />
            
            <EditableStarRating 
              label="Grip du manche"
              rating={handleGrip}
              onChange={setHandleGrip}
              showValue={true}
              size="md"
            />
          </div>

          {/* Éditeur d'avis */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Votre avis ou test complet
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded">
              <ReactQuill 
                theme="snow"
                value={reviewContent}
                onChange={setReviewContent}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Partagez votre expérience avec ce rasoir..."
              />
            </div>
          </div>

          {/* Messages de feedback */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {errorMessage}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              {successMessage}
            </div>
          )}
          
          {/* Boutons de soumission */}
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                onClick={handleSubmit}
              >
                {isSubmitting ? 'Envoi en cours...' : (userReview ? 'Mettre à jour l\'avis' : 'Publier l\'avis')}
              </button>
            </div>

            {userReview && (
              <button
                type="button"
                className="text-red-600 hover:text-red-800"
                onClick={() => handleDeleteReview()}
              >
                Supprimer l'avis
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-8 p-4 bg-gray-100 dark:bg-slate-700 rounded">
          <p className="mb-2">Connectez-vous pour partager votre avis sur ce rasoir.</p>
          <Link href="/auth/signin" className="btn-primary">
            Se connecter
          </Link>
        </div>
      )}
      
      {/* Liste des avis */}
      <div>
        <h3 className="text-lg font-medium mb-5 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Avis des utilisateurs 
          <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm font-semibold">
            {reviews.length}
          </span>
        </h3>
        
        <div className="space-y-8">
          {reviews.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              Aucun avis pour le moment. Soyez le premier à donner votre avis!
            </p>
          ) : (
            [...reviews]
              .sort((a, b) => {
                const engagementScoreA = (a.likes_count || 0) + (a.comments_count || 0);
                const engagementScoreB = (b.likes_count || 0) + (b.comments_count || 0);
                return engagementScoreB - engagementScoreA;
              })
              .map((review) => (
              <div key={review.id} className="border rounded-lg shadow-sm p-5 mb-6 bg-white dark:bg-slate-800 dark:border-slate-700" data-review-id={review.id}>
                {/* Badge pour les avis populaires */}
                {((review.likes_count || 0) + (review.comments_count || 0) > 0) && (
                  <div className="flex justify-end mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      Avis populaire
                    </span>
                  </div>
                )}
                {/* En-tête de l'avis avec l'avatar de l'utilisateur et les infos */}
                <div className="flex items-start space-x-3 mb-4 border-b pb-4 dark:border-slate-700">
                  <Link href={`/users/${review.username || review.user_id}`}>
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-blue-100 dark:border-blue-900">
                      {review.avatar_url ? (
                        <Image 
                          src={review.avatar_url} 
                          alt={review.username || "Utilisateur"} 
                          width={48} 
                          height={48} 
                          className="object-cover"
                        />
                      ) : (
                        <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </Link>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Link href={`/users/${review.username || review.user_id}`} className="font-medium text-gray-900 hover:underline dark:text-white text-lg">
                            {review.full_name || review.username || "Utilisateur"}
                          </Link>
                          
                          {/* Niveau utilisateur */}
                          {review.razors_created !== undefined && (
                            <div className="flex items-center">
                              <StarRating 
                                rating={getUserRank(extractUserStats(review)).stars} 
                                size="sm"
                                showValue={false} 
                              />
                              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full ml-1">
                                {getUserRank(extractUserStats(review)).title}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center mt-1">
                          <span 
                            className="inline-block text-xs font-medium px-2 py-0.5 rounded-full" 
                            style={{ 
                              backgroundColor: getGentlenessColor(review.gentleness_rating),
                              color: review.gentleness_rating >= 13 ? '#fff' : '#000'
                            }}
                          >
                            {review.gentleness_rating} - {getGentlenessLabel(review.gentleness_rating)}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                            {new Date(review.created_at).toLocaleDateString('fr-FR', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric'
                            })}
                            {review.updated_at && review.updated_at !== review.created_at && 
                              ' (modifié le ' + new Date(review.updated_at).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              }) + ')'
                            }
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions de modération ou d'édition */}
                      {user && (user.id === review.user_id || isAdmin) && (
                        <div className="flex space-x-2">
                          {(user.id === review.user_id || isAdmin) && (
                            <button
                              onClick={() => handleDeleteReview(review.id)}
                              className="text-sm text-red-600 hover:text-red-800 text-sm mt-2 font-medium"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Notations en étoiles */}
                {(review.efficiency_gentleness_ratio || review.lather_evacuation || review.handle_grip || review.overall_rating) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 px-5 mb-4 bg-gradient-to-r from-blue-50 to-gray-50 dark:from-slate-700 dark:to-slate-800 rounded-md border border-blue-100 dark:border-slate-600">
                    {review.overall_rating && (
                      <div className="flex flex-col items-center p-2">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-1">Avis général</span>
                        <StarRating rating={review.overall_rating} size="md" />
                      </div>
                    )}
                    
                    {review.efficiency_gentleness_ratio && (
                      <div className="flex flex-col items-center p-2">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-1">Douceur/efficacité</span>
                        <StarRating rating={review.efficiency_gentleness_ratio} size="md" />
                      </div>
                    )}
                    
                    {review.lather_evacuation && (
                      <div className="flex flex-col items-center p-2">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-1">Evacuation mousse</span>
                        <StarRating rating={review.lather_evacuation} size="md" />
                      </div>
                    )}
                    
                    {review.handle_grip && (
                      <div className="flex flex-col items-center p-2">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-1">Grip du manche</span>
                        <StarRating rating={review.handle_grip} size="md" />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Contenu de l'avis */}
                <div className="mb-4">
                  {(() => {
                    const reviewWithoutTags = review.review_content?.replace(/<[^>]*>/g, ' ') || '';
                    
                    // Fonction pour décoder les entités HTML
                    const decodeHTMLEntities = (text: string) => {
                      const textArea = document.createElement('textarea');
                      textArea.innerHTML = text;
                      return textArea.value;
                    };
                    
                    const decodedReview = decodeHTMLEntities(reviewWithoutTags);
                    const firstLine = decodedReview.split('\n')[0] || decodedReview.substring(0, 150);
                    const hasMoreContent = decodedReview.length > firstLine.length;
                    const isExpanded = expandedReviews[review.id] || false;
                    
                    return (
                      <div className="p-5 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-100 dark:border-slate-600">
                        {isExpanded ? (
                          <div className="prose dark:prose-invert max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: review.review_content || '<p>Aucun contenu</p>' }} />
                          </div>
                        ) : (
                          <div className="prose dark:prose-invert max-w-none">
                            <p className="text-base">{firstLine}{hasMoreContent ? '...' : ''}</p>
                          </div>
                        )}
                        
                        {hasMoreContent && (
                          <button 
                            onClick={() => setExpandedReviews(prev => ({ ...prev, [review.id]: !isExpanded }))} 
                            className="text-blue-600 hover:text-blue-800 text-sm mt-3 font-medium flex items-center"
                          >
                            {isExpanded ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                Voir moins
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                Voir plus
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
                
                {/* Boutons Like et Commentaires */}
                <div className="mt-5 flex items-center space-x-6 border-t pt-4 dark:border-slate-700">
                  <button 
                    onClick={() => handleLikeReview(review.id)}
                    className={`flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors dark:text-gray-400 dark:hover:text-blue-400 ${review.user_has_liked ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}`}
                    disabled={!user}
                  >
                    {review.user_has_liked ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                    )}
                    <span className="font-medium">{review.likes_count}</span>
                  </button>
                  
                  <button 
                    onClick={() => toggleComments(review.id)}
                    className={`flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors dark:text-gray-400 dark:hover:text-blue-400 ${openComments === review.id ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span className="font-medium">
                      {review.comments_count ? review.comments_count : 0}
                    </span>
                  </button>
                </div>

                {/* Commentaires de l'avis */}
                {openComments === review.id && (
                  <div className="mt-4 pt-4 border-t dark:border-slate-700">
                    <ReviewComments 
                      reviewId={review.id} 
                      onCommentAdded={() => {
                        // Mise à jour du compteur de commentaires
                        const updatedReviews = reviews.map(r => 
                          r.id === review.id 
                            ? {...r, comments_count: (r.comments_count || 0) + 1} 
                            : r
                        );
                        onReviewsUpdate(updatedReviews);
                      }}
                      onCommentDeleted={() => {
                        // Mise à jour du compteur de commentaires
                        const updatedReviews = reviews.map(r => 
                          r.id === review.id 
                            ? {...r, comments_count: Math.max((r.comments_count || 0) - 1, 0)} 
                            : r
                        );
                        onReviewsUpdate(updatedReviews);
                      }}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RichReviewEditor;
