import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'

const Navbar = () => {
  const router = useRouter()
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [profile, setProfile] = useState<{ username?: string; full_name?: string } | null>(null)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut()
    router.push('/')
  }

  // Récupérer les informations de profil de l'utilisateur connecté
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null)
        return
      }

      try {
        const { data } = await supabaseClient
          .from('profiles')
          .select('username, full_name')
          .eq('id', user.id)
          .single()
        
        setProfile(data)
      } catch (error) {
        console.error('Erreur lors de la récupération du profil :', error)
      }
    }

    fetchProfile()
  }, [user, supabaseClient])

  // Déterminer le nom à afficher
  const displayName = profile 
    ? (profile.username || profile.full_name || user?.email?.split('@')[0]) 
    : null

  return (
    <nav className="bg-white dark:bg-slate-900 shadow-md py-6">
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-3xl font-bold text-primary" aria-label="Accueil Relife Razor">
            Relife <span className="text-lg font-medium">By</span>
          </Link>
          <Link href="https://atelierdurdan.com" target="_blank" rel="noopener noreferrer" aria-label="Site officiel de l'Atelier Durdan">
            <img 
              src="/logos/atelier-durdan-logo.png" 
              alt="Logo Atelier Durdan" 
              className="h-20 w-20 hover:opacity-80 transition-opacity"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/razors" className="text-lg font-medium hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 py-2 px-3 rounded-lg" aria-label="Voir tous les rasoirs">
            Rasoirs
          </Link>
          <Link href="/compare" className="text-lg font-medium hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 py-2 px-3 rounded-lg" aria-label="Comparer des rasoirs">
            Comparer
          </Link>
          
          {user ? (
            <>
              <Link href="/collections" className="text-lg font-medium hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 py-2 px-3 rounded-lg" aria-label="Voir ma collection de rasoirs">
                Collections
              </Link>
              <div className="flex items-center space-x-6">
                <Link href="/profile" className="text-lg text-primary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 py-2 px-3 rounded-lg" aria-label="Accéder à mon profil">
                  {displayName ? displayName : "Profil"}
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="text-lg font-medium hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 py-2 px-4 rounded-lg"
                  aria-label="Se déconnecter"
                >
                  Déconnexion
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="text-lg font-medium hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 py-2 px-4 rounded-lg" aria-label="Se connecter">
                Connexion
              </Link>
              <Link href="/auth/signup" className="text-lg font-medium btn-primary py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" aria-label="Créer un compte">
                Inscription
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden text-gray-700 dark:text-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={toggleMenu}
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 px-6 pt-3 pb-6 shadow-inner">
          <Link href="/razors" className="block text-lg font-medium py-3 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg px-3" aria-label="Voir tous les rasoirs">
            Rasoirs
          </Link>
          <Link href="/compare" className="block text-lg font-medium py-3 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg px-3" aria-label="Comparer des rasoirs">
            Comparer
          </Link>
          
          {user ? (
            <>
              {displayName && (
                <div className="py-3 text-lg text-primary font-medium border-b border-gray-200 dark:border-gray-700 mb-3 px-3">
                  {displayName}
                </div>
              )}
              <Link href="/profile" className="block text-lg font-medium py-3 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg px-3" aria-label="Voir mon profil">
                Profil
              </Link>
              <Link href="/collections" className="block text-lg font-medium py-3 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg px-3" aria-label="Voir ma collection de rasoirs">
                Collections
              </Link>
              <button 
                onClick={handleSignOut}
                className="block w-full text-left text-lg font-medium py-3 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg px-3"
                aria-label="Se déconnecter"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="block text-lg font-medium py-3 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg px-3" aria-label="Se connecter">
                Connexion
              </Link>
              <Link href="/auth/signup" className="block text-lg font-medium py-3 mt-2 btn-primary text-center rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 px-3" aria-label="Créer un compte">
                Inscription
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar
