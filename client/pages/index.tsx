import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'

const Home = () => {
  const user = useUser()
  const supabaseClient = useSupabaseClient()
  const [isAdmin, setIsAdmin] = useState(false)

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
  }, [user, supabaseClient])

  return (
    <div className="min-h-screen">
      <Head>
        <title>Relife Razor - Base de données collaborative de rasoirs traditionnels</title>
        <meta name="description" content="Explorez, comparez et partagez votre collection de rasoirs traditionnels" />
        <meta name="keywords" content="rasoir, rasage traditionnel, safety razor, DE razor, collection" />
        <meta property="og:title" content="Relife Razor - Base de données collaborative de rasoirs traditionnels" />
        <meta property="og:description" content="Explorez, comparez et partagez votre collection de rasoirs traditionnels" />
        <meta property="og:type" content="website" />
      </Head>

      <main className="container mx-auto px-4 py-12">
        {/* Section d'introduction */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-high-contrast">
            Base de données collaborative<br />de rasoirs traditionnels
          </h1>
          <p className="text-xl max-w-3xl mx-auto mb-10 text-medium-contrast">
            Explorez, comparez et partagez votre collection de rasoirs traditionnels
          </p>
          
          {!user ? (
            <div className="space-x-6">
              <Link href="/auth/signin" className="btn-primary">
                Connexion
              </Link>
              <Link href="/auth/signup" className="btn-secondary">
                Inscription
              </Link>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-0 md:space-x-6 flex flex-col md:flex-row justify-center">
              <Link href="/razors" className="btn-primary">
                Explorer les rasoirs
              </Link>
            </div>
          )}
        </div>

        {/* Blocs d'explication des fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-high-contrast">Explorez la base de données</h2>
            <p className="text-medium-contrast">
              Accédez à une liste détaillée de rasoirs de sûreté traditionnels avec toutes leurs caractéristiques techniques.
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-high-contrast">Partagez votre expérience</h2>
            <p className="text-medium-contrast">
              Évaluez la douceur des rasoirs, laissez des avis et partagez votre collection avec la communauté.
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-high-contrast">Comparez les rasoirs</h2>
            <p className="text-medium-contrast">
              Utilisez notre outil de comparaison pour analyser côte à côte les caractéristiques de différents rasoirs.
            </p>
          </div>
        </div>

        {/* Section "Comment ça marche" */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mb-10 border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-high-contrast">Comment ça marche</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 text-2xl font-bold mb-4">1</div>
              <h3 className="text-lg font-medium mb-2">Créez un compte</h3>
              <p className="text-medium-contrast">
                Inscrivez-vous gratuitement pour accéder à toutes les fonctionnalités de Relife Razor.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 text-2xl font-bold mb-4">2</div>
              <h3 className="text-lg font-medium mb-2">Explorez les rasoirs</h3>
              <p className="text-medium-contrast">
                Parcourez notre base de données de rasoirs avec leurs caractéristiques techniques.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 text-2xl font-bold mb-4">3</div>
              <h3 className="text-lg font-medium mb-2">Créez votre collection</h3>
              <p className="text-medium-contrast">
                Ajoutez des rasoirs à votre collection, liste de souhaits ou favoris.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 text-2xl font-bold mb-4">4</div>
              <h3 className="text-lg font-medium mb-2">Partagez et comparez</h3>
              <p className="text-medium-contrast">
                Partagez votre collection et comparez les rasoirs pour trouver celui qui vous convient.
              </p>
            </div>
          </div>
        </div>

        {/* Bannière d'appel à l'action */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mb-6 border border-gray-100 dark:border-gray-700 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-high-contrast">Rejoignez la communauté</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto text-medium-contrast">
            Créez un compte gratuit pour gérer votre collection et contribuer à la base de données.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {!user ? (
              <>
                <Link href="/auth/signup" className="btn-primary">
                  Créer un compte
                </Link>
                <Link href="/razors" className="btn-secondary">
                  Explorer les rasoirs
                </Link>
              </>
            ) : (
              <Link href="/razors" className="btn-primary">
                Explorer les rasoirs
              </Link>
            )}
          </div>
        </div>

        <div className="text-center py-6 border-t border-gray-200 dark:border-gray-700">
          <a 
            href="https://atelierdurdan.com/en" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary hover:underline focus-outline text-xl inline-flex items-center gap-2"
          >
            Découvrez notre boutique - Atelier Durdan
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </main>
    </div>
  )
}

export default Home
