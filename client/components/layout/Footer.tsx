import React from 'react'
import Link from 'next/link'

const Footer = () => {
  const year = new Date().getFullYear()
  
  return (
    <footer className="bg-white dark:bg-slate-900 shadow-inner py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/" className="text-xl font-semibold text-primary">
              Relife Razor
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Plateforme collaborative pour passionnés de rasage traditionnel
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6 text-center md:text-right">
            <Link href="/about" className="text-sm hover:text-primary">
              À propos
            </Link>
            <Link href="/privacy" className="text-sm hover:text-primary">
              Confidentialité
            </Link>
            <Link href="/terms" className="text-sm hover:text-primary">
              Conditions d'utilisation
            </Link>
            <a 
              href="https://atelierdurdan.com/en" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm hover:text-primary"
            >
              Atelier Durdan
            </a>
          </div>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          &copy; {year} Relife Razor. Tous droits réservés.
        </div>
      </div>
    </footer>
  )
}

export default Footer
