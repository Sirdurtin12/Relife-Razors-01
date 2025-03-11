import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import SafeImage from '../../../components/common/SafeImage'
import { preventWheelChange, emptyToUndefinedOrNumber } from '../../../utils/inputHelpers'
import { Razor } from '../../../lib/supabase'
import toast from 'react-hot-toast'

const EditRazorPage = () => {
  const router = useRouter()
  const { id } = router.query
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  
  // États pour les champs du formulaire
  const [manufacturer, setManufacturer] = useState('')
  const [model, setModel] = useState('')
  const [reference, setReference] = useState('')
  const [bladeType, setBladeType] = useState('DE')
  const [imageUrl, setImageUrl] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [weightGrams, setWeightGrams] = useState<number | undefined>(undefined)
  const [gapMm, setGapMm] = useState<number | undefined>(undefined)
  const [bladeExposureMm, setBladeExposureMm] = useState<number | undefined>(undefined)
  const [cuttingAngle, setCuttingAngle] = useState<number | undefined>(undefined)
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [baseMaterial, setBaseMaterial] = useState('')
  const [materialVariant, setMaterialVariant] = useState('')
  const [availableFinish, setAvailableFinish] = useState('')
  const [combType, setCombType] = useState('')
  const [releaseYear, setReleaseYear] = useState<number | undefined>(undefined)
  
  // États pour le chargement et les erreurs
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const [originalRazor, setOriginalRazor] = useState<any>(null)
  
  // Vérifier si l'utilisateur est administrateur ou créateur du rasoir
  useEffect(() => {
    const checkUserRights = async () => {
      if (!user || !id) return
      
      try {
        // Vérifier si l'utilisateur est administrateur
        const { data: profileData, error: profileError } = await supabaseClient
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        
        if (profileError) {
          console.error('Erreur lors de la vérification du statut admin:', profileError)
          return
        }
        
        // Récupérer les informations du rasoir pour vérifier le créateur
        const { data: razorData, error: razorError } = await supabaseClient
          .from('razors')
          .select('*, created_by')
          .eq('id', id)
          .single()
        
        if (razorError) {
          console.error('Erreur lors de la récupération du rasoir:', razorError)
          return
        }
        
        const userIsAdmin = profileData?.is_admin || false
        const userIsCreator = razorData?.created_by === user.id
        
        setIsAdmin(userIsAdmin)
        setIsCreator(userIsCreator)
        
        console.log('Vérification des droits:')
        console.log('ID utilisateur:', user.id)
        console.log('ID créateur du rasoir:', razorData?.created_by)
        console.log('Est admin:', userIsAdmin)
        console.log('Est créateur:', userIsCreator)
        
        // Rediriger si l'utilisateur n'est ni administrateur ni créateur
        if (!userIsAdmin && !userIsCreator) {
          toast.error('Accès non autorisé. Seuls les administrateurs et les créateurs peuvent éditer les rasoirs.')
          router.push(`/razors/${id}`)
        }
        
        // Si l'utilisateur a les droits, charger les données du rasoir
        if (userIsAdmin || userIsCreator) {
          if (razorData) {
            setOriginalRazor(razorData)
            setManufacturer(razorData.manufacturer || '')
            setModel(razorData.model || '')
            setReference(razorData.reference || '')
            setBladeType(razorData.blade_type || 'DE')
            setImageUrl(razorData.image_url || '')
            setAdditionalInfo(razorData.additional_info || '')
            
            // Charger les détails techniques du rasoir
            setWeightGrams(razorData.weight_grams)
            setGapMm(razorData.gap_mm)
            setBladeExposureMm(razorData.blade_exposure_mm)
            setCuttingAngle(razorData.cutting_angle)
            setPrice(razorData.price)
            setBaseMaterial(razorData.base_material || '')
            setMaterialVariant(razorData.material_variant || '')
            setAvailableFinish(razorData.available_finish || '')
            setCombType(razorData.comb_type || '')
            setReleaseYear(razorData.release_year)
          }
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Erreur:', err)
        setLoading(false)
      }
    }
    
    checkUserRights()
  }, [user, id, router])
  
  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('Vous devez être connecté pour éditer un rasoir')
      return
    }
    
    // Vérifier à nouveau les droits d'édition
    const { data: userRights, error: userRightsError } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user?.id)
      .single()
    
    const userIsAdmin = userRights?.is_admin || false
    const userIsCreator = originalRazor?.created_by === user.id
    
    if (userRightsError || (!userIsAdmin && !userIsCreator)) {
      console.error('Erreur de vérification des droits:', userRightsError)
      setError('Vous n\'avez pas les droits nécessaires pour éditer ce rasoir')
      return
    }
    
    // Validation de base
    if (!manufacturer || !model) {
      setError('Le fabricant et le modèle sont obligatoires')
      return
    }
    
    setLoading(true)
    setError(null)
    
    console.log('Tentative de mise à jour du rasoir:')
    console.log('ID du rasoir:', id)
    console.log('ID de l\'utilisateur:', user?.id)
    console.log('Statut admin:', userIsAdmin)
    console.log('Est créateur:', userIsCreator)
    
    try {
      // Mettre à jour le rasoir
      const { error: updateError } = await supabaseClient
        .from('razors')
        .update({
          manufacturer,
          model,
          reference,
          blade_type: bladeType,
          image_url: imageUrl,
          additional_info: additionalInfo,
          weight_grams: weightGrams,
          gap_mm: gapMm,
          blade_exposure_mm: bladeExposureMm,
          cutting_angle: cuttingAngle,
          price: price,
          base_material: baseMaterial,
          material_variant: materialVariant,
          available_finish: availableFinish,
          comb_type: combType,
          release_year: releaseYear
        })
        .eq('id', id)
      
      if (updateError) {
        console.error('Erreur détaillée:', updateError)
        setError(`Erreur lors de la mise à jour du rasoir: ${updateError.message}`)
        throw updateError
      }
      
      toast.success('Rasoir mis à jour avec succès')
      router.push(`/razors/${id}`)
    } catch (err) {
      console.error('Erreur lors de la mise à jour du rasoir:', err)
      if (err instanceof Error) {
        setError(`Erreur lors de la mise à jour du rasoir: ${err.message}`)
      } else {
        setError('Erreur inconnue lors de la mise à jour du rasoir')
      }
    } finally {
      setLoading(false)
    }
  }
  
  // Rediriger si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      router.push(`/auth/signin?redirect=/razors/edit/${id}`)
    }
  }, [user, router, id])
  
  if (!isAdmin && !isCreator) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Head>
          <title>Accès non autorisé | Relife Razor</title>
        </Head>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Accès non autorisé</h1>
          <p className="mb-4">Seuls les administrateurs et les créateurs peuvent éditer les rasoirs.</p>
          <Link href={`/razors/${id}`} className="btn-primary">
            Retour à la fiche du rasoir
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Éditer un rasoir | Relife Razor</title>
      </Head>
      
      <div className="mb-6">
        <Link href={`/razors/${id}`} className="text-blue-500 hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour à la fiche du rasoir
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Éditer un rasoir</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loader"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fabricant *
                  </label>
                  <input
                    type="text"
                    id="manufacturer"
                    className="form-input w-full"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Modèle *
                  </label>
                  <input
                    type="text"
                    id="model"
                    className="form-input w-full"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="reference" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Référence
                  </label>
                  <input
                    type="text"
                    id="reference"
                    className="form-input w-full"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="bladeType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type de lame
                  </label>
                  <select
                    id="bladeType"
                    className="form-select w-full"
                    value={bladeType}
                    onChange={(e) => setBladeType(e.target.value)}
                  >
                    <option value="DE">Double Edge (DE)</option>
                    <option value="AC">Artist Club (AC)</option>
                    <option value="GEM">GEM</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>
              
              <div>
                <div className="mb-4">
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL de l'image
                  </label>
                  <input
                    type="url"
                    id="imageUrl"
                    className="form-input w-full"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  
                  {imageUrl && (
                    <div className="mt-2 relative h-48 rounded overflow-hidden">
                      <SafeImage
                        src={imageUrl}
                        alt="Aperçu de l'image"
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Informations complémentaires
                  </label>
                  <textarea
                    id="additionalInfo"
                    rows={4}
                    className="form-textarea w-full"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                  ></textarea>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="weightGrams" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Poids (en grammes)
                  </label>
                  <input
                    type="number"
                    id="weightGrams"
                    inputMode="numeric"
                    className="form-input w-full"
                    value={weightGrams !== undefined ? weightGrams : ''}
                    onChange={(e) => setWeightGrams(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    onWheel={preventWheelChange}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="gapMm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Écartement de la lame (en mm)
                  </label>
                  <input
                    type="number"
                    id="gapMm"
                    inputMode="numeric"
                    className="form-input w-full"
                    value={gapMm !== undefined ? gapMm : ''}
                    onChange={(e) => setGapMm(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    onWheel={preventWheelChange}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="bladeExposureMm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Exposition de la lame (en mm)
                  </label>
                  <input
                    type="number"
                    id="bladeExposureMm"
                    inputMode="numeric"
                    className="form-input w-full"
                    value={bladeExposureMm !== undefined ? bladeExposureMm : ''}
                    onChange={(e) => setBladeExposureMm(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    onWheel={preventWheelChange}
                    placeholder="Peut être négatif ou 0 pour une exposition négative/nulle"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="cuttingAngle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Angle de coupe
                  </label>
                  <input
                    type="number"
                    id="cuttingAngle"
                    inputMode="numeric"
                    className="form-input w-full"
                    value={cuttingAngle !== undefined ? cuttingAngle : ''}
                    onChange={(e) => setCuttingAngle(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    onWheel={preventWheelChange}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prix
                  </label>
                  <input
                    type="number"
                    id="price"
                    inputMode="numeric"
                    className="form-input w-full"
                    value={price !== undefined ? price : ''}
                    onChange={(e) => setPrice(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    onWheel={preventWheelChange}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="baseMaterial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Matériau de base
                  </label>
                  <input
                    type="text"
                    id="baseMaterial"
                    className="form-input w-full"
                    value={baseMaterial}
                    onChange={(e) => setBaseMaterial(e.target.value)}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="materialVariant" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Variante de matériau
                  </label>
                  <input
                    type="text"
                    id="materialVariant"
                    className="form-input w-full"
                    value={materialVariant}
                    onChange={(e) => setMaterialVariant(e.target.value)}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="availableFinish" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Finition disponible
                  </label>
                  <input
                    type="text"
                    id="availableFinish"
                    className="form-input w-full"
                    value={availableFinish}
                    onChange={(e) => setAvailableFinish(e.target.value)}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="combType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type de peigne
                  </label>
                  <input
                    type="text"
                    id="combType"
                    className="form-input w-full"
                    value={combType}
                    onChange={(e) => setCombType(e.target.value)}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="releaseYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Année de sortie
                  </label>
                  <input
                    type="number"
                    id="releaseYear"
                    inputMode="numeric"
                    className="form-input w-full"
                    value={releaseYear !== undefined ? releaseYear : ''}
                    onChange={(e) => setReleaseYear(e.target.value === '' ? undefined : parseInt(e.target.value))}
                    onWheel={preventWheelChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-4">
              <Link href={`/razors/${id}`} className="btn-secondary">
                Annuler
              </Link>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default EditRazorPage
