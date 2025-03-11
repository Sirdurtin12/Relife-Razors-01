import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import SafeImage from '../../components/common/SafeImage'
import { preventWheelChange, emptyToUndefinedOrNumber } from '../../utils/inputHelpers'

const AddRazorPage = () => {
  const router = useRouter()
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  
  // État pour le formulaire
  const [manufacturer, setManufacturer] = useState('')
  const [model, setModel] = useState('')
  const [reference, setReference] = useState('')
  const [bladeType, setBladeType] = useState('DE')
  const [imageUrl, setImageUrl] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  // Nouveaux champs techniques
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
  
  // État pour la gestion des erreurs et du chargement
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isCloning, setIsCloning] = useState(false)
  const [similarRazors, setSimilarRazors] = useState<any[]>([])
  
  // Rediriger si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      router.push('/auth/signin?redirect=/razors/add')
    }
  }, [user, router])
  
  // Vérifier les rasoirs similaires lors de la saisie
  useEffect(() => {
    const checkSimilarRazors = async () => {
      if (!manufacturer || !model) return
      
      try {
        const { data } = await supabaseClient
          .from('razors')
          .select('*')
          // Recherche exacte pour le fabricant et le modèle
          .eq('manufacturer', manufacturer)
          .eq('model', model)
        
        // Trier les références
        const sortedData = [...(data || [])].sort((a, b) => {
          // Si les deux références sont undefined ou null, les considérer comme égales
          if (!a.reference && !b.reference) return 0;
          // Mettre les références null ou undefined à la fin
          if (!a.reference) return 1;
          if (!b.reference) return -1;
          
          // Vérifier si les deux références sont des nombres
          const aNum = parseFloat(a.reference);
          const bNum = parseFloat(b.reference);
          
          if (!isNaN(aNum) && !isNaN(bNum)) {
            // Si les deux sont des nombres, tri numérique
            return aNum - bNum;
          } else if (!isNaN(aNum)) {
            // Si seulement a est un nombre, le placer avant
            return -1;
          } else if (!isNaN(bNum)) {
            // Si seulement b est un nombre, le placer avant
            return 1;
          } else {
            // Sinon, tri alphabétique
            return a.reference.localeCompare(b.reference);
          }
        });
        
        setSimilarRazors(sortedData)
      } catch (err) {
        console.error('Error checking similar razors:', err)
      }
    }
    
    const debounce = setTimeout(checkSimilarRazors, 500)
    return () => clearTimeout(debounce)
  }, [manufacturer, model, supabaseClient])
  
  // Vérifier si on est en train de cloner un rasoir
  useEffect(() => {
    // Vérifier si on a un paramètre clone=true dans l'URL
    const isCloneMode = router.query.clone === 'true'
    
    if (isCloneMode && typeof window !== 'undefined') {
      // Récupérer les données du rasoir à cloner depuis localStorage
      const razorToCloneStr = localStorage.getItem('razorToClone')
      
      if (razorToCloneStr) {
        try {
          const razorToClone = JSON.parse(razorToCloneStr)
          
          // Pré-remplir le formulaire avec les données du rasoir à cloner
          setManufacturer(razorToClone.manufacturer || '')
          setModel(razorToClone.model || '')
          setReference(razorToClone.reference || '')
          setImageUrl(razorToClone.image_url || '')
          setAdditionalInfo(razorToClone.additional_info || '')
          setBladeType(razorToClone.blade_type || '')
          setWeightGrams(razorToClone.weight_grams || undefined)
          setGapMm(razorToClone.gap_mm || undefined)
          setBladeExposureMm(razorToClone.blade_exposure_mm || undefined)
          setCuttingAngle(razorToClone.cutting_angle || undefined)
          setPrice(razorToClone.price || undefined)
          setBaseMaterial(razorToClone.base_material || '')
          setMaterialVariant(razorToClone.material_variant || '')
          setAvailableFinish(razorToClone.available_finish || '')
          setCombType(razorToClone.comb_type || '')
          setReleaseYear(razorToClone.release_year || undefined)
          
          // Marquer qu'on est en mode clonage
          setIsCloning(true)
          
          // Nettoyer localStorage après avoir chargé les données
          localStorage.removeItem('razorToClone')
        } catch (err) {
          console.error('Erreur lors du chargement des données du rasoir à cloner:', err)
        }
      }
    }
  }, [router.query])
  
  // Gérer l'upload d'image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const file = e.target.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `razors/${fileName}`
    
    setLoading(true)
    
    try {
      const { error: uploadError } = await supabaseClient.storage
        .from('razor-images')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError
      
      const { data } = supabaseClient.storage
        .from('razor-images')
        .getPublicUrl(filePath)
      
      setImageUrl(data.publicUrl)
    } catch (err: any) {
      console.error('Error uploading image:', err)
      alert('Erreur lors du téléchargement de l\'image')
    } finally {
      setLoading(false)
    }
  }
  
  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      alert('Vous devez être connecté pour ajouter un rasoir')
      return
    }
    
    if (!manufacturer || !model || !bladeType) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Vérifier si un rasoir similaire existe déjà
      const { data: existingRazors, error: checkError } = await supabaseClient
        .from('razors')
        .select('*')
        .eq('manufacturer', manufacturer)
        .eq('model', model)
        .eq('reference', reference || '')
      
      if (checkError) throw checkError
      
      if (existingRazors && existingRazors.length > 0) {
        setError('Un rasoir identique existe déjà dans la base de données')
        setLoading(false)
        return
      }
      
      // Ajouter le nouveau rasoir
      const { data, error } = await supabaseClient
        .from('razors')
        .insert({
          manufacturer,
          model,
          reference: reference || null,
          image_url: imageUrl || null,
          blade_type: bladeType,
          created_by: user.id,
          // Nouveaux champs techniques
          weight_grams: weightGrams || null,
          gap_mm: gapMm || null,
          blade_exposure_mm: bladeExposureMm || null,
          cutting_angle: cuttingAngle || null,
          price: price || null,
          base_material: baseMaterial || null,
          material_variant: materialVariant || null,
          available_finish: availableFinish || null,
          comb_type: combType || null,
          release_year: releaseYear || null,
          additional_info: additionalInfo || null
        })
        .select()
      
      if (error) throw error
      
      // Rediriger vers la page du rasoir
      router.push(`/razors/${data[0].id}`)
    } catch (err: any) {
      console.error('Error adding razor:', err)
      setError(err.message || 'Erreur lors de l\'ajout du rasoir')
    } finally {
      setLoading(false)
    }
  }
  
  // Liste des types de lames disponibles
  const bladeTypes = ['DE', 'AC', 'GEM', 'other']
  
  if (!user) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <p className="text-center py-12">Chargement...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen py-8">
      <Head>
        <title>{isCloning ? 'Cloner un rasoir' : 'Ajouter un rasoir'} | Relife Razor</title>
        <meta name="description" content="Ajouter un nouveau rasoir à la base de données" />
      </Head>
      
      <main className="container mx-auto px-4">
        <div className="mb-6">
          <Link href="/" className="text-primary hover:underline">
            &larr; Retour à la page d'accueil
          </Link>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6">{isCloning ? 'Cloner un rasoir' : 'Ajouter un nouveau rasoir'}</h1>
          
          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {isCloning && (
            <div className="mb-6 p-4 bg-blue-100 text-blue-700 rounded">
              Vous êtes en train de cloner un rasoir existant. Modifiez les informations nécessaires puis cliquez sur "Enregistrer" pour créer une nouvelle fiche.
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="manufacturer" className="block text-sm font-medium mb-1">
                  Fabricant *
                </label>
                <input
                  id="manufacturer"
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="model" className="block text-sm font-medium mb-1">
                  Modèle *
                </label>
                <input
                  id="model"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="reference" className="block text-sm font-medium mb-1">
                  Référence
                </label>
                <input
                  id="reference"
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="input-field"
                />
                {/* Afficher les références existantes si le fabricant et le modèle correspondent */}
                {similarRazors.length > 0 && (
                  <div className="mt-2 text-sm bg-amber-50 border border-amber-200 rounded-md p-2 shadow-sm">
                    <p className="font-medium text-amber-800 mb-1">Références existantes :</p>
                    <div className="flex flex-wrap gap-2">
                      {similarRazors.map((razor) => (
                        <span 
                          key={razor.id}
                          className="inline-flex items-center px-2 py-1 bg-white border border-amber-300 rounded-md text-amber-700"
                        >
                          {razor.reference || 'Sans référence'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="blade-type" className="block text-sm font-medium mb-1">
                  Type de lame *
                </label>
                <select
                  id="blade-type"
                  value={bladeType}
                  onChange={(e) => setBladeType(e.target.value)}
                  className="input-field"
                  required
                >
                  {bladeTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="image" className="block text-sm font-medium mb-1">
                Image
              </label>
              <div className="flex items-center">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="input-field"
                />
                {imageUrl && (
                  <div className="ml-4 relative w-16 h-16 rounded overflow-hidden">
                    <SafeImage 
                      src={imageUrl} 
                      alt="Aperçu" 
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Ou entrez une URL d'image:
              </p>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="input-field mt-1"
              />
            </div>
            
            {/* Spécifications techniques */}
            <div className="mb-8 border-t pt-6">
              <h3 className="text-xl font-semibold mb-4">Spécifications techniques</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="weight-grams" className="block text-sm font-medium mb-1">
                    Poids (en grammes)
                  </label>
                  <input
                    id="weight-grams"
                    type="number"
                    inputMode="numeric"
                    value={weightGrams !== undefined ? weightGrams : ''}
                    onChange={(e) => setWeightGrams(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    onWheel={preventWheelChange}
                    className="input-field"
                    placeholder="Ex: 85.5"
                  />
                </div>
                
                <div>
                  <label htmlFor="gap-mm" className="block text-sm font-medium mb-1">
                    GAP (en mm)
                  </label>
                  <input
                    id="gap-mm"
                    type="number"
                    inputMode="numeric"
                    value={gapMm !== undefined ? gapMm : ''}
                    onChange={(e) => setGapMm(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    onWheel={preventWheelChange}
                    className="input-field"
                    placeholder="Ex: 0.65"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="blade-exposure-mm" className="block text-sm font-medium mb-1">
                    Exposition de lame (en mm)
                  </label>
                  <input
                    id="blade-exposure-mm"
                    type="number"
                    inputMode="numeric"
                    value={bladeExposureMm !== undefined ? bladeExposureMm : ''}
                    onChange={(e) => setBladeExposureMm(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    onWheel={preventWheelChange}
                    className="input-field"
                    placeholder="Ex: 0.5 (peut être négatif ou 0)"
                  />
                </div>
                
                <div>
                  <label htmlFor="cutting-angle" className="block text-sm font-medium mb-1">
                    Angle de coupe (en degrés)
                  </label>
                  <input
                    id="cutting-angle"
                    type="number"
                    min="0"
                    max="90"
                    inputMode="numeric"
                    value={cuttingAngle !== undefined ? cuttingAngle : ''}
                    onChange={(e) => setCuttingAngle(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    onWheel={preventWheelChange}
                    className="input-field"
                    placeholder="Ex: 30"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium mb-1">
                    Prix (en €)
                  </label>
                  <input
                    id="price"
                    type="number"
                    inputMode="numeric"
                    value={price !== undefined ? price : ''}
                    onChange={(e) => setPrice(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    onWheel={preventWheelChange}
                    className="input-field"
                    placeholder="Ex: 20.99"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="base-material" className="block text-sm font-medium mb-1">
                  Matériau de base
                </label>
                <input
                  id="base-material"
                  type="text"
                  value={baseMaterial}
                  onChange={(e) => setBaseMaterial(e.target.value)}
                  className="input-field"
                  placeholder="Ex: Acier inoxydable, Laiton, Titane..."
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="material-variant" className="block text-sm font-medium mb-1">
                  Variante de matière
                </label>
                <input
                  id="material-variant"
                  type="text"
                  value={materialVariant}
                  onChange={(e) => setMaterialVariant(e.target.value)}
                  className="input-field"
                  placeholder="Ex: Acier inoxydable, Laiton, Titane..."
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="available-finish" className="block text-sm font-medium mb-1">
                  Finition disponible
                </label>
                <input
                  id="available-finish"
                  type="text"
                  value={availableFinish}
                  onChange={(e) => setAvailableFinish(e.target.value)}
                  className="input-field"
                  placeholder="Ex: Chrome, Or, Noir mat..."
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="comb-type" className="block text-sm font-medium mb-1">
                  Type de peigne
                </label>
                <input
                  id="comb-type"
                  type="text"
                  value={combType}
                  onChange={(e) => setCombType(e.target.value)}
                  className="input-field"
                  placeholder="Ex: Peigne fixe, Peigne ajustable..."
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="release-year" className="block text-sm font-medium mb-1">
                  Année de mise en vente (version)
                </label>
                <input
                  id="release-year"
                  type="number"
                  inputMode="numeric"
                  value={releaseYear !== undefined ? releaseYear : ''}
                  onChange={(e) => setReleaseYear(e.target.value === '' ? undefined : parseInt(e.target.value))}
                  onWheel={preventWheelChange}
                  className="input-field"
                  placeholder="Ex: 2020"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="additional-info" className="block text-sm font-medium mb-1">
                Informations supplémentaires
              </label>
              <textarea
                id="additional-info"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                className="input-field"
                rows={4}
                placeholder="Informations supplémentaires sur le rasoir"
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Enregistrement...' : isCloning ? 'Enregistrer le clone' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default AddRazorPage
