import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

interface CollectionShareButtonProps {
  collectionType: 'favorites' | 'owned' | 'wishlist';
  className?: string;
}

const CollectionShareButton: React.FC<CollectionShareButtonProps> = ({
  collectionType,
  className = '',
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [bbCode, setBbCode] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [bbCodeCopied, setBbCodeCopied] = useState(false);
  const [topCount, setTopCount] = useState(0);
  const [isTopOptionsVisible, setIsTopOptionsVisible] = useState(false);

  // Fonction pour générer un lien de partage
  const handleShare = async (limit?: number) => {
    setIsSharing(true);
    setShareUrl(null);
    setBbCode(null);
    
    try {
      const response = await fetch('/api/collections/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          collectionType,
          limit
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erreur de partage');
      }
      
      setShareUrl(result.data.shareUrl);
      setBbCode(result.data.bbCode);
      setIsShareModalOpen(true);
    } catch (error) {
      console.error('Error sharing collection:', error);
      toast.error('Impossible de partager la collection');
    } finally {
      setIsSharing(false);
      setIsTopOptionsVisible(false);
    }
  };

  // Afficher les options de Top X pour les favoris
  const showTopOptions = () => {
    if (collectionType === 'favorites') {
      setIsTopOptionsVisible(true);
    } else {
      handleShare();
    }
  };

  // Copier le lien dans le presse-papiers
  const copyToClipboard = (text: string, type: 'lien' | 'bbcode') => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success(type === 'lien' ? 'Lien copié dans le presse-papiers' : 'BBCode copié dans le presse-papiers');
      },
      (err) => {
        console.error('Impossible de copier: ', err);
        toast.error('Erreur lors de la copie');
      }
    );
  };

  // Fermer la modal
  const closeShareModal = () => {
    setIsShareModalOpen(false);
  };

  // Nom du type de collection en français
  const getCollectionTypeName = () => {
    switch (collectionType) {
      case 'favorites':
        return 'favoris';
      case 'owned':
        return 'collection';
      case 'wishlist':
        return 'liste de souhaits';
    }
  };

  return (
    <>
      <button
        onClick={showTopOptions}
        disabled={isSharing}
        className={`flex items-center px-3 py-2 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 transition-colors ${
          isSharing ? 'opacity-70 cursor-wait' : ''
        } ${className}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        {isSharing ? 'Partage en cours...' : `Partager mes ${getCollectionTypeName()}`}
      </button>

      {/* Options de partage pour les Top favoris */}
      {isTopOptionsVisible && collectionType === 'favorites' && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Partager mes favoris
            </h2>
            
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Choisissez comment partager vos favoris
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => handleShare()}
                  className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center justify-center"
                >
                  <span className="mr-2">⭐</span>
                  Tous mes favoris
                </button>
                
                <button 
                  onClick={() => handleShare(10)}
                  className="w-full py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md flex items-center justify-center"
                >
                  <span className="mr-2">🏆</span>
                  Top 10 favoris
                </button>
                
                <button 
                  onClick={() => handleShare(5)}
                  className="w-full py-3 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-md flex items-center justify-center"
                >
                  <span className="mr-2">🥇</span>
                  Top 5 favoris
                </button>
                
                <button 
                  onClick={() => handleShare(3)}
                  className="w-full py-3 px-4 bg-pink-500 hover:bg-pink-600 text-white rounded-md flex items-center justify-center"
                >
                  <span className="mr-2">💎</span>
                  Top 3 favoris
                </button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setIsTopOptionsVisible(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de partage */}
      {isShareModalOpen && shareUrl && bbCode && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Partager vos {getCollectionTypeName()}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Ce lien est valide pendant 30 jours
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lien direct
              </label>
              <div className="flex">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
                <button
                  onClick={() => copyToClipboard(shareUrl, 'lien')}
                  className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                >
                  Copier
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                BBCode (pour forums)
              </label>
              <div className="flex">
                <textarea
                  readOnly
                  value={bbCode}
                  rows={3}
                  className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(bbCode, 'bbcode')}
                  className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 self-stretch"
                >
                  Copier
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Pour partager vos favoris sur un forum, copiez et collez ce BBCode.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={closeShareModal}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CollectionShareButton;
