import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

type RazorStatsProps = {
  className?: string
}

const RazorStats: React.FC<RazorStatsProps> = ({ className = '' }) => {
  const supabaseClient = useSupabaseClient()
  
  const [loading, setLoading] = useState(true)
  const [totalRazors, setTotalRazors] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalRatings, setTotalRatings] = useState(0)
  const [popularRazors, setPopularRazors] = useState<any[]>([])
  const [gentleRazors, setGentleRazors] = useState<any[]>([])
  const [aggressiveRazors, setAggressiveRazors] = useState<any[]>([])
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        
        // Récupérer le nombre total de rasoirs
        const { count: razorCount } = await supabaseClient
          .from('razors')
          .select('*', { count: 'exact', head: true })
        
        setTotalRazors(razorCount || 0)
        
        // Récupérer le nombre total d'utilisateurs
        const { count: userCount } = await supabaseClient
          .from('profiles')
          .select('*', { count: 'exact', head: true })
        
        setTotalUsers(userCount || 0)
        
        // Récupérer le nombre total d'évaluations
        const { count: ratingCount } = await supabaseClient
          .from('user_ratings')
          .select('*', { count: 'exact', head: true })
        
        setTotalRatings(ratingCount || 0)
        
        // Récupérer les rasoirs les plus populaires (basé sur le nombre d'utilisateurs qui les ont dans leur collection)
        const { data: popularData } = await supabaseClient
          .from('razors')
          .select(`
            id,
            manufacturer,
            model,
            reference,
            image_url,
            avg_gentleness,
            user_collections(count)
          `)
          .not('user_collections', 'is', null)
          .order('user_collections.count', { ascending: false })
          .limit(5)
        
        if (popularData) {
          setPopularRazors(popularData)
        }
        
        // Récupérer les rasoirs les plus doux
        const { data: gentleData } = await supabaseClient
          .from('razors')
          .select('id, manufacturer, model, reference, image_url, avg_gentleness')
          .order('avg_gentleness', { ascending: true })
          .limit(5)
        
        if (gentleData) {
          setGentleRazors(gentleData)
        }
        
        // Récupérer les rasoirs les plus agressifs
        const { data: aggressiveData } = await supabaseClient
          .from('razors')
          .select('id, manufacturer, model, reference, image_url, avg_gentleness')
          .order('avg_gentleness', { ascending: false })
          .limit(5)
        
        if (aggressiveData) {
          setAggressiveRazors(aggressiveData)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
  }, [supabaseClient])
  
  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 ${className}`}>
        <h2 className="text-2xl font-bold mb-4">Statistiques</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-2/3"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold mb-6">Statistiques de la Communauté</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg text-center">
          <span className="block text-3xl font-bold text-primary">{totalRazors}</span>
          <span className="text-gray-600 dark:text-gray-300">Rasoirs référencés</span>
        </div>
        <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg text-center">
          <span className="block text-3xl font-bold text-primary">{totalUsers}</span>
          <span className="text-gray-600 dark:text-gray-300">Utilisateurs</span>
        </div>
        <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg text-center">
          <span className="block text-3xl font-bold text-primary">{totalRatings}</span>
          <span className="text-gray-600 dark:text-gray-300">Évaluations</span>
        </div>
      </div>
      
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">Rasoirs les plus populaires</h3>
          <div className="space-y-3">
            {popularRazors.length > 0 ? (
              popularRazors.map((razor) => (
                <Link 
                  key={razor.id}
                  href={`/razors/${razor.id}`}
                  className="flex items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <div className="w-10 h-10 flex-shrink-0 mr-3 bg-white dark:bg-slate-800 rounded overflow-hidden">
                    {razor.image_url ? (
                      <img
                        src={razor.image_url}
                        alt={`${razor.manufacturer} ${razor.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium">
                      {razor.manufacturer} {razor.model}
                      {razor.reference && <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">({razor.reference})</span>}
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Douceur: {razor.avg_gentleness}/20
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-2">
                Aucune donnée disponible
              </p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">Les plus doux</h3>
            <div className="space-y-3">
              {gentleRazors.length > 0 ? (
                gentleRazors.map((razor) => (
                  <Link 
                    key={razor.id}
                    href={`/razors/${razor.id}`}
                    className="flex items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <div className="w-8 h-8 flex-shrink-0 mr-3 bg-white dark:bg-slate-800 rounded overflow-hidden">
                      {razor.image_url ? (
                        <img
                          src={razor.image_url}
                          alt={`${razor.manufacturer} ${razor.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium text-sm">
                        {razor.manufacturer} {razor.model}
                      </h4>
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        Douceur: <span className="font-semibold text-green-600 dark:text-green-400">{razor.avg_gentleness}/20</span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-2">
                  Aucune donnée disponible
                </p>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Les plus agressifs</h3>
            <div className="space-y-3">
              {aggressiveRazors.length > 0 ? (
                aggressiveRazors.map((razor) => (
                  <Link 
                    key={razor.id}
                    href={`/razors/${razor.id}`}
                    className="flex items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <div className="w-8 h-8 flex-shrink-0 mr-3 bg-white dark:bg-slate-800 rounded overflow-hidden">
                      {razor.image_url ? (
                        <img
                          src={razor.image_url}
                          alt={`${razor.manufacturer} ${razor.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium text-sm">
                        {razor.manufacturer} {razor.model}
                      </h4>
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        Douceur: <span className="font-semibold text-red-600 dark:text-red-400">{razor.avg_gentleness}/20</span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-2">
                  Aucune donnée disponible
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/" className="btn-primary">
          Voir tous les rasoirs
        </Link>
      </div>
    </div>
  )
}

export default RazorStats
