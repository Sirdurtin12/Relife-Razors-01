import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AuthForm from '../../components/auth/AuthForm'
import type { GetStaticProps } from 'next'

const SignUp = () => {
  return (
    <div className="min-h-screen py-12">
      <Head>
        <title>Inscription | Relife Razor</title>
        <meta name="description" content="Créez un compte Relife Razor pour gérer votre collection de rasoirs." />
      </Head>

      <main className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Inscription</h1>
          
          <AuthForm mode="signup" />
          
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Vous avez déjà un compte ?{' '}
              <Link href="/auth/signin" className="text-primary hover:underline">
                Se connecter
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

export default SignUp
