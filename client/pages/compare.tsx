import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import GentlenessScale from '../components/razors/GentlenessScale'
import { Razor } from '../lib/supabase'
import { getComparisonList, addToComparisonList, removeFromComparisonList } from '../lib/compareService'
import Link from 'next/link'
import { GetServerSideProps } from 'next'

const ComparePage = () => {
  const router = useRouter()
  const supabaseClient = useSupabaseClient()
  const [razors, setRazors] = useState<Razor[]>([])
  const [selectedRazors, setSelectedRazors] = useState<Razor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Couleurs des marqueurs pour l'échelle et le tableau
  const markerColors = [
    'bg-red-500 text-white',
    'bg-blue-500 text-white',
    'bg-green-500 text-white',
    'bg-amber-500 text-white'
  ]
  
  // Charger tous les rasoirs au chargement de la page
  useEffect(() => {
    const loadRazors = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const { data, error } = await supabaseClient.from('razors').select('*')
        
        if (error) throw error
        
        setRazors(data || [])
      } catch (err: any) {
        console.error('Error loading razors:', err)
        setError('Impossible de charger les rasoirs')
      } finally {
        setLoading(false)
      }
    }
    
    loadRazors()
  }, [])
  
  // Préselectionner les rasoirs à partir des paramètres d'URL
  useEffect(() => {
    if (!router.isReady || !razors.length) return
    
    const { razors: razorParam } = router.query
    
    if (razorParam) {
      try {
        // Gérer à la fois un seul ID et plusieurs IDs séparés par des virgules
        const razorIds = Array.isArray(razorParam) 
          ? razorParam[0].split(',').map(id => parseInt(id, 10))
          : razorParam.split(',').map(id => parseInt(id, 10))
        
        // Filtrer les IDs invalides
        const validIds = razorIds.filter(id => !isNaN(id))
        
        // Trouver les rasoirs correspondants
        const preselectedRazors = razors.filter(razor => validIds.includes(razor.id))
        
        if (preselectedRazors.length > 0) {
          setSelectedRazors(preselectedRazors)
          console.log('Rasoirs présélectionnés:', preselectedRazors)
        }
      } catch (err) {
        console.error('Erreur lors de la présélection des rasoirs:', err)
      }
    } else {
      // Si pas de paramètre d'URL, charger depuis localStorage
      const storedIds = getComparisonList();
      if (storedIds.length > 0) {
        const storedRazors = razors.filter(razor => storedIds.includes(razor.id));
        setSelectedRazors(storedRazors);
        console.log('Rasoirs chargés depuis localStorage:', storedRazors);
      }
    }
  }, [router.isReady, router.query, razors])
  
  // Fonction pour retirer un rasoir de la comparaison
  const removeFromComparison = (razorId) => {
    const updatedRazors = selectedRazors.filter(razor => razor.id !== razorId);
    setSelectedRazors(updatedRazors);
    // Mettre à jour le localStorage
    removeFromComparisonList(razorId);
    updateQueryParams(updatedRazors.map(r => r.id));
  };
  
  // Partage de la comparaison (URL avec paramètres)
  const shareComparison = () => {
    const url = new URL(window.location.href)
    url.search = `?ids=${selectedRazors.map(r => r.id).join(',')}`
    
    navigator.clipboard.writeText(url.toString())
      .then(() => alert('Lien de comparaison copié dans le presse-papier!'))
      .catch(err => console.error('Impossible de copier le lien:', err))
  }
  
  // Rafraîchissement de la page
  const refreshPage = () => {
    window.location.reload()
  }
  
  // Mise à jour des paramètres d'URL
  const updateQueryParams = (razorIds: number[]) => {
    if (razorIds.length > 0) {
      const url = new URL(window.location.href);
      url.search = `?ids=${razorIds.join(',')}`;
      window.history.pushState({}, '', url.toString());
    } else {
      window.history.pushState({}, '', window.location.pathname);
    }
  };
  
  return (
    <div className="min-h-screen py-8">
      <Head>
        <title>Comparaison | Relife Razor</title>
        <meta name="description" content="Comparez différents rasoirs pour trouver celui qui vous convient le mieux" />
      </Head>
      
      <main className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Comparaison de rasoirs</h1>
        
        {/* Zone de comparaison */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Rasoirs sélectionnés ({selectedRazors.length})</h2>
            
            {selectedRazors.length > 0 && (
              <div className="flex gap-2">
                <button 
                  onClick={shareComparison}
                  className="btn-secondary"
                >
                  Partager la comparaison
                </button>
                
                <button 
                  onClick={refreshPage}
                  className="btn-secondary"
                >
                  Rafraîchir la page
                </button>
              </div>
            )}
          </div>
          
          {selectedRazors.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 mb-4">Aucun rasoir sélectionné pour la comparaison</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Parcourez notre collection de rasoirs et ajoutez-en à la comparaison</p>
              <button
                onClick={() => router.push('/razors')}
                className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
              >
                Parcourir les rasoirs
              </button>
            </div>
          ) : (
            <>
              {/* Échelle de douceur */}
              <h2 className="text-xl font-semibold">Échelle de douceur</h2>
              <div className="mt-4">
                {/* Affichage de l'échelle avec tous les rasoirs sélectionnés */}
                <GentlenessScale razors={selectedRazors} showLabels={false} razorlabels={true} compact={false} />
                {/* Légende des rasoirs */}
                <div className="mt-8 bg-white dark:bg-slate-800 p-4 rounded shadow">
                  <h3 className="text-lg font-medium mb-2">Légende</h3>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {selectedRazors.map((razor, index) => {
                      return (
                        <div key={razor.id} className="flex items-center">
                          <div className={`w-6 h-6 rounded-full ${markerColors[index % markerColors.length]} mr-2 flex items-center justify-center font-bold text-xs`}>{index+1}</div>
                          <div className="text-sm">
                            <div>
                              {razor.model}
                              {razor.reference && <span> - {razor.reference}</span>} 
                              <span className="ml-1">({razor.avg_gentleness}/20)</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Tableau comparatif */}
              <div className="overflow-x-auto mt-6">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fabricant</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Modèle</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Référence</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type de lame</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Douceur</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Poids (g)</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gap (mm)</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Exposition (mm)</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Prix</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedRazors.map((razor, index) => (
                      <tr key={razor.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                        <td className="p-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <div className={`w-6 h-6 rounded-full ${markerColors[index % markerColors.length]} mr-2 flex items-center justify-center font-bold text-xs`}>{index+1}</div>
                            {razor.manufacturer}
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{razor.model}</td>
                        <td className="p-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{razor.reference || '-'}</td>
                        <td className="p-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{razor.blade_type}</td>
                        <td className="p-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <span className="font-bold">{razor.avg_gentleness}</span>/20
                        </td>
                        <td className="p-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{razor.weight || '-'}</td>
                        <td className="p-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{razor.gap || '-'}</td>
                        <td className="p-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{razor.blade_exposure_mm || '-'}</td>
                        <td className="p-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {razor.price ? `${razor.price} €` : '-'}
                        </td>
                        <td className="p-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <button 
                            onClick={() => removeFromComparison(razor.id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          >
                            Retirer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Tableau des caractéristiques techniques */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Caractéristiques techniques</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedRazors.map((razor, index) => (
                    <div 
                      key={razor.id} 
                      className={`bg-white dark:bg-slate-800 rounded-lg p-4 shadow border-t-4 ${index === 0 ? 'border-red-500' : index === 1 ? 'border-blue-500' : index === 2 ? 'border-green-500' : 'border-amber-500'}`}
                    >
                      <div className="flex items-center mb-4">
                        <div className={`w-6 h-6 rounded-full ${markerColors[index % markerColors.length]} mr-2 flex items-center justify-center font-bold text-xs`}>{index+1}</div>
                        <h3 className="text-lg font-semibold">
                          {razor.manufacturer} {razor.model}
                          {razor.reference && <span className="text-sm font-normal"> - {razor.reference}</span>}
                        </h3>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Type de lame:</span>
                          <span className="text-sm font-medium">{razor.blade_type}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Type de peigne:</span>
                          <span className="text-sm font-medium">{razor.comb_type || 'Non spécifié'}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Matériau:</span>
                          <span className="text-sm font-medium">{razor.material || 'Non spécifié'}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Année de production:</span>
                          <span className="text-sm font-medium">{razor.production_year || 'Non spécifié'}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Poids:</span>
                          <span className="text-sm font-medium">{razor.weight ? `${razor.weight} g` : 'Non spécifié'}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Gap:</span>
                          <span className="text-sm font-medium">{razor.gap ? `${razor.gap} mm` : 'Non spécifié'}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Exposition de lame:</span>
                          <span className="text-sm font-medium">{razor.blade_exposure_mm ? `${razor.blade_exposure_mm} mm` : 'Non spécifié'}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Prix:</span>
                          <span className="text-sm font-medium">{razor.price ? `${razor.price} €` : 'Non spécifié'}</span>
                        </div>
                      </div>
                      
                      {/* Lien vers la page du rasoir */}
                      <div className="mt-4">
                        <Link href={`/razors/${razor.id}`} className="text-primary hover:underline">
                          Voir les détails complets
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  }
}

export default ComparePage
