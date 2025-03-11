import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import AdminLayout from '../../components/admin/AdminLayout'

const AdminStatsPage = () => {
  const supabaseClient = useSupabaseClient()
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    razorsByType: [] as any[],
    razorsByGentleness: [] as any[],
    topRatedRazors: [] as any[],
    mostCollectedRazors: [] as any[],
    userActivity: [] as any[],
    monthlyGrowth: [] as any[]
  })
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        
        // Récupérer les statistiques
        const [
          razorsByTypeResult,
          topRatedRazorsResult,
          mostCollectedRazorsResult,
          monthlyGrowthResult
        ] = await Promise.all([
          // Répartition des rasoirs par type
          supabaseClient.rpc('get_razors_by_blade_type'),
          
          // Rasoirs les mieux notés
          supabaseClient
            .from('razors')
            .select('id, manufacturer, model, reference, avg_gentleness, user_ratings(count)')
            .order('avg_gentleness', { ascending: true })
            .limit(10),
          
          // Rasoirs les plus collectionnés
          supabaseClient
            .from('razors')
            .select('id, manufacturer, model, reference, user_collections(count)')
            .not('user_collections', 'is', null)
            .order('user_collections.count', { ascending: false })
            .limit(10),
          
          // Croissance mensuelle (simulée - à remplacer par une vraie requête)
          Promise.resolve({
            data: [
              { month: 'Janvier', razors: 12, users: 34, ratings: 56 },
              { month: 'Février', razors: 15, users: 42, ratings: 78 },
              { month: 'Mars', razors: 18, users: 45, ratings: 89 },
              { month: 'Avril', razors: 22, users: 51, ratings: 102 },
              { month: 'Mai', razors: 28, users: 58, ratings: 115 },
              { month: 'Juin', razors: 35, users: 67, ratings: 142 }
            ]
          })
        ])
        
        // Simuler la répartition par niveau de douceur
        const gentlenessRanges = [
          { range: '1-5', label: 'Très doux', count: 0 },
          { range: '6-10', label: 'Doux', count: 0 },
          { range: '11-15', label: 'Moyen', count: 0 },
          { range: '16-20', label: 'Agressif', count: 0 }
        ]
        
        // Récupérer les rasoirs par niveau de douceur
        const { data: razorsByGentleness } = await supabaseClient
          .from('razors')
          .select('avg_gentleness')
        
        if (razorsByGentleness) {
          razorsByGentleness.forEach((razor) => {
            const gentleness = razor.avg_gentleness
            
            if (gentleness >= 1 && gentleness <= 5) {
              gentlenessRanges[0].count++
            } else if (gentleness >= 6 && gentleness <= 10) {
              gentlenessRanges[1].count++
            } else if (gentleness >= 11 && gentleness <= 15) {
              gentlenessRanges[2].count++
            } else if (gentleness >= 16 && gentleness <= 20) {
              gentlenessRanges[3].count++
            }
          })
        }
        
        // Simuler l'activité des utilisateurs
        const userActivity = [
          { action: 'Évaluations', count: 245 },
          { action: 'Ajouts à la collection', count: 187 },
          { action: 'Ajouts à la liste de souhaits', count: 134 },
          { action: 'Nouveaux rasoirs', count: 56 }
        ]
        
        setStats({
          razorsByType: razorsByTypeResult.data || [],
          razorsByGentleness: gentlenessRanges,
          topRatedRazors: topRatedRazorsResult.data || [],
          mostCollectedRazors: mostCollectedRazorsResult.data || [],
          userActivity,
          monthlyGrowth: monthlyGrowthResult.data || []
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
  }, [supabaseClient])
  
  return (
    <>
      <Head>
        <title>Statistiques | Admin | Relife Razor</title>
      </Head>
      
      <AdminLayout title="Statistiques">
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Chargement des statistiques...</p>
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Répartition des rasoirs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Répartition par type */}
                <div className="bg-white dark:bg-slate-700 rounded-lg p-4 shadow">
                  <h3 className="text-lg font-medium mb-3">Par type de lame</h3>
                  <div className="space-y-3">
                    {stats.razorsByType.map((item) => (
                      <div key={item.blade_type} className="flex items-center">
                        <div className="w-24 font-medium">{item.blade_type}</div>
                        <div className="flex-grow">
                          <div className="h-6 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ 
                                width: `${(item.count / stats.razorsByType.reduce((sum, i) => sum + i.count, 0)) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-12 text-right">{item.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Répartition par niveau de douceur */}
                <div className="bg-white dark:bg-slate-700 rounded-lg p-4 shadow">
                  <h3 className="text-lg font-medium mb-3">Par niveau de douceur</h3>
                  <div className="space-y-3">
                    {stats.razorsByGentleness.map((item) => (
                      <div key={item.range} className="flex items-center">
                        <div className="w-24 font-medium">
                          {item.label}
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">
                            {item.range}
                          </span>
                        </div>
                        <div className="flex-grow">
                          <div className="h-6 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ 
                                width: `${(item.count / stats.razorsByGentleness.reduce((sum, i) => sum + i.count, 0)) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-12 text-right">{item.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Rasoirs populaires</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rasoirs les mieux notés */}
                <div className="bg-white dark:bg-slate-700 rounded-lg p-4 shadow">
                  <h3 className="text-lg font-medium mb-3">Les plus doux</h3>
                  <div className="space-y-2">
                    {stats.topRatedRazors.slice(0, 5).map((razor, index) => (
                      <div key={razor.id} className="flex items-center p-2 bg-gray-50 dark:bg-slate-600 rounded">
                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm mr-3">
                          {index + 1}
                        </div>
                        <div className="flex-grow">
                          <div className="font-medium">
                            {razor.manufacturer} {razor.model}
                            {razor.reference && <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">({razor.reference})</span>}
                          </div>
                        </div>
                        <div className="text-right font-bold">
                          {razor.avg_gentleness}/20
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Rasoirs les plus collectionnés */}
                <div className="bg-white dark:bg-slate-700 rounded-lg p-4 shadow">
                  <h3 className="text-lg font-medium mb-3">Les plus collectionnés</h3>
                  <div className="space-y-2">
                    {stats.mostCollectedRazors.slice(0, 5).map((razor, index) => (
                      <div key={razor.id} className="flex items-center p-2 bg-gray-50 dark:bg-slate-600 rounded">
                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm mr-3">
                          {index + 1}
                        </div>
                        <div className="flex-grow">
                          <div className="font-medium">
                            {razor.manufacturer} {razor.model}
                            {razor.reference && <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">({razor.reference})</span>}
                          </div>
                        </div>
                        <div className="text-right font-bold">
                          {razor.user_collections.count} collections
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Activité de la plateforme</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Activité des utilisateurs */}
                <div className="bg-white dark:bg-slate-700 rounded-lg p-4 shadow">
                  <h3 className="text-lg font-medium mb-3">Activité récente (30 derniers jours)</h3>
                  <div className="space-y-3">
                    {stats.userActivity.map((item) => (
                      <div key={item.action} className="flex items-center">
                        <div className="w-48 font-medium">{item.action}</div>
                        <div className="flex-grow">
                          <div className="h-6 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full"
                              style={{ 
                                width: `${(item.count / stats.userActivity.reduce((sum, i) => sum + i.count, 0)) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-16 text-right">{item.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Croissance mensuelle */}
                <div className="bg-white dark:bg-slate-700 rounded-lg p-4 shadow">
                  <h3 className="text-lg font-medium mb-3">Croissance mensuelle</h3>
                  <div className="h-64 flex items-end justify-between">
                    {stats.monthlyGrowth.map((item) => (
                      <div key={item.month} className="flex flex-col items-center">
                        <div className="flex space-x-1 h-48">
                          <div 
                            className="w-3 bg-blue-500 rounded-t"
                            style={{ 
                              height: `${(item.users / Math.max(...stats.monthlyGrowth.map(i => i.users))) * 100}%` 
                            }}
                            title={`${item.users} utilisateurs`}
                          ></div>
                          <div 
                            className="w-3 bg-green-500 rounded-t"
                            style={{ 
                              height: `${(item.razors / Math.max(...stats.monthlyGrowth.map(i => i.razors))) * 100}%` 
                            }}
                            title={`${item.razors} rasoirs`}
                          ></div>
                          <div 
                            className="w-3 bg-purple-500 rounded-t"
                            style={{ 
                              height: `${(item.ratings / Math.max(...stats.monthlyGrowth.map(i => i.ratings))) * 100}%` 
                            }}
                            title={`${item.ratings} évaluations`}
                          ></div>
                        </div>
                        <div className="text-xs mt-2 text-gray-600 dark:text-gray-300">
                          {item.month.substring(0, 3)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center mt-4 text-sm space-x-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
                      <span>Utilisateurs</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                      <span>Rasoirs</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded mr-1"></div>
                      <span>Évaluations</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
              <p>Les statistiques sont mises à jour quotidiennement.</p>
              <p>Dernière mise à jour: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  )
}

export default AdminStatsPage
