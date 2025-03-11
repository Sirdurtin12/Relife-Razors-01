import React, { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'

type AdminLayoutProps = {
  children: ReactNode
  title: string
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const router = useRouter()
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Vérifier si l'utilisateur est administrateur
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        router.push('/auth/signin?redirect=/admin')
        return
      }
      
      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        
        if (error) throw error
        
        if (data && data.is_admin) {
          setIsAdmin(true)
        } else {
          // Rediriger si l'utilisateur n'est pas administrateur
          router.push('/')
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }
    
    checkAdminStatus()
  }, [user, supabaseClient, router])
  
  // Menu de navigation admin
  const adminMenu = [
    { name: 'Tableau de bord', path: '/admin' },
    { name: 'Gestion des rasoirs', path: '/admin/razors' },
    { name: 'Utilisateurs', path: '/admin/users' },
    { name: 'Statistiques', path: '/admin/stats' },
    { name: 'Paramètres', path: '/admin/settings' }
  ]
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Chargement...</p>
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }
  
  if (!isAdmin) {
    return null // Le redirection est géré dans le useEffect
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-primary mr-8">
                Relife Razor
              </Link>
              <h1 className="text-xl font-semibold">{title}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-primary">
                Retour au site
              </Link>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
              <div className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Connecté en tant qu'admin</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
              <nav className="p-4">
                <ul className="space-y-1">
                  {adminMenu.map((item) => (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        className={`block px-4 py-2 rounded-md transition-colors ${
                          router.pathname === item.path
                            ? 'bg-primary bg-opacity-10 text-primary font-medium'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <button
                  onClick={() => supabaseClient.auth.signOut().then(() => router.push('/'))}
                  className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </aside>
          
          {/* Main content */}
          <main className="flex-grow">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
