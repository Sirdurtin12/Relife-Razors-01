import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import RazorCard from '../components/razors/RazorCard'
import { GetServerSideProps } from 'next'

const SearchPage = () => {
  const router = useRouter()
  const supabaseClient = useSupabaseClient()
  const { q, type, min, max } = router.query
  
  const [searchTerm, setSearchTerm] = useState('')
  const [bladeType, setBladeType] = useState<string>('all')
  const [minGentleness, setMinGentleness] = useState<number>(1)
  const [maxGentleness, setMaxGentleness] = useState<number>(20)
  const [minWeight, setMinWeight] = useState<number | undefined>(undefined)
  const [maxWeight, setMaxWeight] = useState<number | undefined>(undefined)
  const [minGap, setMinGap] = useState<number | undefined>(undefined)
  const [maxGap, setMaxGap] = useState<number | undefined>(undefined)
  const [minBladeExposure, setMinBladeExposure] = useState<number | undefined>(undefined)
  const [maxBladeExposure, setMaxBladeExposure] = useState<number | undefined>(undefined)
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined)
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined)
  const [sortBy, setSortBy] = useState('relevance')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  
  // Mettre à jour les filtres depuis l'URL
  useEffect(() => {
    if (q) setSearchTerm(q as string)
    if (type && type !== 'all') setBladeType(type as string)
    if (min) setMinGentleness(parseInt(min as string))
    if (max) setMaxGentleness(parseInt(max as string))
  }, [q, type, min, max])
  
  // Effectuer la recherche
  useEffect(() => {
    const fetchResults = async () => {
      if (!searchTerm && !bladeType && !minGentleness && !maxGentleness) {
        setResults([])
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        
        let query = supabaseClient
          .from('razors')
          .select('*', { count: 'exact' })
        
        // Appliquer les filtres
        if (searchTerm) {
          query = query.or(
            `manufacturer.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,reference.ilike.%${searchTerm}%,additional_info.ilike.%${searchTerm}%`
          )
        }
        
        if (bladeType && bladeType !== 'all') {
          query = query.eq('blade_type', bladeType)
        }
        
        if (minGentleness) {
          query = query.gte('avg_gentleness', minGentleness)
        }
        
        if (maxGentleness) {
          query = query.lte('avg_gentleness', maxGentleness)
        }
        
        // Appliquer les filtres techniques
        if (minWeight) {
          query = query.gte('weight', minWeight)
        }
        
        if (maxWeight) {
          query = query.lte('weight', maxWeight)
        }
        
        if (minGap) {
          query = query.gte('gap', minGap)
        }
        
        if (maxGap) {
          query = query.lte('gap', maxGap)
        }
        
        if (minBladeExposure) {
          query = query.gte('blade_exposure_mm', minBladeExposure)
        }
        
        if (maxBladeExposure) {
          query = query.lte('blade_exposure_mm', maxBladeExposure)
        }
        
        if (minPrice) {
          query = query.gte('price', minPrice)
        }
        
        if (maxPrice) {
          query = query.lte('price', maxPrice)
        }
        
        // Appliquer le tri
        switch (sortBy) {
          case 'gentleness_asc':
            query = query.order('avg_gentleness', { ascending: true })
            break
          case 'gentleness_desc':
            query = query.order('avg_gentleness', { ascending: false })
            break
          case 'name_asc':
            query = query.order('manufacturer', { ascending: true }).order('model', { ascending: true })
            break
          case 'name_desc':
            query = query.order('manufacturer', { ascending: false }).order('model', { ascending: false })
            break
          case 'newest':
            query = query.order('created_at', { ascending: false })
            break
          default:
            // Par défaut, on trie par pertinence (pas de tri spécifique pour Supabase)
            break
        }
        
        const { data, count, error } = await query
        
        if (error) throw error
        
        setResults(data || [])
        setTotalCount(count || 0)
      } catch (error) {
        console.error('Error searching razors:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchResults()
  }, [searchTerm, bladeType, minGentleness, maxGentleness, sortBy, supabaseClient, minWeight, maxWeight, minGap, maxGap, minBladeExposure, maxBladeExposure, minPrice, maxPrice])
  
  // Mettre à jour l'URL avec les filtres
  const updateFilters = () => {
    const queryParams: any = {}
    
    if (searchTerm) queryParams.q = searchTerm
    if (bladeType !== 'all') queryParams.type = bladeType
    if (minGentleness !== 1) queryParams.min = minGentleness
    if (maxGentleness !== 20) queryParams.max = maxGentleness
    
    router.push({
      pathname: '/search',
      query: queryParams
    }, undefined, { shallow: true })
  }
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters()
  }
  
  // Liste des types de lames disponibles
  const bladeTypes = [
    { value: 'all', label: 'Tous les types de lames' },
    { value: 'DE', label: 'Double Edge' },
    { value: 'AC', label: 'Artist Club' },
    { value: 'GEM', label: 'GEM' },
    { value: 'other', label: 'Autre' }
  ]
  
  // Options de tri
  const sortOptions = [
    { value: 'relevance', label: 'Pertinence' },
    { value: 'gentleness_asc', label: 'Douceur (croissant)' },
    { value: 'gentleness_desc', label: 'Douceur (décroissant)' },
    { value: 'price_asc', label: 'Prix (croissant)' },
    { value: 'price_desc', label: 'Prix (décroissant)' },
    { value: 'name_asc', label: 'Nom (A-Z)' },
    { value: 'name_desc', label: 'Nom (Z-A)' },
    { value: 'release_year_asc', label: 'Année de sortie (plus ancien)' },
    { value: 'release_year_desc', label: 'Année de sortie (plus récent)' }
  ]
  
  // Options de filtres techniques
  const weightOptions = [
    { value: 'all', label: 'Tous les poids' },
    { value: 'light', label: 'Léger' },
    { value: 'medium', label: 'Moyen' },
    { value: 'heavy', label: 'Lourd' }
  ]
  
  const gapOptions = [
    { value: 'all', label: 'Tous les gaps' },
    { value: 'small', label: 'Petit' },
    { value: 'medium', label: 'Moyen' },
    { value: 'large', label: 'Grand' }
  ]
  
  return (
    <div className="min-h-screen py-8">
      <Head>
        <title>Recherche de rasoirs | Relife Razor</title>
        <meta name="description" content="Recherchez des rasoirs par type de lame, niveau de douceur et autres critères" />
      </Head>
      
      <main className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sticky top-20">
            <h2 className="text-xl font-bold mb-4">Filtres</h2>
            
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label htmlFor="search-term" className="block text-sm font-medium mb-1">
                  Recherche par nom, fabricant ou référence
                </label>
                <input
                  type="text"
                  id="search-term"
                  className="input-field"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ex: Henson AL13, Blackland Sabre"
                />
              </div>
              
              <div>
                <label htmlFor="blade-type" className="block text-sm font-medium mb-1">
                  Type de lame
                </label>
                <select
                  id="blade-type"
                  className="input-field"
                  value={bladeType}
                  onChange={(e) => setBladeType(e.target.value)}
                >
                  {bladeTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Douceur ({minGentleness} - {maxGentleness})
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={minGentleness}
                    onChange={(e) => setMinGentleness(parseInt(e.target.value))}
                    className="w-1/2"
                  />
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={maxGentleness}
                    onChange={(e) => setMaxGentleness(parseInt(e.target.value))}
                    className="w-1/2"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Exposition de la lame (mm)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={minBladeExposure || 0}
                    onChange={(e) => setMinBladeExposure(parseFloat(e.target.value))}
                    className="w-1/2"
                  />
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={maxBladeExposure || 2}
                    onChange={(e) => setMaxBladeExposure(parseFloat(e.target.value))}
                    className="w-1/2"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Poids
                </label>
                <select
                  id="weight"
                  value={minWeight}
                  onChange={(e) => setMinWeight(parseInt(e.target.value))}
                  className="input-field"
                >
                  {weightOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Gap
                </label>
                <select
                  id="gap"
                  value={minGap}
                  onChange={(e) => setMinGap(parseInt(e.target.value))}
                  className="input-field"
                >
                  {gapOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Prix (€)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={minPrice || 0}
                    onChange={(e) => setMinPrice(parseInt(e.target.value))}
                    className="w-1/2"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={maxPrice || 100}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-1/2"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button type="submit" className="btn-primary">
                  Rechercher
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h2 className="text-2xl font-bold">
                {loading ? 'Recherche en cours...' : `${totalCount} résultat${totalCount > 1 ? 's' : ''}`}
              </h2>
              
              <div className="mt-4 sm:mt-0">
                <label htmlFor="sort-by" className="text-sm font-medium mr-2">
                  Trier par:
                </label>
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field-sm"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-100 dark:bg-slate-700 rounded-lg h-64 animate-pulse"></div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Aucun résultat
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Essayez de modifier vos filtres ou d'élargir votre recherche
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((razor) => (
                  <RazorCard key={razor.id} razor={razor} />
                ))}
              </div>
            )}
          </div>
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

export default SearchPage
