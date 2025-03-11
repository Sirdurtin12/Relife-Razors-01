import React, { useState, useEffect } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Razor, RazorVariant } from '../../lib/supabase'

type VariantOption = {
  material?: string;
  finish?: string;
  combType?: string;
  notes?: string;
}

type CollectionState = {
  owned: boolean;
  wishlist: boolean;
  favorite: boolean;
}

type MultiVariantSelectorProps = {
  razor: Razor;
  onClose: () => void;
  onSuccess: (variants: RazorVariant[]) => void;
}

const MultiVariantSelector: React.FC<MultiVariantSelectorProps> = ({ razor, onClose, onSuccess }) => {
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  
  // Une seule variante à la fois
  const [variant, setVariant] = useState<VariantOption>({
    material: '',
    finish: '',
    combType: '',
    notes: ''
  })
  
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  const [collectionState, setCollectionState] = useState<CollectionState>({
    owned: true,
    wishlist: false,
    favorite: false
  })
  
  const materialOptions = razor.material_variant ? razor.material_variant.split(',').map(m => m.trim()) : []
  const finishOptions = razor.available_finish ? razor.available_finish.split(',').map(f => f.trim()) : []
  const combTypeOptions = razor.comb_type ? razor.comb_type.split(',').map(c => c.trim()) : []
  
  // Mettre à jour la variante
  const updateVariant = (field: string, value: string) => {
    setVariant(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const toggleCollectionState = (type: keyof CollectionState) => {
    if (type === 'owned' || type === 'wishlist') {
      // Owned et wishlist sont mutuellement exclusifs
      if (type === 'owned' && !collectionState.owned) {
        setCollectionState({
          ...collectionState,
          owned: true,
          wishlist: false
        })
      } else if (type === 'wishlist' && !collectionState.wishlist) {
        setCollectionState({
          ...collectionState,
          owned: false,
          wishlist: true
        })
      } else {
        // Si on désactive l'option, on met simplement à jour cette option
        setCollectionState({
          ...collectionState,
          [type]: !collectionState[type]
        })
      }
    } else {
      // Pour favorite, on peut simplement basculer l'état
      setCollectionState({
        ...collectionState,
        [type]: !collectionState[type]
      })
    }
  }
  
  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      console.log('Ajout de la variante à la collection...')
      
      // Ajouter directement à la collection avec les informations de variante
      const { data: collectionData, error: collectionError } = await supabaseClient
        .from('user_collections')
        .insert({
          user_id: user.id,
          razor_id: razor.id,
          in_collection: collectionState.owned,
          in_wishlist: collectionState.wishlist,
          is_favorite: collectionState.favorite,
          variant_material: variant.material || null,
          variant_finish: variant.finish || null,
          variant_comb_type: variant.combType || null,
          variant_notes: variant.notes || null,
          is_variant: hasVariantSelection()
        })
        .select()
      
      if (collectionError) {
        console.error('Erreur lors de l\'ajout de la variante à la collection:', collectionError)
        setError(`Erreur: ${collectionError.message}`)
        setLoading(false)
        return
      }
      
      console.log('Variante ajoutée avec succès à la collection:', collectionData)
      
      // Convertir les données pour correspondre au format RazorVariant
      const convertedVariants = collectionData ? collectionData.map(item => ({
        id: item.id.toString(),
        parent_razor_id: razor.id,
        user_id: user.id,
        selected_material: item.variant_material,
        selected_finish: item.variant_finish,
        selected_comb_type: item.variant_comb_type,
        notes: item.variant_notes,
        created_at: item.created_at
      })) : [];
      
      // Si l'ajout à la collection a réussi, notifier le parent et fermer le modal
      onSuccess(convertedVariants)
      onClose()
    } catch (err) {
      console.error('Exception lors de l\'ajout de la variante:', err)
      setError('Une erreur inattendue s\'est produite. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  // Vérifier si une variante a été sélectionnée
  const hasVariantSelection = () => {
    return !!(variant.material || variant.finish || variant.combType)
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Sélectionner une variante</h2>
        
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          Ajoutez une variante de ce rasoir à votre collection.
          Cette variante créera une fiche clone dans votre collection.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-slate-700">
            {materialOptions.length > 0 && (
              <div className="mb-3">
                <label htmlFor="material" className="block text-sm font-medium mb-1">
                  Matière
                </label>
                <select
                  id="material"
                  value={variant.material || ''}
                  onChange={(e) => updateVariant('material', e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">Sélectionner une matière</option>
                  {materialOptions.map((material) => (
                    <option key={material} value={material}>
                      {material}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {finishOptions.length > 0 && (
              <div className="mb-3">
                <label htmlFor="finish" className="block text-sm font-medium mb-1">
                  Finition
                </label>
                <select
                  id="finish"
                  value={variant.finish || ''}
                  onChange={(e) => updateVariant('finish', e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">Sélectionner une finition</option>
                  {finishOptions.map((finish) => (
                    <option key={finish} value={finish}>
                      {finish}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {combTypeOptions.length > 0 && (
              <div className="mb-3">
                <label htmlFor="combType" className="block text-sm font-medium mb-1">
                  Type de peigne
                </label>
                <select
                  id="combType"
                  value={variant.combType || ''}
                  onChange={(e) => updateVariant('combType', e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">Sélectionner un type de peigne</option>
                  {combTypeOptions.map((combType) => (
                    <option key={combType} value={combType}>
                      {combType}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="mb-3">
              <label htmlFor="notes" className="block text-sm font-medium mb-1">
                Notes personnelles
              </label>
              <textarea
                id="notes"
                value={variant.notes || ''}
                onChange={(e) => updateVariant('notes', e.target.value)}
                className="input-field w-full"
                rows={2}
                placeholder="Notes personnelles sur cette variante..."
              />
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Ajouter à :</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                type="button"
                onClick={() => toggleCollectionState('owned')}
                className={`p-3 rounded-md flex flex-col items-center justify-center transition-colors ${
                  collectionState.owned 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                <span className="text-xl mb-1">✓</span>
                <span className="text-sm">Je possède ce rasoir</span>
              </button>
              
              <button
                type="button"
                onClick={() => toggleCollectionState('wishlist')}
                className={`p-3 rounded-md flex flex-col items-center justify-center transition-colors ${
                  collectionState.wishlist 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                <span className="text-xl mb-1">🛒</span>
                <span className="text-sm">Ce rasoir m'intéresse</span>
              </button>
              
              <button
                type="button"
                onClick={() => toggleCollectionState('favorite')}
                className={`p-3 rounded-md flex flex-col items-center justify-center transition-colors ${
                  collectionState.favorite 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                <span className="text-xl mb-1">⭐</span>
                <span className="text-sm">Rasoir favori</span>
              </button>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Création en cours...' : `Créer et ajouter à ma collection`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MultiVariantSelector
