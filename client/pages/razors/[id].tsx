import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Razor, UserRating, RazorVariant } from '../../lib/supabase'
import GentlenessScale from '../../components/razors/GentlenessScale'
import GentlenessIndicator from '../../components/razors/GentlenessIndicator'
import SafeImage from '../../components/common/SafeImage'
import VariantSelector from '../../components/razors/VariantSelector'
import MultiVariantSelector from '../../components/razors/MultiVariantSelector'
import RichReviewEditor, { Review } from '../../components/razors/RichReviewEditor'
import { addToComparisonList, removeFromComparisonList, isInComparisonList, getComparisonList } from '../../lib/compareService'

// Note: La propriété comments_count est ajoutée au type Review dans RichReviewEditor
// Si vous recevez des erreurs de type, assurez-vous de mettre à jour les types dans lib/supabase.ts également

const RazorDetailPage = () => {
  const router = useRouter()
  const { id } = router.query
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  
  const [razor, setRazor] = useState<Razor | null>(null)
  const [similarRazors, setSimilarRazors] = useState<Razor[]>([])
  const [userRating, setUserRating] = useState<number | null>(null)
  const [userComment, setUserComment] = useState('')
  const [ratings, setRatings] = useState<UserRating[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [ratingsLoading, setRatingsLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ratingsError, setRatingsError] = useState<string | null>(null)
  const [reviewsError, setReviewsError] = useState<string | null>(null)
  const [inCollection, setInCollection] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const [creatorProfile, setCreatorProfile] = useState<{ username?: string; full_name?: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showVariantSelector, setShowVariantSelector] = useState(false)
  const [showMultiVariantSelector, setShowMultiVariantSelector] = useState(false)
  const [userVariants, setUserVariants] = useState<RazorVariant[]>([])
  const [variantAdded, setVariantAdded] = useState(false)
  const [variantsCount, setVariantsCount] = useState(0)
  const [isInComparison, setIsInComparison] = useState(false)

  // Charger les données du rasoir
  useEffect(() => {
    if (!id) return
    
    const fetchRazorData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        console.log('Fetching razor data for ID:', id)
        
        // Récupérer les informations du rasoir
        const { data: razorData, error: razorError } = await supabaseClient
          .from('razors')
          .select('*, created_by')
          .eq('id', id)
          .single()
        
        if (razorError) {
          console.error('Error fetching razor:', razorError)
          throw razorError
        }
        
        console.log('Razor data received:', razorData)
        setRazor(razorData)
        
        // Vérifier si le rasoir est dans la liste de comparaison
        if (razorData && razorData.id) {
          setIsInComparison(isInComparisonList(razorData.id));
        }
        
        // Charger les avis
        setReviewsLoading(true)
        setReviewsError(null)
        
        try {
          // Utiliser la fonction RPC pour obtenir les avis avec les profils et les likes
          const { data: reviewsData, error: reviewsError } = await supabaseClient
            .rpc('get_reviews_with_profiles_and_likes', { 
              razor_id_param: id,
              current_user_id: user ? user.id : null
            })
          
          if (reviewsError) {
            console.error('Error fetching reviews:', reviewsError)
            setReviewsError(reviewsError.message)
          } else {
            console.log(`${reviewsData?.length || 0} avis trouvés`)
            setReviews(reviewsData || [])
            
            // Vérifier si l'utilisateur a déjà évalué ce rasoir (pour compatibilité avec l'ancien système)
            if (user) {
              const userReview = reviewsData?.find(review => review.user_id === user.id)
              if (userReview) {
                console.log('Avis de l\'utilisateur trouvé:', userReview)
                setUserRating(userReview.gentleness_rating)
              }
            }
          }
        } catch (err) {
          console.error('Erreur lors du chargement des avis:', err)
          setReviewsError('Erreur lors du chargement des avis')
        } finally {
          setReviewsLoading(false)
        }
        
        // Pour compatibilité, charger également les anciennes évaluations
        // Cette partie peut être supprimée ultérieurement
        setRatingsLoading(true)
        setRatingsError(null)
        
        try {
          const { data: ratingsData, error: ratingsError } = await supabaseClient
            .rpc('get_ratings_with_profiles', { razor_id_param: id })
          
          if (ratingsError) {
            console.error('Error fetching ratings:', ratingsError)
            setRatingsError(ratingsError.message)
          } else {
            setRatings(ratingsData || [])
            
            // Vérifier si l'utilisateur a déjà évalué ce rasoir
            if (user) {
              const userRating = ratingsData?.find(rating => rating.user_id === user.id)
              if (userRating) {
                setUserRating(userRating.gentleness_rating)
                setUserComment(userRating.comment || '')
              }
            }
          }
        } catch (err) {
          console.error('Erreur lors du chargement des évaluations:', err)
          setRatingsError('Erreur lors du chargement des évaluations')
        } finally {
          setRatingsLoading(false)
        }
        
        // Charger les variantes de l'utilisateur si connecté
        if (user) {
          fetchUserVariants()
        }
        
        // Vérifier si l'utilisateur est le créateur du rasoir
        if (user && razorData.created_by === user.id) {
          setIsCreator(true)
          console.log('User is the creator of this razor')
        }
      } catch (error) {
        console.error('Erreur lors du chargement du rasoir:', error)
        setError('Impossible de charger les détails du rasoir')
      } finally {
        setLoading(false)
      }
    }
    
    fetchRazorData()
  }, [id, supabaseClient, user])
  
  // Charger les variantes de l'utilisateur
  const fetchUserVariants = async () => {
    if (!user || !id) return
    
    try {
      // Récupérer les variantes directement de la table razor_variants
      const { data: variantsData, error: variantsError } = await supabaseClient
        .from('razor_variants')
        .select('*')
        .eq('parent_razor_id', id)
        .eq('user_id', user.id)
      
      if (variantsError) throw variantsError
      
      // Récupérer également les variantes de la table user_collections
      const { data: collectionVariants, error: collectionError } = await supabaseClient
        .from('user_collections')
        .select('*')
        .eq('razor_id', id)
        .eq('user_id', user.id)
        .eq('is_variant', true)
      
      if (collectionError) throw collectionError
      
      // Convertir les entrées de collection en format RazorVariant pour l'affichage
      const convertedVariants = collectionVariants ? collectionVariants.map(cv => ({
        id: cv.id.toString(),
        parent_razor_id: parseInt(id as string),
        user_id: user.id,
        selected_material: cv.variant_material,
        selected_finish: cv.variant_finish,
        selected_comb_type: cv.variant_comb_type,
        notes: cv.variant_notes,
        created_at: cv.created_at
      })) : [];
      
      // Fusionner les deux sources de variantes
      const allVariants = [...(variantsData || []), ...convertedVariants];
      console.log('Variantes récupérées:', allVariants.length, 'dont', convertedVariants.length, 'de user_collections');
      
      setUserVariants(allVariants || []);
    } catch (error) {
      console.error('Erreur lors du chargement des variantes:', error)
    }
  }
  
  useEffect(() => {
    if (user && id) {
      fetchUserVariants();
    }
  }, [user, id]);
  
  useEffect(() => {
    if (user && razor) {
      const fetchCollectionStatus = async () => {
        const { data, error } = await supabaseClient
          .from('user_collections')
          .select('*')
          .eq('user_id', user.id)
          .eq('razor_id', razor.id)
          .single()
        
        if (error) {
          if (error.code === 'PGRST116') { // Not found
            setInCollection(false)
            setInWishlist(false)
            setIsFavorite(false)
          } else {
            console.error('Error fetching collection status:', error)
          }
          return
        }
        
        // Si nous trouvons une entrée, initialiser les états en conséquence
        if (data) {
          // Pour les rasoirs possédés, nous vérifions si in_wishlist est false
          setInCollection(!data.in_wishlist)
          setInWishlist(data.in_wishlist)
          setIsFavorite(data.is_favorite)
        }
      }
      
      fetchCollectionStatus()
    }
  }, [user, razor])
  
  useEffect(() => {
    if (user) {
      const checkAdmin = async () => {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        
        if (error) {
          console.error('Error checking admin status:', error)
        } else if (data && data.is_admin) {
          setIsAdmin(true)
          console.log('User is an admin')
        }
      }
      
      checkAdmin()
    }
  }, [user, supabaseClient])
  
  // Soumettre une évaluation
  const submitRating = async () => {
    if (!user || !razor || !userRating) return

    // Indiquer le chargement en cours
    setRatingsLoading(true)
    
    try {
      console.log('Soumission d\'une évaluation pour le rasoir:', razor.id)
      console.log('Données d\'évaluation:', {
        user_id: user.id,
        razor_id: razor.id,
        gentleness_rating: userRating,
        comment: userComment || null
      })
      
      // Chercher si l'utilisateur a déjà évalué ce rasoir
      const { data: existingRating, error: fetchError } = await supabaseClient
        .from('user_ratings')
        .select('id')
        .eq('user_id', user.id)
        .eq('razor_id', razor.id)
        .single()
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Erreur lors de la vérification d\'une évaluation existante:', fetchError)
        setRatingsError('Erreur lors de la vérification d\'une évaluation existante')
        return
      }
      
      let result
      
      // Si une évaluation existe déjà, la mettre à jour
      if (existingRating) {
        console.log('Mise à jour de l\'évaluation existante:', existingRating.id)
        result = await supabaseClient
          .from('user_ratings')
          .update({
            gentleness_rating: userRating,
            comment: userComment || null
          })
          .eq('id', existingRating.id)
      } else {
        // Sinon, créer une nouvelle évaluation
        console.log('Création d\'une nouvelle évaluation')
        result = await supabaseClient
          .from('user_ratings')
          .insert({
            user_id: user.id,
            razor_id: razor.id,
            gentleness_rating: userRating,
            comment: userComment || null
          })
      }
      
      const { error } = result
      
      if (error) {
        console.error('Erreur lors de la soumission de l\'évaluation:', error)
        console.log('Détails de l\'erreur:', {
          code: error.code,
          message: error.message,
          details: error.details
        })
        setRatingsError('Erreur lors de la soumission de l\'évaluation: ' + error.message)
      } else {
        console.log('Évaluation soumise avec succès')
        // Recharger les évaluations pour afficher les changements
        const { data: updatedRatings, error: refreshError } = await supabaseClient
          .rpc('get_ratings_with_profiles', { razor_id_param: razor.id })
          
        if (refreshError) {
          console.error('Erreur lors du rechargement des évaluations:', refreshError)
        } else {
          console.log(`${updatedRatings?.length || 0} évaluations chargées après soumission`)
          setRatings(updatedRatings || [])
          
          // Recharger également les informations du rasoir pour obtenir le avg_gentleness mis à jour
          const { data: updatedRazor, error: razorRefreshError } = await supabaseClient
            .from('razors')
            .select('*')
            .eq('id', razor.id)
            .single();
            
          if (razorRefreshError) {
            console.error('Erreur lors du rechargement des informations du rasoir:', razorRefreshError);
          } else if (updatedRazor) {
            setRazor(updatedRazor);
            console.log('Valeur avg_gentleness mise à jour:', updatedRazor.avg_gentleness);
          }
        }
      }
    } catch (err) {
      console.error('Erreur inattendue lors de la soumission de l\'évaluation:', err)
      setRatingsError('Erreur inattendue lors de la soumission de l\'évaluation')
    } finally {
      setRatingsLoading(false)
    }
  }
  
  // Gérer la collection
  const updateCollection = async (type: 'owned' | 'wishlist' | 'favorite') => {
    if (!user || !razor) return
    
    try {
      // Vérifier si l'entrée existe déjà dans la collection
      const { data: existingEntry, error: checkError } = await supabaseClient
        .from('user_collections')
        .select('*')
        .eq('user_id', user.id)
        .eq('razor_id', razor.id)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
        throw checkError
      }
      
      // Définir les valeurs à mettre à jour en fonction du type
      let updateValues = {}
      
      if (type === 'owned') {
        const newValue = !inCollection
        // Pour les rasoirs possédés, nous utilisons in_wishlist = false
        // Si on ajoute à "Je possède", on retire automatiquement de "M'intéresse"
        updateValues = { 
          in_collection: newValue,
          in_wishlist: newValue ? false : inWishlist 
        }
        setInCollection(newValue)
        if (newValue) setInWishlist(false) // Mettre à jour l'état local immédiatement
      } else if (type === 'wishlist') {
        const newValue = !inWishlist
        // Si on ajoute à "M'intéresse", on retire automatiquement de "Je possède"
        updateValues = { 
          in_wishlist: newValue,
          in_collection: newValue ? false : inCollection 
        }
        setInWishlist(newValue)
        if (newValue) setInCollection(false) // Mettre à jour l'état local immédiatement
      } else if (type === 'favorite') {
        const newValue = !isFavorite
        updateValues = { is_favorite: newValue }
        setIsFavorite(newValue)
      }
      
      if (existingEntry) {
        // Mettre à jour l'entrée existante
        const { error: updateError } = await supabaseClient
          .from('user_collections')
          .update(updateValues)
          .eq('user_id', user.id)
          .eq('razor_id', razor.id)
        
        if (updateError) throw updateError
      } else {
        // Créer une nouvelle entrée
        const { error: insertError } = await supabaseClient
          .from('user_collections')
          .insert({
            user_id: user.id,
            razor_id: razor.id,
            in_collection: type === 'owned',
            in_wishlist: type === 'wishlist',
            is_favorite: type === 'favorite'
          })
        
        if (insertError) throw insertError
      }
      
      console.log('Collection updated for:', type)
      
    } catch (err: any) {
      console.error('Error updating collection:', err)
    }
  }
  
  // Partager le rasoir
  const shareRazor = () => {
    if (!razor) return
    
    const shareUrl = `${window.location.origin}/razors/${razor.id}`
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => alert('Lien copié dans le presse-papier!'))
      .catch(err => console.error('Impossible de copier le lien:', err))
  }
  
  const handleDelete = async () => {
    // Demander confirmation avec des informations supplémentaires pour les administrateurs
    let confirmMessage = 'Êtes-vous sûr de vouloir supprimer ce rasoir ?';
    
    if (isAdmin && !isCreator) {
      confirmMessage += '\n\nATTENTION : Vous êtes sur le point de supprimer un rasoir créé par un autre utilisateur. ' +
                        'Cette action supprimera également ce rasoir de toutes les collections d\'utilisateurs.';
    }
    
    if (!confirm(confirmMessage)) return;
    
    setDeleting(true);
    
    try {
      // Supprimer toutes les entrées de collection liées à ce rasoir (pour les admins)
      if (isAdmin) {
        const { error } = await supabaseClient
          .from('razors')
          .delete()
          .eq('id', id);
        
        if (error) {
          throw error;
        }
      } else {
        // Pour les créateurs non-admins, vérifier que le rasoir n'est pas utilisé dans des collections
        const { data: collections, error: collectionsError } = await supabaseClient
          .from('user_collections')
          .select('id')
          .eq('razor_id', id)
          .not('user_id', 'eq', user?.id);
        
        if (collectionsError) {
          throw collectionsError;
        }
        
        if (collections && collections.length > 0) {
          throw new Error('Ce rasoir est utilisé dans la collection d\'autres utilisateurs. Vous ne pouvez pas le supprimer.');
        }
        
        // Supprimer le rasoir
        const { error } = await supabaseClient
          .from('razors')
          .delete()
          .eq('id', id);
        
        if (error) {
          throw error;
        }
      }
      
      // Rediriger vers la liste des rasoirs
      router.push('/razors');
    } catch (error: any) {
      alert(`Erreur lors de la suppression: ${error.message}`);
      setDeleting(false);
    }
  };
  
  const handleClone = () => {
    // Stocker les données du rasoir dans localStorage pour les récupérer sur la page d'ajout
    if (razor) {
      // Supprimer l'ID et les champs qui ne doivent pas être clonés
      const razorToClone = { ...razor }
      delete razorToClone.id
      delete razorToClone.created_at
      delete razorToClone.updated_at
      
      // Ajouter un suffixe au nom pour indiquer qu'il s'agit d'un clone
      razorToClone.name = `${razorToClone.name} (Clone)`
      
      // Stocker les données dans localStorage
      localStorage.setItem('razorToClone', JSON.stringify(razorToClone))
      
      // Rediriger vers la page d'ajout
      router.push('/razors/add?clone=true')
    }
  }
  
  const handleAddToCollection = async () => {
    if (!user) {
      router.push(`/auth/signin?redirect=/razors/${id}`)
      return
    }
    
    if (!razor) return
    
    // Si le rasoir a des variantes, afficher le sélecteur de variantes
    if (
      (razor.material_variant && razor.material_variant.includes(',')) ||
      (razor.available_finish && razor.available_finish.includes(',')) ||
      (razor.comb_type && razor.comb_type.includes(','))
    ) {
      setShowMultiVariantSelector(true)
    } else {
      // Sinon, ajouter directement à la collection
      addToCollection()
    }
  }
  
  const addToCollection = async () => {
    if (!user || !razor) return
    
    try {
      const { error } = await supabaseClient
        .from('user_collections')
        .insert({
          user_id: user.id,
          razor_id: razor.id,
          in_collection: true
        })
      
      if (error) throw error
      
      setInCollection(true)
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout à la collection:', err)
      alert('Erreur lors de l\'ajout à la collection')
    }
  }
  
  const handleVariantSuccess = (variant: RazorVariant) => {
    // Fermer le sélecteur de variante
    setShowVariantSelector(false)
    
    // Mettre à jour la liste des variantes de l'utilisateur
    fetchUserVariants()
    
    // Afficher un message de succès
    setVariantAdded(true)
    setVariantsCount(1)
    
    // Cacher le message après 3 secondes
    setTimeout(() => {
      setVariantAdded(false)
    }, 3000)
    
    // Mettre à jour le statut de collection
    setInCollection(true)
  }
  
  const handleMultiVariantSuccess = (variants: RazorVariant[]) => {
    // Fermer le sélecteur de variante
    setShowMultiVariantSelector(false)
    
    // Mettre à jour la liste des variantes de l'utilisateur
    fetchUserVariants()
    
    // Afficher un message de succès
    setVariantAdded(true)
    setVariantsCount(variants.length)
    
    // Cacher le message après 3 secondes
    setTimeout(() => {
      setVariantAdded(false)
    }, 3000)
    
    // Mettre à jour le statut de collection
    setInCollection(true)
  }

  // Gestion de la comparaison
  const handleComparisonToggle = () => {
    if (!razor) return;
    
    if (isInComparison) {
      // Retirer de la comparaison
      removeFromComparisonList(razor.id);
      setIsInComparison(false);
    } else {
      // Vérifier si on n'a pas déjà 4 rasoirs dans la comparaison
      const currentList = getComparisonList();
      if (currentList.length >= 4) {
        alert('Vous ne pouvez comparer que 4 rasoirs à la fois. Veuillez en retirer un avant d\'en ajouter un autre.');
        return;
      }
      
      // Ajouter à la comparaison
      addToComparisonList(razor.id);
      setIsInComparison(true);
    }
  };

  // Fonction pour aller à la page de comparaison
  const goToComparison = () => {
    router.push('/compare');
  };

  // Mettre à jour l'état isInComparison lorsque l'utilisateur revient à cette page
  useEffect(() => {
    if (razor && razor.id) {
      const handleFocus = () => {
        const comparisonStatus = isInComparisonList(razor.id);
        if (comparisonStatus !== isInComparison) {
          setIsInComparison(comparisonStatus);
        }
      };
      
      // Vérifier immédiatement l'état de la comparaison
      handleFocus();
      
      // Ajouter un écouteur d'événement pour la reprise de focus
      window.addEventListener('focus', handleFocus);
      
      // Nettoyage lors du démontage du composant
      return () => {
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [razor, isInComparison]);

  const getGentlenessLabel = (value: number): string => {
    if (value >= 1 && value <= 3) return "Très doux";
    if (value >= 4 && value <= 7) return "Doux";
    if (value >= 8 && value <= 12) return "Intermédiaire";
    if (value >= 13 && value <= 17) return "Agressif";
    if (value >= 18 && value <= 20) return "Très agressif";
    return "Non évalué";
  }
  
  const getGentlenessColor = (value: number): string => {
    if (value >= 1 && value <= 3) return "#fff176"; // Jaune pâle
    if (value >= 4 && value <= 7) return "#f9bd59"; // Jaune-orange
    if (value >= 8 && value <= 12) return "#e8863b"; // Orange
    if (value >= 13 && value <= 17) return "#d03c1f"; // Rouge-orange
    if (value >= 18 && value <= 20) return "#7e0404"; // Rouge bordeaux
    return "#ffffff";
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <p className="text-center py-12">Chargement des informations...</p>
        </div>
      </div>
    )
  }
  
  if (error || !razor) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <p className="text-center py-12 text-red-500">
            {error || 'Rasoir non trouvé'}
          </p>
          <div className="text-center">
            <Link href="/" className="btn-primary">
              Retour à la liste des rasoirs
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen py-8">
      <Head>
        <title>{razor.manufacturer} {razor.model} | Relife Razor</title>
        <meta name="description" content={`Découvrez le rasoir ${razor.manufacturer} ${razor.model} - Niveau de douceur: ${razor.avg_gentleness}/20`} />
      </Head>
      
      <main className="container mx-auto px-4">
        <div className="mb-6">
          <Link href="/" className="text-primary hover:underline flex items-center gap-2">
            <span aria-hidden="true">&larr;</span> Retour à la liste des rasoirs
          </Link>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Image du rasoir */}
            <div className="md:w-1/3 relative h-64 md:h-auto">
              {razor.image_url ? (
                <div className="relative w-full h-full min-h-[300px]">
                  <SafeImage 
                    src={razor.image_url} 
                    alt={`${razor.manufacturer} ${razor.model}`}
                    width={500}
                    height={500}
                    className="w-full h-full object-contain p-4"
                    objectFit="contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-200 dark:bg-gray-700 min-h-[300px]">
                  <span className="text-gray-500 dark:text-gray-400">Pas d'image</span>
                </div>
              )}
            </div>
            
            {/* Informations du rasoir */}
            <div className="md:w-2/3 p-6">
              {/* En-tête avec titre */}
              <div className="border-b pb-4 mb-4">
                <h1 className="text-3xl font-bold mb-2">
                  {razor.manufacturer} {razor.model}
                  {razor.reference && (
                    <span className="ml-2 text-gray-600 dark:text-gray-400">({razor.reference})</span>
                  )}
                </h1>
                
                {/* Informations principales */}
                <div className="grid grid-cols-2 gap-6 my-4">
                  <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Type de lame</span>
                    <p className="font-medium text-lg">{razor.blade_type}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Niveau de douceur (note communautaire)</span>
                    <div className="flex items-center">
                      <GentlenessIndicator value={razor.avg_gentleness} size="large" />
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        ({razor.gentleness_votes_count || 0} vote{razor.gentleness_votes_count !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Spécifications techniques détaillées */}
                <div className="my-6">
                  <h2 className="text-lg font-semibold mb-3">Spécifications techniques</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {razor.weight_grams && (
                      <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Poids</span>
                        <p className="font-medium">{razor.weight_grams} g</p>
                      </div>
                    )}
                    
                    {razor.gap_mm && (
                      <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">GAP</span>
                        <p className="font-medium">{razor.gap_mm} mm</p>
                      </div>
                    )}
                    
                    {razor.blade_exposure_mm && (
                      <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Exposition de lame</span>
                        <p className="font-medium">{razor.blade_exposure_mm} mm</p>
                      </div>
                    )}
                    
                    {razor.cutting_angle && (
                      <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Angle de coupe</span>
                        <p className="font-medium">{razor.cutting_angle}°</p>
                      </div>
                    )}
                    
                    {razor.price && (
                      <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Prix</span>
                        <p className="font-medium">{razor.price} €</p>
                      </div>
                    )}
                    
                    {razor.base_material && (
                      <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Matériau de base</span>
                        <p className="font-medium">{razor.base_material}</p>
                      </div>
                    )}
                    
                    {razor.material_variant && (
                      <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Variante de matière</span>
                        <p className="font-medium">{razor.material_variant}</p>
                      </div>
                    )}
                    
                    {razor.available_finish && (
                      <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Finition disponible</span>
                        <p className="font-medium">{razor.available_finish}</p>
                      </div>
                    )}
                    
                    {razor.comb_type && (
                      <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Type de peigne</span>
                        <p className="font-medium">{razor.comb_type}</p>
                      </div>
                    )}
                    
                    {razor.release_year && (
                      <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Année de mise en vente</span>
                        <p className="font-medium">{razor.release_year}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Boutons d'action rapide */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <button 
                    onClick={shareRazor}
                    className="px-3 py-2 rounded-md flex items-center bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors duration-200"
                    title="Partager ce rasoir"
                  >
                    <span className="mr-2">📤</span>
                    <span>Partager</span>
                  </button>
                  {(isAdmin || isCreator) && (
                    <Link 
                      href={`/razors/edit/${razor.id}`}
                      className="px-3 py-2 rounded-md flex items-center bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors duration-200"
                      title="Éditer ce rasoir"
                    >
                      <span className="mr-2">✏️</span>
                      <span>Éditer</span>
                    </Link>
                  )}
                  {(isAdmin || isCreator) && (
                    <button 
                      onClick={handleDelete}
                      disabled={deleting}
                      className={`px-3 py-2 rounded-md flex items-center bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-red-200 transition-colors duration-200 ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Supprimer ce rasoir"
                    >
                      <span className="mr-2">🚮</span>
                      <span>Supprimer</span>
                    </button>
                  )}
                  {(isAdmin || isCreator) && (
                    <button 
                      onClick={handleClone}
                      className="px-3 py-2 rounded-md flex items-center bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors duration-200"
                      title="Cloner ce rasoir"
                    >
                      <span className="mr-2">📋</span>
                      <span>Cloner</span>
                    </button>
                  )}
                  <button 
                    onClick={handleComparisonToggle}
                    className={`px-3 py-2 rounded-md flex items-center transition-colors duration-200 ${
                      isInComparison 
                        ? 'bg-green-500 hover:bg-red-500 text-white' 
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                    title={isInComparison ? "Retirer de la comparaison" : "Ajouter à la comparaison"}
                  >
                    <span className="mr-2">{isInComparison ? '✓' : '+'}</span>
                    <span>{isInComparison ? 'Retirer de la comparaison' : 'Ajouter à la comparaison'}</span>
                  </button>
                  {isInComparison && (
                    <button 
                      onClick={goToComparison}
                      className="px-3 py-2 rounded-md flex items-center bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors duration-200"
                      title="Voir la comparaison"
                    >
                      <span className="mr-2">📊</span>
                      <span>Voir la comparaison</span>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Gestion de collection (si connecté) */}
              {user && (
                <div className="border-b pb-4 mb-4">
                  <h2 className="text-lg font-semibold mb-3">Gérer dans ma collection</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <button
                      onClick={() => updateCollection('owned')}
                      className={`p-3 rounded-md flex flex-col items-center justify-center transition-colors ${
                        inCollection 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <span className="text-xl mb-1">✓</span>
                      <span className="text-sm">Je possède ce rasoir</span>
                    </button>
                    
                    <button
                      onClick={() => updateCollection('wishlist')}
                      className={`p-3 rounded-md flex flex-col items-center justify-center transition-colors ${
                        inWishlist 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <span className="text-xl mb-1">🛒</span>
                      <span className="text-sm">Ce rasoir m'intéresse</span>
                    </button>
                    
                    <button
                      onClick={() => updateCollection('favorite')}
                      className={`p-3 rounded-md flex flex-col items-center justify-center transition-colors ${
                        isFavorite 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <span className="text-xl mb-1">⭐</span>
                      <span className="text-sm">Rasoir favori</span>
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        if (user) {
                          setShowMultiVariantSelector(true)
                        } else {
                          router.push(`/auth/signin?redirect=/razors/${id}`)
                        }
                      }}
                      className="bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 px-4 py-2 rounded-md transition-colors duration-200 flex-grow"
                    >
                      {userVariants.length > 0 ? 'Ajouter d\'autres variantes' : 'Ajouter des variantes à ma collection'}
                    </button>
                  </div>
                  
                  {/* Afficher les variantes de l'utilisateur */}
                  {userVariants.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-md font-semibold mb-2">Mes variantes :</h3>
                      <div className="space-y-2">
                        {userVariants.map((variant) => (
                          <div key={variant.id} className="p-3 bg-gray-50 dark:bg-slate-700 rounded-md">
                            <div className="flex justify-between">
                              <div>
                                {variant.selected_material && (
                                  <span className="inline-block mr-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                    {variant.selected_material}
                                  </span>
                                )}
                                {variant.selected_finish && (
                                  <span className="inline-block mr-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                    {variant.selected_finish}
                                  </span>
                                )}
                                {variant.selected_comb_type && (
                                  <span className="inline-block mr-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                    {variant.selected_comb_type}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={async () => {
                                  if (confirm('Êtes-vous sûr de vouloir supprimer cette variante ?')) {
                                    // Vérifier d'abord si c'est une variante de user_collections
                                    if (variant.id.toString().match(/^\d+$/)) {
                                      await supabaseClient
                                        .from('user_collections')
                                        .delete()
                                        .eq('id', parseInt(variant.id))
                                    } else {
                                      await supabaseClient
                                        .from('razor_variants')
                                        .delete()
                                        .eq('id', variant.id)
                                    }
                                    
                                    // Rafraîchir la liste des variantes
                                    fetchUserVariants()
                                  }
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                Supprimer
                              </button>
                            </div>
                            {variant.notes && (
                              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                {variant.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Informations supplémentaires */}
              {/* Section supprimée à la demande de l'utilisateur */}
              
              {/* Liens et actions */}
              <div className="flex flex-col items-center justify-center gap-4 mt-6">                
                {razor.manufacturer === "Atelier Durdan" && (
                  <div className="flex flex-col items-center justify-center w-full">
                    <Link 
                      href="https://atelierdurdan.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 py-3 px-6 rounded-md font-bold text-lg flex items-center justify-center gap-3 transition-colors duration-200 w-full max-w-md"
                    >
                      <span>ACHETER CE RASOIR</span>
                      <img 
                        src="/logos/atelier-durdan-logo.png" 
                        alt="Logo Atelier Durdan" 
                        className="h-15 w-15"
                        style={{ height: '3rem', width: '3rem' }}
                      />
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Créateur de la fiche */}
              {creatorProfile && (
                <div className="mt-6 text-right text-sm text-gray-500 dark:text-gray-400 border-t pt-4">
                  Fiche créée par: <span className="font-medium">{creatorProfile.username || creatorProfile.full_name || "Utilisateur anonyme"}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Échelle de douceur */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden p-6 my-8">
          <h2 className="text-2xl font-semibold mb-4">Niveau de douceur</h2>
          <GentlenessScale razors={[razor, ...similarRazors]} currentRazorId={razor.id} />
        </div>
        
        {/* Section d'évaluation */}
        <RichReviewEditor 
          razorId={parseInt(razor.id)}
          reviews={reviews}
          onReviewsUpdate={(updatedReviews) => {
            setReviews(updatedReviews);
            
            // Recharger également les informations du rasoir pour obtenir le avg_gentleness mis à jour
            supabaseClient
              .from('razors')
              .select('*')
              .eq('id', razor.id)
              .single()
              .then(({ data: updatedRazor, error: razorRefreshError }) => {
                if (razorRefreshError) {
                  console.error('Erreur lors du rechargement des informations du rasoir après mise à jour d\'avis:', razorRefreshError);
                } else if (updatedRazor) {
                  setRazor(updatedRazor);
                  console.log('Valeur avg_gentleness mise à jour après avis:', updatedRazor.avg_gentleness);
                }
              });
          }}
        />
        
        {/* Rasoirs similaires */}
        {similarRazors.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Rasoirs similaires</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {similarRazors.map((similarRazor) => (
                <Link 
                  key={similarRazor.id}
                  href={`/razors/${similarRazor.id}`}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  <div className="font-medium mb-1">
                    {similarRazor.manufacturer} {similarRazor.model}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Douceur: {similarRazor.avg_gentleness}/20
                    <span className="ml-1">
                      ({similarRazor.gentleness_votes_count || 0} vote{similarRazor.gentleness_votes_count !== 1 ? 's' : ''})
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      
      {/* Sélecteur de variante */}
      {showVariantSelector && razor && (
        <VariantSelector
          razor={razor}
          onClose={() => setShowVariantSelector(false)}
          onSuccess={handleVariantSuccess}
        />
      )}
      
      {/* Multi-sélecteur de variantes */}
      {showMultiVariantSelector && razor && (
        <MultiVariantSelector
          razor={razor}
          onClose={() => setShowMultiVariantSelector(false)}
          onSuccess={handleMultiVariantSuccess}
        />
      )}
      
      {/* Message de succès */}
      {variantAdded && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-md shadow-lg z-50">
          {variantsCount > 1 
            ? `${variantsCount} variantes ajoutées à votre collection avec succès !` 
            : "Variante ajoutée à votre collection avec succès !"}
        </div>
      )}
    </div>
  )
}

export default RazorDetailPage
