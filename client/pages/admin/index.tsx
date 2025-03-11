import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import AdminLayout from '../../components/admin/AdminLayout'

const AdminDashboard = () => {
  const supabaseClient = useSupabaseClient()
  
  const [stats, setStats] = useState({
    totalRazors: 0,
    totalUsers: 0,
    totalRatings: 0,
    totalCollections: 0,
    recentRazors: [] as any[],
    recentUsers: [] as any[]
  })
  
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Récupérer les statistiques
        const [
          razorCountResult,
          userCountResult,
          ratingCountResult,
          collectionCountResult,
          recentRazorsResult,
          recentUsersResult
        ] = await Promise.all([
          // Nombre total de rasoirs
          supabaseClient
            .from('razors')
            .select('*', { count: 'exact', head: true }),
          
          // Nombre total d'utilisateurs
          supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true }),
          
          // Nombre total d'évaluations
          supabaseClient
            .from('user_ratings')
            .select('*', { count: 'exact', head: true }),
          
          // Nombre total d'éléments dans les collections
          supabaseClient
            .from('user_collections')
            .select('*', { count: 'exact', head: true }),
          
          // Rasoirs récemment ajoutés
          supabaseClient
            .from('razors')
            .select(`
              id,
              manufacturer,
              model,
              reference,
              created_at,
              profiles (
                username,
                email
              )
            `)
            .order('created_at', { ascending: false })
            .limit(5),
          
          // Utilisateurs récemment inscrits
          supabaseClient
            .from('profiles')
            .select('id, username, email, created_at')
            .order('created_at', { ascending: false })
            .limit(5)
        ])
        
        setStats({
          totalRazors: razorCountResult.count || 0,
          totalUsers: userCountResult.count || 0,
          totalRatings: ratingCountResult.count || 0,
          totalCollections: collectionCountResult.count || 0,
          recentRazors: recentRazorsResult.data || [],
          recentUsers: recentUsersResult.data || []
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [supabaseClient])
  
  return (
    <>
      <Head>
        <title>Tableau de bord administrateur | Relife Razor</title>
      </Head>
      
      <AdminLayout title="Tableau de bord">
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Chargement des données...</p>
          </div>
        ) : (
          <div>
            {/* Statistiques générales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Rasoirs</h3>
                <div className="text-3xl font-bold">{stats.totalRazors}</div>
                <div className="mt-2">
                  <Link href="/admin/razors" className="text-primary text-sm hover:underline">
                    Gérer les rasoirs &rarr;
                  </Link>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Utilisateurs</h3>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
                <div className="mt-2">
                  <Link href="/admin/users" className="text-primary text-sm hover:underline">
                    Gérer les utilisateurs &rarr;
                  </Link>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Évaluations</h3>
                <div className="text-3xl font-bold">{stats.totalRatings}</div>
                <div className="mt-2">
                  <Link href="/admin/stats" className="text-primary text-sm hover:underline">
                    Voir les statistiques &rarr;
                  </Link>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Collections</h3>
                <div className="text-3xl font-bold">{stats.totalCollections}</div>
                <div className="mt-2">
                  <Link href="/admin/stats" className="text-primary text-sm hover:underline">
                    Voir les statistiques &rarr;
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Actions rapides */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link 
                  href="/admin/razors/add" 
                  className="bg-primary text-white p-4 rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <div className="font-medium">Ajouter un rasoir</div>
                  <div className="text-sm opacity-80 mt-1">Créer une nouvelle entrée</div>
                </Link>
                
                <Link 
                  href="/admin/razors/pending" 
                  className="bg-yellow-500 text-white p-4 rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  <div className="font-medium">Rasoirs en attente</div>
                  <div className="text-sm opacity-80 mt-1">Valider les nouvelles entrées</div>
                </Link>
                
                <Link 
                  href="/admin/users" 
                  className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <div className="font-medium">Gérer les utilisateurs</div>
                  <div className="text-sm opacity-80 mt-1">Modifier les droits</div>
                </Link>
                
                <Link 
                  href="/admin/settings" 
                  className="bg-gray-500 text-white p-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <div className="font-medium">Paramètres</div>
                  <div className="text-sm opacity-80 mt-1">Configuration du site</div>
                </Link>
              </div>
            </div>
            
            {/* Activité récente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Rasoirs récemment ajoutés */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Rasoirs récemment ajoutés</h2>
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-100 dark:bg-slate-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Rasoir
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Ajouté par
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-700 divide-y divide-gray-200 dark:divide-gray-600">
                      {stats.recentRazors.length > 0 ? (
                        stats.recentRazors.map((razor) => (
                          <tr key={razor.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link 
                                href={`/admin/razors/${razor.id}`}
                                className="font-medium text-primary hover:underline"
                              >
                                {razor.manufacturer} {razor.model}
                                {razor.reference && ` (${razor.reference})`}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {razor.profiles?.username || razor.profiles?.email || 'Utilisateur inconnu'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {new Date(razor.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                            Aucun rasoir récent
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-right">
                  <Link href="/admin/razors" className="text-primary hover:underline text-sm">
                    Voir tous les rasoirs &rarr;
                  </Link>
                </div>
              </div>
              
              {/* Utilisateurs récemment inscrits */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Utilisateurs récemment inscrits</h2>
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-100 dark:bg-slate-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Utilisateur
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-700 divide-y divide-gray-200 dark:divide-gray-600">
                      {stats.recentUsers.length > 0 ? (
                        stats.recentUsers.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link 
                                href={`/admin/users/${user.id}`}
                                className="font-medium text-primary hover:underline"
                              >
                                {user.username || 'Sans nom'}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                            Aucun utilisateur récent
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-right">
                  <Link href="/admin/users" className="text-primary hover:underline text-sm">
                    Voir tous les utilisateurs &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  )
}

export default AdminDashboard
