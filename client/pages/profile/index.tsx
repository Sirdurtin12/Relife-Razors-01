import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import Loading from '../../components/Loading';
import SafeImage from '../../components/SafeImage';
import { formatDate } from '../../utils/formatters';
import UserRankBadge from '../../components/profile/UserRankBadge';
import { getUserRank, UserStats } from '../../utils/userLevel';

const ProfilePage = () => {
  const router = useRouter()
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  
  // États pour les données utilisateur
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Statistiques utilisateur
  const [stats, setStats] = useState<UserStats>({
    razorsCreated: 0,
    commentsPosted: 0,
    reviewsPosted: 0,
    likesReceived: 0,
    ownedRazors: 0,
    wishlistedRazors: 0,
    favoriteRazors: 0
  })
  
  // Vérifier si nous sommes côté client
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Rediriger si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      router.push('/auth/signin?redirect=/profile')
    }
  }, [user, router])
  
  // Charger les données du profil
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        console.log('Aucun utilisateur connecté');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Récupération des données utilisateur pour:', user.id);
        
        // Récupérer les informations de profil et vérifier si l'utilisateur est administrateur
        const { data: profileData, error: profileError } = await supabaseClient
          .from('profiles')
          .select('username, bio, is_admin')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Erreur lors de la récupération du profil:', profileError);
          setError(`Erreur lors de la récupération du profil: ${profileError.message}`);
          setLoading(false);
          return;
        }
        
        if (!profileData) {
          console.error('Profil non trouvé, création d\'un profil par défaut');
          // Créer un profil par défaut pour l'utilisateur si aucun n'existe
          const { data: newProfile, error: createProfileError } = await supabaseClient
            .from('profiles')
            .insert([
              { 
                id: user.id, 
                username: user.email?.split('@')[0] || 'utilisateur', 
                bio: '', 
                is_admin: false 
              }
            ])
            .select()
            .single();
          
          if (createProfileError) {
            console.error('Erreur lors de la création du profil:', createProfileError);
            setError(`Erreur lors de la création du profil: ${createProfileError.message}`);
            setLoading(false);
            return;
          }
          
          setProfile(newProfile);
          setUsername(newProfile?.username || '');
          setBio(newProfile?.bio || '');
          setIsAdmin(newProfile?.is_admin || false);
        } else {
          console.log('Données de profil récupérées:', profileData);
          setProfile(profileData);
          setUsername(profileData.username || '');
          setBio(profileData.bio || '');
          setIsAdmin(profileData.is_admin || false);
        }
        
        // Récupérer les statistiques générales
        const newStats = {
          razorsCreated: 0,
          commentsPosted: 0,
          reviewsPosted: 0,
          likesReceived: 0,
          ownedRazors: 0,
          wishlistedRazors: 0,
          favoriteRazors: 0,
          joinDate: '',
          lastLogin: ''
        };
        
        console.log('Récupération des statistiques...');
        
        // Utiliser la fonction SQL pour récupérer toutes les statistiques en une seule fois
        try {
          const { data: userStats, error: statsError } = await supabaseClient
            .rpc('get_simple_user_stats', { user_id_param: user.id });
          
          console.log('Statistiques utilisateur récupérées:', userStats, statsError);
          
          if (!statsError && userStats) {
            newStats.razorsCreated = userStats.razors_created;
            newStats.commentsPosted = userStats.comments_posted;
            newStats.reviewsPosted = userStats.reviews_posted;
            newStats.likesReceived = userStats.likes_received;
            newStats.ownedRazors = userStats.owned_razors;
            newStats.wishlistedRazors = userStats.wishlisted_razors;
            newStats.favoriteRazors = userStats.favorite_razors;
          } else {
            console.error('Erreur lors de la récupération des statistiques:', statsError);
            
            // Méthode de repli - récupérer les statistiques individuellement
            try {
              // Compter les rasoirs créés par l'utilisateur
              const { count: razorsCreatedCount, error: razorsCreatedError } = await supabaseClient
                .from('razors')
                .select('id', { count: 'exact', head: true })
                .eq('created_by', user.id);
              
              console.log('Comptage des rasoirs créés:', { count: razorsCreatedCount, error: razorsCreatedError });
              
              if (!razorsCreatedError) {
                newStats.razorsCreated = razorsCreatedCount || 0;
              }
            } catch (err) {
              console.error('Erreur lors du comptage des rasoirs créés:', err);
            }
            
            try {
              // Compter les commentaires postés
              const { count: commentsCount, error: commentsError } = await supabaseClient
                .from('review_comments')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id);
              
              console.log('Comptage des commentaires postés:', { count: commentsCount, error: commentsError });
              
              if (!commentsError) {
                newStats.commentsPosted = commentsCount || 0;
              }
            } catch (err) {
              console.error('Erreur lors du comptage des commentaires:', err);
            }
            
            try {
              // Compter les avis postés
              const { count: reviewsCount, error: reviewsError } = await supabaseClient
                .from('razor_reviews')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id);
              
              console.log('Comptage des avis postés:', { count: reviewsCount, error: reviewsError });
              
              if (!reviewsError) {
                newStats.reviewsPosted = reviewsCount || 0;
              }
            } catch (err) {
              console.error('Erreur lors du comptage des avis:', err);
            }
            
            try {
              // Compter les likes reçus sur les avis
              const { data: reviewsWithLikes, error: reviewsLikesError } = await supabaseClient
                .from('razor_reviews')
                .select('likes_count')
                .eq('user_id', user.id);
              
              console.log('Récupération des likes sur avis:', { data: reviewsWithLikes, error: reviewsLikesError });
              
              if (!reviewsLikesError && reviewsWithLikes) {
                newStats.likesReceived = reviewsWithLikes.reduce((total, review) => total + (review.likes_count || 0), 0);
              }
            } catch (err) {
              console.error('Erreur lors du comptage des likes reçus:', err);
            }
            
            try {
              // Compter les rasoirs possédés
              const { count: ownedCount, error: ownedError } = await supabaseClient
                .from('user_collections')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('in_collection', true);
              
              console.log('Comptage des rasoirs possédés:', { count: ownedCount, error: ownedError });
              
              if (!ownedError) {
                newStats.ownedRazors = ownedCount || 0;
              }
            } catch (err) {
              console.error('Erreur lors du comptage des rasoirs possédés:', err);
            }
            
            try {
              // Compter les rasoirs dans la liste de souhaits
              const { count: wishlistCount, error: wishlistError } = await supabaseClient
                .from('user_collections')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('in_wishlist', true);
              
              console.log('Comptage des rasoirs en liste de souhaits:', { count: wishlistCount, error: wishlistError });
              
              if (!wishlistError) {
                newStats.wishlistedRazors = wishlistCount || 0;
              }
            } catch (err) {
              console.error('Erreur lors du comptage des rasoirs en liste de souhaits:', err);
            }
            
            try {
              // Compter les rasoirs favoris
              const { count: favoritesCount, error: favoritesError } = await supabaseClient
                .from('user_collections')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_favorite', true);
              
              console.log('Comptage des rasoirs favoris:', { count: favoritesCount, error: favoritesError });
              
              if (!favoritesError) {
                newStats.favoriteRazors = favoritesCount || 0;
              }
            } catch (err) {
              console.error('Erreur lors du comptage des rasoirs favoris:', err);
            }
          }
          
          console.log('Statistiques finales:', newStats);
          setStats(newStats);
        } catch (statsError) {
          console.error('Erreur globale lors de la récupération des statistiques:', statsError);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur :', error);
        setError('Une erreur est survenue lors du chargement de votre profil.');
      }
      
      setLoading(false);
    };
    
    if (user) {
      fetchUserData();
    }
  }, [user, supabaseClient]);
  
  // Mettre à jour le profil
  const updateProfile = async () => {
    if (!user || !username) return;
    
    setLoading(true);
    
    const { error } = await supabaseClient
      .from('profiles')
      .update({
        username,
        bio
      })
      .eq('id', user.id);
    
    if (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast.error('Erreur lors de la mise à jour du profil');
      setLoading(false);
      return;
    }
    
    setEditMode(false);
    setLoading(false);
    toast.success('Profil mis à jour avec succès');
  };
  
  // Déconnexion
  const handleSignOut = async () => {
    await supabaseClient.auth.signOut()
    router.push('/')
  }
  
  if (!isClient || !user) {
    return <div className="container mx-auto py-10 px-6">Chargement...</div>
  }
  
  return (
    <div>
      <Head>
        <title>Mon Profil | Relife Razor</title>
        <meta name="description" content="Gérez votre profil et consultez vos statistiques" />
      </Head>
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-8">
          {editMode ? (
            <div>
              <h1 className="text-3xl font-bold mb-6">Modifier mon profil</h1>
              
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium" htmlFor="username">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  id="username"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Votre nom d'utilisateur"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium" htmlFor="bio">
                  Biographie
                </label>
                <textarea
                  id="bio"
                  className="w-full p-3 min-h-[100px] border border-gray-300 dark:border-gray-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Parlez-nous de vous et de votre expérience avec les rasoirs traditionnels..."
                />
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={updateProfile} 
                  className="btn-primary" 
                  disabled={loading}
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button 
                  onClick={() => {
                    setEditMode(false)
                    setUsername(profile?.username || '')
                    setBio(profile?.bio || '')
                  }}
                  className="btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Mon Profil</h1>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setEditMode(true)}
                    className="btn-secondary"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="btn-outline"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">
                  {username || 'Utilisateur'}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {user.email}
                </p>
                {bio && (
                  <div className="mt-4 text-gray-700 dark:text-gray-200">
                    {bio}
                  </div>
                )}
                {isAdmin && (
                  <div className="mt-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Administrateur
                    </span>
                  </div>
                )}
                <div className="mt-4 mb-6">
                  <UserRankBadge userRank={getUserRank(stats)} />
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Vos statistiques</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/collections" className="bg-gray-100 dark:bg-slate-700 px-4 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                    <span className="block text-sm text-gray-600 dark:text-gray-300">Rasoirs possédés</span>
                    <span className="text-xl font-bold">{stats.ownedRazors}</span>
                  </Link>
                  
                  <Link href="/collections?tab=wishlist" className="bg-gray-100 dark:bg-slate-700 px-4 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                    <span className="block text-sm text-gray-600 dark:text-gray-300">Liste de souhaits</span>
                    <span className="text-xl font-bold">{stats.wishlistedRazors}</span>
                  </Link>
                  
                  <Link href="/collections?tab=favorites" className="bg-gray-100 dark:bg-slate-700 px-4 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                    <span className="block text-sm text-gray-600 dark:text-gray-300">Rasoirs favoris</span>
                    <span className="text-xl font-bold">{stats.favoriteRazors}</span>
                  </Link>
                  
                  <div className="bg-gray-100 dark:bg-slate-700 px-4 py-3 rounded-lg">
                    <span className="block text-sm text-gray-600 dark:text-gray-300">Rasoirs créés</span>
                    <span className="text-xl font-bold">{stats.razorsCreated}</span>
                  </div>
                  
                  <div className="bg-gray-100 dark:bg-slate-700 px-4 py-3 rounded-lg">
                    <span className="block text-sm text-gray-600 dark:text-gray-300">Avis publiés</span>
                    <span className="text-xl font-bold">{stats.reviewsPosted}</span>
                  </div>
                  
                  <div className="bg-gray-100 dark:bg-slate-700 px-4 py-3 rounded-lg">
                    <span className="block text-sm text-gray-600 dark:text-gray-300">Commentaires</span>
                    <span className="text-xl font-bold">{stats.commentsPosted}</span>
                  </div>
                  
                  <div className="bg-gray-100 dark:bg-slate-700 px-4 py-3 rounded-lg">
                    <span className="block text-sm text-gray-600 dark:text-gray-300">J'aimes reçus</span>
                    <span className="text-xl font-bold">{stats.likesReceived}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {!editMode && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Activité récente</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <svg className="animate-spin h-8 w-8 mx-auto text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-2 text-gray-600 dark:text-gray-300">Chargement de l'activité...</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300">
                  Fonctionnalité en cours de développement
                </p>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-8 flex justify-center">
          {editMode ? (
            <div className="flex gap-4">
              <button 
                onClick={updateProfile} 
                className="btn-primary" 
                disabled={loading}
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button 
                onClick={() => setEditMode(false)} 
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setEditMode(true)} 
              className="btn-primary"
            >
              Modifier mon profil
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
