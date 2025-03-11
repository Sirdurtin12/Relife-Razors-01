import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Razor } from '../../lib/supabase'
import RazorListItem from '../../components/razors/RazorListItem'
import GentlenessGuide from '../../components/razors/GentlenessGuide'
import { GetServerSideProps } from 'next'

const RazorsPage = () => {
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  const [razors, setRazors] = useState<Razor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [gentlenessRange, setGentlenessRange] = useState<[number, number]>([1, 20])
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('')
  const [releaseYearRange, setReleaseYearRange] = useState<[number, number]>([1900, 2025])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  
  // Liste des types de rasoirs disponibles
  const razorTypes = ['DE', 'AC', 'GEM', 'other']
  const [manufacturers, setManufacturers] = useState<string[]>([])
  
  // Vérifier si l'utilisateur est administrateur
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false)
        return
      }
      
      try {
        const { data } = await supabaseClient
          .from('admins')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        setIsAdmin(!!data)
      } catch (err) {
        setIsAdmin(false)
      }
    }
    
    checkAdmin()
  }, [user])

  // Fonction pour charger les rasoirs depuis Supabase
  const loadRazors = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let query = supabaseClient.from('razors').select('*')
      
      // N'afficher que les rasoirs non privés (les variantes sont privées)
      query = query.eq('is_private', false)
      
      // Appliquer les filtres
      if (selectedType) {
        query = query.eq('blade_type', selectedType)
      }
      
      if (selectedManufacturer) {
        query = query.eq('manufacturer', selectedManufacturer)
      }
      
      // Filtrer par douceur, en incluant les rasoirs sans note si la plage commence à 1
      if (gentlenessRange[0] === 1) {
        // Si le filtre commence à 1, inclure également les rasoirs sans note (NULL)
        query = query.or(`avg_gentleness.gte.${gentlenessRange[0]},avg_gentleness.lte.${gentlenessRange[1]},avg_gentleness.is.null`)
      } else {
        // Sinon, appliquer le filtre normal pour la plage spécifiée
        query = query.gte('avg_gentleness', gentlenessRange[0])
          .lte('avg_gentleness', gentlenessRange[1])
      }
      
      // Filtre par année de mise en vente
      if (releaseYearRange[0] !== 1900 || releaseYearRange[1] !== 2025) {
        query = query.gte('release_year', releaseYearRange[0])
          .lte('release_year', releaseYearRange[1])
      }
      
      // Filtre par prix
      if (priceRange[0] !== 0 || priceRange[1] !== 500) {
        query = query.gte('price', priceRange[0])
          .lte('price', priceRange[1])
      }
      
      // Recherche textuelle
      if (searchTerm) {
        query = query.or(`manufacturer.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,reference.ilike.%${searchTerm}%`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      setRazors(data || [])
    } catch (err: any) {
      console.error('Error loading razors:', err)
      setError('Impossible de charger les rasoirs')
    } finally {
      setLoading(false)
    }
  }
  
  // Charger les fabricants disponibles
  const loadManufacturers = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('razors')
        .select('manufacturer')
        .eq('is_private', false)
        .order('manufacturer', { ascending: true })
      
      if (error) throw error
      
      // Extraire les fabricants uniques
      const uniqueManufacturers = Array.from(new Set(data.map(item => item.manufacturer)))
        .filter(manufacturer => manufacturer) // Filtrer les valeurs null/undefined
      
      setManufacturers(uniqueManufacturers)
    } catch (err) {
      console.error('Error loading manufacturers:', err)
    }
  }
  
  // Charger les rasoirs au chargement de la page et les fabricants
  useEffect(() => {
    loadManufacturers()
    loadRazors()
  }, [])
  
  // Recharger les rasoirs lorsque les filtres changent
  useEffect(() => {
    const timer = setTimeout(() => {
      loadRazors()
    }, 300)

    return () => clearTimeout(timer)
  }, [selectedType, selectedManufacturer, gentlenessRange, releaseYearRange, priceRange])
  
  // Gérer la recherche manuelle (pour éviter trop de requêtes pendant la frappe)
  const handleSearch = () => {
    loadRazors()
  }
  
  return (
    <div className="min-h-screen py-8">
      <Head>
        <title>Exploration des rasoirs traditionnels</title>
        <meta name="description" content="Explorez et découvrez les rasoirs de sécurité traditionnels, comparez leurs caractéristiques et trouvez le rasoir parfait pour vous" />
      </Head>
      
      <main className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-high-contrast">Explorer les rasoirs</h1>
          {user && (
            <Link href="/razors/add" className="btn-primary">
              Ajouter un rasoir
            </Link>
          )}
        </div>
        
        {/* Guide de douceur */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mb-10 border border-gray-100 dark:border-gray-700">
          <GentlenessGuide className="highlight" />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mb-10 border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-high-contrast">Filtrer les rasoirs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Recherche textuelle */}
            <div>
              <label htmlFor="search" className="block text-lg font-medium mb-2 text-medium-contrast">
                Rechercher
              </label>
              <div className="flex">
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Marque, modèle ou référence"
                  className="input-field rounded-r-none focus-outline"
                  aria-label="Rechercher par marque, modèle ou référence"
                />
                <button
                  onClick={handleSearch}
                  className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-r-lg focus-outline"
                  aria-label="Lancer la recherche"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Filtre par type */}
            <div>
              <label htmlFor="type" className="block text-lg font-medium mb-2 text-medium-contrast">
                Type de rasoir
              </label>
              <select
                id="type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input-field focus-outline"
                aria-label="Filtrer par type de rasoir"
              >
                <option value="">Tous les types</option>
                {razorTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === 'DE' && 'Double Edge'}
                    {type === 'AC' && 'Artist Club'}
                    {type === 'GEM' && 'GEM / SE'}
                    {type === 'other' && 'Autre'}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Filtre par fabricant */}
            <div>
              <label htmlFor="manufacturer" className="block text-lg font-medium mb-2 text-medium-contrast">
                Fabricant
              </label>
              <select
                id="manufacturer"
                value={selectedManufacturer}
                onChange={(e) => setSelectedManufacturer(e.target.value)}
                className="input-field focus-outline"
                aria-label="Filtrer par fabricant"
              >
                <option value="">Tous les fabricants</option>
                {manufacturers.map((manufacturer) => (
                  <option key={manufacturer} value={manufacturer}>
                    {manufacturer}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Filtre par niveau de douceur */}
            <div>
              <label htmlFor="gentleness" className="block text-lg font-medium mb-2 text-medium-contrast">
                Niveau de douceur: {gentlenessRange[0]} - {gentlenessRange[1]}
              </label>
              <div className="flex space-x-4 items-center">
                <span className="text-sm font-medium">1</span>
                <input
                  id="gentleness"
                  type="range"
                  min="1"
                  max="20"
                  value={gentlenessRange[0]}
                  onChange={(e) => setGentlenessRange([parseInt(e.target.value), gentlenessRange[1]])}
                  className="flex-grow accent-primary focus-outline"
                  aria-label="Filtre de douceur minimum"
                />
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={gentlenessRange[1]}
                  onChange={(e) => setGentlenessRange([gentlenessRange[0], parseInt(e.target.value)])}
                  className="flex-grow accent-primary focus-outline"
                  aria-label="Filtre de douceur maximum"
                />
                <span className="text-sm font-medium">20</span>
              </div>
            </div>
            
            {/* Filtre par année de sortie */}
            <div>
              <label htmlFor="releaseYear" className="block text-lg font-medium mb-2 text-medium-contrast">
                Année de sortie: {releaseYearRange[0]} - {releaseYearRange[1]}
              </label>
              <div className="flex space-x-4 items-center">
                <span className="text-sm font-medium">1900</span>
                <input
                  id="releaseYear"
                  type="range"
                  min="1900"
                  max="2025"
                  value={releaseYearRange[0]}
                  onChange={(e) => setReleaseYearRange([parseInt(e.target.value), releaseYearRange[1]])}
                  className="flex-grow accent-primary focus-outline"
                  aria-label="Filtre d'année minimum"
                />
                <input
                  type="range"
                  min="1900"
                  max="2025"
                  value={releaseYearRange[1]}
                  onChange={(e) => setReleaseYearRange([releaseYearRange[0], parseInt(e.target.value)])}
                  className="flex-grow accent-primary focus-outline"
                  aria-label="Filtre d'année maximum"
                />
                <span className="text-sm font-medium">2025</span>
              </div>
            </div>
            
            {/* Filtre par prix */}
            <div>
              <label htmlFor="price" className="block text-lg font-medium mb-2 text-medium-contrast">
                Prix (€): {priceRange[0]} - {priceRange[1]}
              </label>
              <div className="flex space-x-4 items-center">
                <span className="text-sm font-medium">0€</span>
                <input
                  id="price"
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                  className="flex-grow accent-primary focus-outline"
                  aria-label="Filtre de prix minimum"
                />
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="flex-grow accent-primary focus-outline"
                  aria-label="Filtre de prix maximum"
                />
                <span className="text-sm font-medium">500€</span>
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="spinner"></div>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-high-contrast">
              {razors.length} rasoir(s) trouvé(s)
            </h2>
            
            {razors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {razors.map((razor) => (
                  <RazorListItem key={razor.id} razor={razor} isAdmin={isAdmin} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-lg">Aucun rasoir ne correspond à vos critères</p>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedType('')
                    setSelectedManufacturer('')
                    setGentlenessRange([1, 20])
                    setReleaseYearRange([1900, 2025])
                    setPriceRange([0, 500])
                  }}
                  className="mt-4 btn-secondary"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// Fonction côté serveur
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  }
}

export default RazorsPage
