import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AuthForm from '../../components/auth/AuthForm'
import type { GetStaticProps } from 'next'

const SignIn = () => {
  return (
    <div className="min-h-screen py-12">
      <Head>
        <title>Connexion | Relife Razor</title>
        <meta name="description" content="Connectez-vous à votre compte Relife Razor pour accéder à votre collection de rasoirs." />
      </Head>

      <main className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Connexion</h1>
          
          <AuthForm mode="signin" />
          
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Vous n'avez pas de compte ?{' '}
              <Link href="/auth/signup" className="text-primary hover:underline">
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {}
  }
}

export default SignIn
