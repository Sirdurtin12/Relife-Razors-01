import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import Link from 'next/link'
import RazorListItem from '../../components/razors/RazorListItem'
import { UserCollection, UserRating } from '../../lib/supabase'
import CollectionShareButton from '../../components/collections/CollectionShareButton'
import { GetServerSideProps } from 'next'

const CollectionPage = () => {
  const router = useRouter()
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  
  // États pour les données de la collection
  const [ownedRazors, setOwnedRazors] = useState<UserCollection[]>([])
  const [interestedRazors, setInterestedRazors] = useState<UserCollection[]>([])
  const [favoriteRazors, setFavoriteRazors] = useState<UserCollection[]>([])
  const [activeTab, setActiveTab] = useState<'collection' | 'wishlist' | 'favorites'>('collection')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // États pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filterManufacturer, setFilterManufacturer] = useState<string>('')
  const [manufacturers, setManufacturers] = useState<string[]>([])
  
  // Fonction pour initialiser les ratings manquants
  const initializeFavoriteRatings = async () => {
    if (!user || favoriteRazors.length === 0) return;
    
    console.log('Initializing favorite ratings');
    
    try {
      // Vérifier si des rasoirs n'ont pas de rating
      const razorsWithoutRating = favoriteRazors.filter(razor => razor.favorite_rating === null);
      
      if (razorsWithoutRating.length === 0) {
        console.log('All favorite razors already have ratings');
        return;
      }
      
      console.log(`Found ${razorsWithoutRating.length} razors without ratings`);
      
      // Assigner des ratings séquentiels en commençant par le plus haut disponible
      const highestRating = Math.max(...favoriteRazors
        .filter(razor => razor.favorite_rating !== null)
        .map(razor => razor.favorite_rating || 0), 0);
      
      let nextRating = highestRating + 1;
      
      // Mettre à jour chaque rasoir sans rating
      for (const razor of razorsWithoutRating) {
        console.log(`Assigning rating ${nextRating} to razor ${razor.razor_id}`);
        
        const { error } = await supabaseClient
          .from('user_collections')
          .update({ favorite_rating: nextRating })
          .eq('id', razor.id);
        
        if (error) {
          console.error('Error updating rating:', error);
        } else {
          nextRating++;
        }
      }
      
      // Recharger les données des favoris
      await fetchFavorites();
      
    } catch (err) {
      console.error('Error initializing favorite ratings:', err);
    }
  };
  
  // Fonction pour récupérer les favoris
  const fetchFavorites = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabaseClient
        .from('user_collections')
        .select(`
          id,
          razor_id,
          in_wishlist,
          is_favorite,
          favorite_rating,
          variant_material,
          variant_finish,
          variant_comb_type,
          variant_notes,
          is_variant,
          razors (
            id,
            manufacturer,
            model,
            reference,
            image_url,
            blade_type,
            avg_gentleness
          )
        `)
        .eq('user_id', user.id)
        .eq('is_favorite', true)
        .order('favorite_rating', { ascending: false });
      
      if (data) {
        setFavoriteRazors(data);
        return data;
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
    
    return [];
  };

  // Fonctions pour gérer l'ordre des favoris
  const handleMoveUp = async (position: number) => {
    if (position <= 1 || !user) return;
    
    console.log('handleMoveUp called with position:', position);
    
    try {
      // Vérifier si tous les rasoirs ont un rating, sinon les initialiser
      const hasNullRatings = favoriteRazors.some(razor => razor.favorite_rating === null);
      if (hasNullRatings) {
        console.log('Some favorite razors have null ratings, initializing...');
        await initializeFavoriteRatings();
        return; // Sortir pour permettre à l'utilisateur de réessayer après l'initialisation
      }
      
      // Trouver les deux rasoirs à échanger
      const currentRazor = favoriteRazors.find((_, index) => index + 1 === position);
      const upRazor = favoriteRazors.find((_, index) => index + 1 === position - 1);
      
      console.log('Current razor:', currentRazor);
      console.log('Up razor:', upRazor);
      
      if (!currentRazor || !upRazor) {
        console.log('Could not find razors to swap');
        return;
      }
      
      // S'assurer que les deux rasoirs ont des ratings valides
      if (currentRazor.favorite_rating === null || upRazor.favorite_rating === null) {
        console.log('One of the razors has a null rating');
        await initializeFavoriteRatings();
        return;
      }
      
      // Échanger les ratings
      const currentRating = currentRazor.favorite_rating;
      const upRating = upRazor.favorite_rating;
      
      // Mettre à jour le rasoir courant avec la nouvelle position
      const { error: updateCurrentError } = await supabaseClient
        .from('user_collections')
        .update({ favorite_rating: upRating })
        .eq('id', currentRazor.id);
      
      if (updateCurrentError) throw updateCurrentError;
      
      // Mettre à jour le rasoir supérieur avec la nouvelle position
      const { error: updateUpError } = await supabaseClient
        .from('user_collections')
        .update({ favorite_rating: currentRating })
        .eq('id', upRazor.id);
      
      if (updateUpError) throw updateUpError;
      
      // Recharger les données
      const { data } = await supabaseClient
        .from('user_collections')
        .select(`
          id,
          razor_id,
          in_wishlist,
          is_favorite,
          favorite_rating,
          variant_material,
          variant_finish,
          variant_comb_type,
          variant_notes,
          is_variant,
          razors (
            id,
            manufacturer,
            model,
            reference,
            image_url,
            blade_type,
            avg_gentleness
          )
        `)
        .eq('user_id', user.id)
        .eq('is_favorite', true)
        .order('favorite_rating', { ascending: false });
      
      if (data) {
        setFavoriteRazors(data);
      }
      
    } catch (err) {
      console.error('Erreur lors du déplacement du rasoir:', err);
    }
  };
  
  const handleMoveDown = async (position: number) => {
    if (position >= favoriteRazors.length || !user) return;
    
    console.log('handleMoveDown called with position:', position);
    
    try {
      // Vérifier si tous les rasoirs ont un rating, sinon les initialiser
      const hasNullRatings = favoriteRazors.some(razor => razor.favorite_rating === null);
      if (hasNullRatings) {
        console.log('Some favorite razors have null ratings, initializing...');
        await initializeFavoriteRatings();
        return; // Sortir pour permettre à l'utilisateur de réessayer après l'initialisation
      }
      
      // Trouver les deux rasoirs à échanger
      const currentRazor = favoriteRazors.find((_, index) => index + 1 === position);
      const downRazor = favoriteRazors.find((_, index) => index + 1 === position + 1);
      
      console.log('Current razor:', currentRazor);
      console.log('Down razor:', downRazor);
      
      if (!currentRazor || !downRazor) {
        console.log('Could not find razors to swap');
        return;
      }
      
      // S'assurer que les deux rasoirs ont des ratings valides
      if (currentRazor.favorite_rating === null || downRazor.favorite_rating === null) {
        console.log('One of the razors has a null rating');
        await initializeFavoriteRatings();
        return;
      }
      
      // Échanger les ratings
      const currentRating = currentRazor.favorite_rating;
      const downRating = downRazor.favorite_rating;
      
      // Mettre à jour le rasoir courant avec la nouvelle position
      const { error: updateCurrentError } = await supabaseClient
        .from('user_collections')
        .update({ favorite_rating: downRating })
        .eq('id', currentRazor.id);
      
      if (updateCurrentError) throw updateCurrentError;
      
      // Mettre à jour le rasoir inférieur avec la nouvelle position
      const { error: updateDownError } = await supabaseClient
        .from('user_collections')
        .update({ favorite_rating: currentRating })
        .eq('id', downRazor.id);
      
      if (updateDownError) throw updateDownError;
      
      // Recharger les données
      const { data } = await supabaseClient
        .from('user_collections')
        .select(`
          id,
          razor_id,
          in_wishlist,
          is_favorite,
          favorite_rating,
          variant_material,
          variant_finish,
          variant_comb_type,
          variant_notes,
          is_variant,
          razors (
            id,
            manufacturer,
            model,
            reference,
            image_url,
            blade_type,
            avg_gentleness
          )
        `)
        .eq('user_id', user.id)
        .eq('is_favorite', true)
        .order('favorite_rating', { ascending: false });
      
      if (data) {
        setFavoriteRazors(data);
      }
      
    } catch (err) {
      console.error('Erreur lors du déplacement du rasoir:', err);
    }
  };
  
  const handleRemoveFavorite = async (razorId: number) => {
    if (!user) return;
    
    try {
      if (window.confirm('Êtes-vous sûr de vouloir retirer ce rasoir de vos favoris ?')) {
        // Mettre à jour le rasoir pour le retirer des favoris
        const { error } = await supabaseClient
          .from('user_collections')
          .update({ is_favorite: false, favorite_rating: null })
          .eq('user_id', user.id)
          .eq('razor_id', razorId);
        
        if (error) throw error;
        
        // Mettre à jour la liste des favoris
        setFavoriteRazors(favoriteRazors.filter(item => item.razor_id !== razorId));
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du favori:', err);
    }
  };

  // Rasoirs filtrés
  const filteredOwnedRazors = ownedRazors.filter(item => {
    const matchesSearch = searchTerm === '' || 
      (item.razors && 
        (item.razors.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         item.razors.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         item.razors.name?.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesManufacturer = filterManufacturer === '' || 
      (item.razors && item.razors.manufacturer === filterManufacturer);
    
    return matchesSearch && matchesManufacturer;
  });
  
  const filteredInterestedRazors = interestedRazors.filter(item => {
    const matchesSearch = searchTerm === '' || 
      (item.razors && 
        (item.razors.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         item.razors.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         item.razors.name?.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesManufacturer = filterManufacturer === '' || 
      (item.razors && item.razors.manufacturer === filterManufacturer);
    
    return matchesSearch && matchesManufacturer;
  });
  
  // Vérifier si nous sommes côté client
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      router.push('/auth/signin?redirect=/collections')
    }
  }, [user, router])
  
  // Charger les données de la collection
  useEffect(() => {
    const fetchCollectionData = async () => {
      setLoading(true);
      try {
        if (!user) return;
        
        // Récupérer les rasoirs possédés (ceux qui ne sont pas dans la liste de souhaits)
        const { data: ownedRazorsData } = await supabaseClient
          .from('user_collections')
          .select(`
            id,
            razor_id,
            in_wishlist,
            is_favorite,
            variant_material,
            variant_finish,
            variant_comb_type,
            variant_notes,
            is_variant,
            razors (
              id,
              manufacturer,
              model,
              reference,
              image_url,
              blade_type,
              avg_gentleness
            )
          `)
          .eq('user_id', user.id)
          .eq('in_wishlist', false)
        
        if (ownedRazorsData) {
          setOwnedRazors(ownedRazorsData)
        }
        
        // Récupérer les rasoirs qui intéressent l'utilisateur
        const { data: interestedRazorsData } = await supabaseClient
          .from('user_collections')
          .select(`
            id,
            razor_id,
            in_wishlist,
            is_favorite,
            variant_material,
            variant_finish,
            variant_comb_type,
            variant_notes,
            is_variant,
            razors (
              id,
              manufacturer,
              model,
              reference,
              image_url,
              blade_type,
              avg_gentleness
            )
          `)
          .eq('user_id', user.id)
          .eq('in_wishlist', true)
        
        if (interestedRazorsData) {
          setInterestedRazors(interestedRazorsData)
        }
        
        // Récupérer les rasoirs favoris
        const { data: favoriteRazorsData } = await supabaseClient
          .from('user_collections')
          .select(`
            id,
            razor_id,
            in_wishlist,
            is_favorite,
            favorite_rating,
            variant_material,
            variant_finish,
            variant_comb_type,
            variant_notes,
            is_variant,
            razors (
              id,
              manufacturer,
              model,
              reference,
              image_url,
              blade_type,
              avg_gentleness
            )
          `)
          .eq('user_id', user.id)
          .eq('is_favorite', true)
          .order('favorite_rating', { ascending: false });
        
        if (favoriteRazorsData) {
          setFavoriteRazors(favoriteRazorsData)
          
          // Vérifier si des ratings sont manquants et les initialiser si nécessaire
          const hasNullRatings = favoriteRazorsData.some(razor => razor.favorite_rating === null);
          if (hasNullRatings && favoriteRazorsData.length > 0) {
            console.log('Des ratings manquants détectés lors du chargement, initialisation...');
            // Attendre que l'état soit mis à jour avant d'initialiser
            setTimeout(() => initializeFavoriteRatings(), 500);
          }
        }
        
        // Récupérer tous les fabricants pour le filtre
        if (ownedRazorsData || interestedRazorsData) {
          const allManufacturers = new Set<string>()
          
          if (ownedRazorsData) {
            ownedRazorsData.forEach(razor => {
              if ((razor.razors as any)?.manufacturer) {
                allManufacturers.add((razor.razors as any).manufacturer)
              }
            })
          }
          
          if (interestedRazorsData) {
            interestedRazorsData.forEach(razor => {
              if ((razor.razors as any)?.manufacturer) {
                allManufacturers.add((razor.razors as any).manufacturer)
              }
            })
          }
          
          setManufacturers(Array.from(allManufacturers).sort())
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Erreur lors de la récupération des données :', error)
        setError('Une erreur est survenue lors de la récupération des données.')
        setLoading(false)
      }
    }
    
    if (user) {
      fetchCollectionData()
    }
  }, [user, supabaseClient])
  
  if (!user) {
    return <div className="container mx-auto py-10 px-6">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-8 pb-16">
      <Head>
        <title>Ma Collection de Rasoirs - Relife Razor</title>
        <meta name="description" content="Gérez votre collection personnelle de rasoirs traditionnels, votre liste de souhaits et vos favoris" />
      </Head>

      <main className="container mx-auto px-4 max-w-6xl">
        {/* Titre de la page */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-high-contrast mb-2">Ma Collection</h1>
          <p className="text-medium-contrast">Gérez vos rasoirs, votre liste de souhaits et vos favoris</p>
        </div>

        {/* Onglets de navigation */}
        <div className="flex mb-8 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('collection')}
            className={`px-4 py-2 text-base font-medium border-b-2 whitespace-nowrap ${activeTab === 'collection' ? 'border-primary text-primary dark:border-primary-light dark:text-primary-light' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            aria-current={activeTab === 'collection' ? 'page' : undefined}
          >
            <span className="mr-2">🪒</span> Collection
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`px-4 py-2 text-base font-medium border-b-2 whitespace-nowrap ${activeTab === 'wishlist' ? 'border-primary text-primary dark:border-primary-light dark:text-primary-light' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            aria-current={activeTab === 'wishlist' ? 'page' : undefined}
          >
            <span className="mr-2">💭</span> Liste de souhaits
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-2 text-base font-medium border-b-2 whitespace-nowrap ${activeTab === 'favorites' ? 'border-primary text-primary dark:border-primary-light dark:text-primary-light' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            aria-current={activeTab === 'favorites' ? 'page' : undefined}
          >
            <span className="mr-2">⭐</span> Favoris
          </button>
        </div>

        {!user ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-high-contrast">Connectez-vous pour accéder à votre collection</h2>
            <p className="mb-6 text-medium-contrast">Vous devez être connecté pour voir et gérer votre collection de rasoirs.</p>
            <Link href="/auth/signin?redirect=/collections" className="btn-primary">
              Se connecter
            </Link>
          </div>
        ) : loading ? (
          <div className="py-12 text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-medium-contrast">Chargement de votre collection...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            <p className="text-lg font-bold">Une erreur est survenue</p>
            <p>{error}</p>
          </div>
        ) : (
          <div>
            {/* Contenu de l'onglet actif */}
            {activeTab === 'collection' && (
              <div>
                <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 mb-8">
                  <div className="flex flex-wrap justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-high-contrast">Vos rasoirs ({ownedRazors.length})</h2>
                    
                    <Link href="/razors/add?owned=true" className="btn-primary">
                      Ajouter un rasoir à ma collection
                    </Link>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Rechercher dans votre collection..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field w-full focus-outline"
                      />
                    </div>
                    
                    <div className="md:w-64">
                      <select
                        value={filterManufacturer}
                        onChange={(e) => setFilterManufacturer(e.target.value)}
                        className="input-field w-full focus-outline"
                      >
                        <option value="">Tous les fabricants</option>
                        {manufacturers.map(manufacturer => (
                          <option key={manufacturer} value={manufacturer}>
                            {manufacturer}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {filteredOwnedRazors.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-medium-contrast mb-4">Vous n'avez pas encore de rasoirs dans votre collection</p>
                      <Link href="/razors/add?owned=true" className="btn-primary">
                        Ajouter mon premier rasoir
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {filteredOwnedRazors.map((item, index) => (
                        <div key={index} className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                          <RazorListItem
                            razor={{
                              ...item.razors,
                              id: item.razor_id,
                              name: item.razors.model,
                              description: ''
                            }}
                            isAdmin={false}
                            isCollectionItem
                            collectionItemId={item.id}
                            isVariant={item.is_variant}
                            variantData={{
                              material: item.variant_material,
                              finish: item.variant_finish,
                              combType: item.variant_comb_type,
                              notes: item.variant_notes
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'wishlist' && (
              <div>
                <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 mb-8">
                  <div className="flex flex-wrap justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-high-contrast">Liste de souhaits ({interestedRazors.length})</h2>
                    
                    <Link href="/razors/add?wishlist=true" className="btn-primary">
                      Ajouter un rasoir à ma liste
                    </Link>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Rechercher dans votre liste de souhaits..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field w-full focus-outline"
                      />
                    </div>
                    
                    <div className="md:w-64">
                      <select
                        value={filterManufacturer}
                        onChange={(e) => setFilterManufacturer(e.target.value)}
                        className="input-field w-full focus-outline"
                      >
                        <option value="">Tous les fabricants</option>
                        {manufacturers.map(manufacturer => (
                          <option key={manufacturer} value={manufacturer}>
                            {manufacturer}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {filteredInterestedRazors.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-medium-contrast mb-4">Vous n'avez pas encore de rasoirs dans votre liste de souhaits</p>
                      <Link href="/razors/add?wishlist=true" className="btn-primary">
                        Ajouter mon premier rasoir souhaité
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {filteredInterestedRazors.map((item, index) => (
                        <div key={index} className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                          <RazorListItem
                            razor={{
                              ...item.razors,
                              id: item.razor_id,
                              name: item.razors.model,
                              description: ''
                            }}
                            isAdmin={false}
                            isCollectionItem
                            collectionItemId={item.id}
                            isWishlistItem
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'favorites' && (
              <div>
                <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 mb-8">
                  <div className="flex flex-wrap justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-high-contrast">Rasoirs favoris ({favoriteRazors.length})</h2>
                    
                    <div className="flex space-x-2">
                      <CollectionShareButton type="favorites" razors={favoriteRazors} />
                      <CollectionShareButton 
                        type="favorites" 
                        razors={favoriteRazors} 
                        topCount={3} 
                        label="Partager podium" 
                        icon="🏆"
                      />
                    </div>
                  </div>
                  
                  {favoriteRazors.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-medium-contrast mb-4">Vous n'avez pas encore de rasoirs favoris</p>
                      <p className="text-medium-contrast mb-4">Ajoutez des rasoirs à vos favoris pour les voir apparaître ici</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {favoriteRazors.map((item, index) => (
                        <div key={index} className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-2xl mr-2">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}</span>
                              {item.favorite_rating !== null && (
                                <div className="flex space-x-2 mr-4">
                                  <button 
                                    onClick={() => handleMoveUp(index + 1)}
                                    disabled={index === 0}
                                    className={`p-1 rounded-full ${index === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                                    aria-label="Monter dans le classement"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => handleMoveDown(index + 1)}
                                    disabled={index === favoriteRazors.length - 1}
                                    className={`p-1 rounded-full ${index === favoriteRazors.length - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                                    aria-label="Descendre dans le classement"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                            <button 
                              onClick={() => handleRemoveFavorite(item.razor_id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100"
                              aria-label="Retirer des favoris"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m-1.5 0a.5.5 0 001 0V4.5a.5.5 0 10-1 0v2.25z" />
                              </svg>
                            </button>
                          </div>
                          <RazorListItem
                            razor={{
                              ...item.razors,
                              id: item.razor_id,
                              name: item.razors.model,
                              description: ''
                            }}
                            isAdmin={false}
                            isCollectionItem
                            collectionItemId={item.id}
                            isVariant={item.is_variant}
                            showRank={false}
                            isWishlistItem={item.in_wishlist}
                            variantData={{
                              material: item.variant_material,
                              finish: item.variant_finish,
                              combType: item.variant_comb_type,
                              notes: item.variant_notes
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// Fonction côté serveur - sans traduction
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  }
}

export default CollectionPage
