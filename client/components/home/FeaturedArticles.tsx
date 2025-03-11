import React from 'react'
import Link from 'next/link'

type Article = {
  id: string
  title: string
  excerpt: string
  imageUrl: string
  slug: string
  date: string
  author: string
}

type FeaturedArticlesProps = {
  className?: string
}

const FeaturedArticles: React.FC<FeaturedArticlesProps> = ({ className = '' }) => {
  // Données simulées pour les articles
  // Dans une version future, ces données pourraient provenir d'une table dans Supabase
  const articles: Article[] = [
    {
      id: '1',
      title: 'Guide du débutant pour le rasage traditionnel',
      excerpt: 'Tout ce que vous devez savoir pour commencer avec un rasoir de sûreté et obtenir un rasage parfait dès le premier essai.',
      imageUrl: 'https://images.unsplash.com/photo-1621607512214-68297480165e',
      slug: 'guide-debutant-rasage-traditionnel',
      date: '2023-05-15',
      author: 'Jean Dupont'
    },
    {
      id: '2',
      title: 'Comment choisir son premier rasoir de sûreté',
      excerpt: 'Les critères essentiels pour sélectionner un rasoir adapté à votre type de peau et à votre expérience.',
      imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70',
      slug: 'choisir-premier-rasoir-surete',
      date: '2023-06-22',
      author: 'Marie Martin'
    },
    {
      id: '3',
      title: 'L\'histoire des rasoirs de sûreté',
      excerpt: 'De l\'invention de King C. Gillette à nos jours, découvrez l\'évolution fascinante des rasoirs de sûreté au fil du temps.',
      imageUrl: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a',
      slug: 'histoire-rasoirs-surete',
      date: '2023-07-10',
      author: 'Pierre Lefèvre'
    }
  ]
  
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Articles & Tutoriels</h2>
        <Link href="#" className="text-primary hover:underline text-sm">
          Voir tous les articles
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((article) => (
          <div key={article.id} className="group">
            <Link href={`#${article.slug}`} className="block">
              <div className="mb-3 overflow-hidden rounded-lg aspect-video">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                {article.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                {article.excerpt}
              </p>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <span>{article.author}</span>
                <span className="mx-2">•</span>
                <span>{new Date(article.date).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            </Link>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <Link href="#" className="btn-secondary">
          Contribuer avec un article
        </Link>
      </div>
    </div>
  )
}

export default FeaturedArticles
