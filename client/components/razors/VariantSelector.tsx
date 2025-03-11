import React, { useState, useEffect } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Razor, RazorVariant } from '../../lib/supabase'

type VariantSelectorProps = {
  razor: Razor;
  onClose: () => void;
  onSuccess: (variant: RazorVariant) => void;
}

const VariantSelector: React.FC<VariantSelectorProps> = ({ razor, onClose, onSuccess }) => {
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  
  // États pour les sélections de l'utilisateur
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [selectedFinish, setSelectedFinish] = useState<string>('')
  const [selectedCombType, setSelectedCombType] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  // Préparer les options à partir des données du rasoir
  const materialOptions = razor.material_variant ? razor.material_variant.split(',').map(m => m.trim()) : []
  const finishOptions = razor.available_finish ? razor.available_finish.split(',').map(f => f.trim()) : []
  const combTypeOptions = razor.comb_type ? razor.comb_type.split(',').map(c => c.trim()) : []
  
  // Définir les valeurs par défaut
  useEffect(() => {
    if (materialOptions.length > 0) setSelectedMaterial(materialOptions[0])
    if (finishOptions.length > 0) setSelectedFinish(finishOptions[0])
    if (combTypeOptions.length > 0) setSelectedCombType(combTypeOptions[0])
  }, [razor])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('Vous devez être connecté pour ajouter un rasoir à votre collection')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Vérifier si au moins un champ de variante est rempli
      if (!selectedMaterial && !selectedFinish && !selectedCombType) {
        setError('Veuillez sélectionner au moins une option de variante.')
        setLoading(false)
        return
      }
      
      // Ajouter à la collection d'abord
      const { data: collectionData, error: collectionError } = await supabaseClient
        .from('user_collections')
        .insert({
          user_id: user?.id,
          razor_id: razor.id,
          in_collection: true,
          in_wishlist: false,
          is_favorite: false,
          variant_material: selectedMaterial || null,
          variant_finish: selectedFinish || null,
          variant_comb_type: selectedCombType || null,
          variant_notes: notes || null,
          is_variant: true
        })
        .select()
      
      if (collectionError) {
        throw collectionError
      }
      
      console.log('Collection entry created:', collectionData)
      
      // Convertir les données pour correspondre au format RazorVariant
      if (collectionData && collectionData.length > 0) {
        const variantData = {
          id: collectionData[0].id.toString(),
          parent_razor_id: razor.id,
          user_id: user?.id || '',
          selected_material: collectionData[0].variant_material || undefined,
          selected_finish: collectionData[0].variant_finish || undefined,
          selected_comb_type: collectionData[0].variant_comb_type || undefined,
          notes: collectionData[0].variant_notes || undefined,
          created_at: collectionData[0].created_at
        };
        
        onSuccess(variantData);
      } else {
        throw new Error('Aucune donnée retournée après création de la collection');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Sélectionner une variante</h2>
        
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          Personnalisez les détails de ce rasoir avant de l'ajouter à votre collection.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {materialOptions.length > 0 && (
            <div className="mb-4">
              <label htmlFor="material" className="block text-sm font-medium mb-1">
                Matière
              </label>
              <select
                id="material"
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="input-field"
              >
                {materialOptions.map((material) => (
                  <option key={material} value={material}>
                    {material}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {finishOptions.length > 0 && (
            <div className="mb-4">
              <label htmlFor="finish" className="block text-sm font-medium mb-1">
                Finition
              </label>
              <select
                id="finish"
                value={selectedFinish}
                onChange={(e) => setSelectedFinish(e.target.value)}
                className="input-field"
              >
                {finishOptions.map((finish) => (
                  <option key={finish} value={finish}>
                    {finish}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {combTypeOptions.length > 0 && (
            <div className="mb-4">
              <label htmlFor="comb-type" className="block text-sm font-medium mb-1">
                Type de peigne
              </label>
              <select
                id="comb-type"
                value={selectedCombType}
                onChange={(e) => setSelectedCombType(e.target.value)}
                className="input-field"
              >
                {combTypeOptions.map((combType) => (
                  <option key={combType} value={combType}>
                    {combType}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              Notes personnelles (optionnel)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Ajoutez des notes personnelles sur ce rasoir..."
            />
          </div>
          
          <div className="flex justify-end space-x-2">
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
              {loading ? 'Ajout en cours...' : 'Ajouter à ma collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VariantSelector
