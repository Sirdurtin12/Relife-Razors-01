import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import SafeImage from '@/components/common/SafeImage';
import type { GetServerSideProps } from 'next';

// Fonction pour parser une date ISO
const parseISO = (dateString: string) => {
  return new Date(dateString);
};

// Types pour les données partagées
interface SharedRazor {
  id: string;
  razor_id: string;
  is_favorite?: boolean;
  favorite_rating?: number;
  variant_material?: string;
  variant_finish?: string;
  variant_comb_type?: string;
  variant_notes?: string;
  is_variant?: boolean;
  in_wishlist?: boolean;
  razors: {
    id: string;
    manufacturer: string;
    model: string;
    reference?: string;
    image_url?: string;
    blade_type?: string;
    avg_gentleness?: number;
  };
}

interface SharedCollectionData {
  type: 'favorites' | 'owned' | 'wishlist';
  razors: SharedRazor[];
  topCount?: number;
  creator?: {
    username: string;
    rank: string;
  };
}

interface SharedCollection {
  success: boolean;
  data: SharedCollectionData;
  sharedAt: string;
  expiresAt: string;
}

const SharedCollectionPage: React.FC = () => {
  const router = useRouter();
  const { token } = router.query;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionData, setCollectionData] = useState<SharedCollectionData | null>(null);
  const [sharedInfo, setSharedInfo] = useState<{ sharedAt: string; expiresAt: string } | null>(null);

  // Utiliser la locale française pour les dates
  const dateLocale = fr;

  // Récupérer les données de la collection partagée
  useEffect(() => {
    async function fetchSharedCollection() {
      if (!token) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/collections/shared/${token}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Erreur lors de la récupération de la collection partagée');
        }
        
        setCollectionData(result.data);
        setSharedInfo({
          sharedAt: result.sharedAt,
          expiresAt: result.expiresAt
        });
      } catch (error) {
        console.error('Error fetching shared collection:', error);
        setError('Ce lien de partage a expiré ou n\'est plus valide');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSharedCollection();
  }, [token]);

  // Déterminer le titre de la page en fonction du type de collection
  const getCollectionTitle = () => {
    if (!collectionData) return 'Collection partagée';
    
    switch (collectionData.type) {
      case 'favorites':
        if (collectionData.topCount && collectionData.topCount > 0) {
          return collectionData.topCount === 3 
            ? 'Podium de rasoirs favoris' 
            : `Top ${collectionData.topCount} des rasoirs favoris`;
        }
        return 'Rasoirs favoris';
      case 'owned':
        return 'Collection de rasoirs';
      case 'wishlist':
        return 'Liste de souhaits';
      default:
        return 'Collection partagée';
    }
  };

  // Déterminer l'icône pour le titre
  const getCollectionIcon = () => {
    if (!collectionData) return '📋';
    
    switch (collectionData.type) {
      case 'favorites':
        if (collectionData.topCount && collectionData.topCount > 0) {
          return collectionData.topCount === 3 ? '🏆' : '🔝';
        }
        return '⭐';
      case 'owned':
        return '🪒';
      case 'wishlist':
        return '🎁';
      default:
        return '📋';
    }
  };

  return (
    <>
      <Head>
        <title>{getCollectionTitle()} - Relife Razor</title>
        <meta name="description" content="Collection de rasoirs traditionnels partagée sur Relife Razor" />
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Chargement de la collection partagée...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-red-600 text-xl font-medium mb-4">Erreur</h2>
            <p className="text-red-700">{error}</p>
            <div className="mt-6">
              <Link href="/" className="text-blue-600 hover:underline">
                Retour à l'accueil
              </Link>
            </div>
          </div>
        ) : collectionData && sharedInfo ? (
          <>
            <div className="bg-white shadow rounded-lg p-6">
              <h1 className="text-2xl font-bold mb-2 flex items-center">
                <span className="mr-2">{getCollectionIcon()}</span>
                {getCollectionTitle()}
              </h1>
              
              {collectionData.creator && (
                <div className="mb-4">
                  <div className="flex flex-wrap items-center text-gray-700 mb-2">
                    <span className="text-sm mr-2">Par</span>
                    <span className="font-medium text-gray-900">{collectionData.creator.username}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      {collectionData.creator.rank}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="mb-6 text-sm text-gray-600">
                <p>
                  Partagé le {format(parseISO(sharedInfo.sharedAt), 'PPP', { locale: dateLocale })}
                  {' • '}
                  Expire le {format(parseISO(sharedInfo.expiresAt), 'PPP', { locale: dateLocale })}
                </p>
              </div>
              
              {collectionData.razors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Cette collection ne contient aucun rasoir</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {collectionData.razors.map((item, index) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Médaille ou position dans le classement */}
                        {collectionData.type === 'favorites' && (
                          <div className="flex items-center justify-center md:justify-start">
                            <span className="text-3xl">
                              {index === 0 && '🥇'}
                              {index === 1 && '🥈'}
                              {index === 2 && '🥉'}
                              {index > 2 && `${index + 1}`}
                            </span>
                          </div>
                        )}
                        
                        {/* Image du rasoir */}
                        <div className="flex-shrink-0 flex items-center justify-center w-full md:w-32 h-32">
                          <SafeImage
                            src={item.razors.image_url || '/images/razor-placeholder.png'}
                            alt={`${item.razors.manufacturer} ${item.razors.model}`}
                            fallbackSrc="/images/razor-placeholder.png"
                            className="max-h-32 max-w-full object-contain rounded"
                          />
                        </div>
                        
                        {/* Informations sur le rasoir */}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">
                            {item.razors.manufacturer} {item.razors.model}
                            {item.razors.reference && ` (${item.razors.reference})`}
                          </h3>
                          
                          <div className="mt-2 text-sm text-gray-600 space-y-1">
                            {item.razors.blade_type && (
                              <p>
                                <span className="font-medium">Type de lame:</span>{' '}
                                {item.razors.blade_type === 'DE' && 'Double Edge'}
                                {item.razors.blade_type === 'SE' && 'Single Edge'}
                                {item.razors.blade_type === 'AC' && 'Artist Club'}
                                {item.razors.blade_type === 'GEM' && 'GEM'}
                                {item.razors.blade_type === 'other' && 'Autre'}
                                {item.razors.blade_type !== 'DE' && 
                                 item.razors.blade_type !== 'SE' && 
                                 item.razors.blade_type !== 'AC' && 
                                 item.razors.blade_type !== 'GEM' && 
                                 item.razors.blade_type !== 'other' && item.razors.blade_type}
                              </p>
                            )}
                            
                            {item.razors.avg_gentleness && (
                              <p>
                                <span className="font-medium">Niveau de douceur:</span>{' '}
                                {item.razors.avg_gentleness.toFixed(1)}/20
                                {item.razors.avg_gentleness <= 3 && ' (Très doux)'}
                                {item.razors.avg_gentleness > 3 && item.razors.avg_gentleness <= 7 && ' (Doux)'}
                                {item.razors.avg_gentleness > 7 && item.razors.avg_gentleness <= 12 && ' (Intermédiaire)'}
                                {item.razors.avg_gentleness > 12 && item.razors.avg_gentleness <= 17 && ' (Agressif)'}
                                {item.razors.avg_gentleness > 17 && ' (Très agressif)'}
                              </p>
                            )}
                            
                            {/* Affichage des informations de variante si présentes */}
                            {item.is_variant && (
                              <div className="mt-2 p-2 bg-blue-50 rounded">
                                <p className="font-medium text-blue-800">Variante personnalisée</p>
                                <div className="text-blue-700 mt-1 text-sm">
                                  {item.variant_material && (
                                    <p><span className="font-medium">Matériau:</span> {item.variant_material}</p>
                                  )}
                                  {item.variant_finish && (
                                    <p><span className="font-medium">Finition:</span> {item.variant_finish}</p>
                                  )}
                                  {item.variant_comb_type && (
                                    <p><span className="font-medium">Type de peigne:</span> {item.variant_comb_type}</p>
                                  )}
                                  {item.variant_notes && (
                                    <p><span className="font-medium">Notes:</span> {item.variant_notes}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4">
                            <Link 
                              href={`/razors/${item.razors.id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                            >
                              Voir la fiche du rasoir
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 mb-4">
                Cette collection a été partagée depuis <strong>Relife Razor</strong>, la base de données collaborative de rasoirs traditionnels.
              </p>
              <Link href="/" className="text-blue-600 hover:underline">
                Découvrir Relife Razor
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
};

// Fonction côté serveur - sans traduction
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};

export default SharedCollectionPage;
