import { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { nanoid } from 'nanoid'

// Fonction pour générer un lien de partage pour la collection d'un utilisateur
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Initialiser le client Supabase côté serveur
  const supabase = createServerSupabaseClient({ req, res })

  // Vérifier si l'utilisateur est authentifié
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return res.status(401).json({
      error: 'Vous devez être connecté pour partager votre collection'
    })
  }

  // Vérifier que la méthode est POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // Destructurer les données de la requête
    const { collectionType = 'favorites', limit = 0 } = req.body
    const userId = session.user.id

    // Récupérer les informations de l'utilisateur
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Error fetching user profile:', userError)
      return res.status(400).json({ error: userError.message })
    }

    const username = userData?.full_name || userData?.username || 'Utilisateur'
    // Utiliser un rang par défaut puisque la colonne n'existe pas
    const userRank = 'Membre'

    // Récupérer les données de collection à partager
    let collectionData
    let topCount = 0
    
    if (collectionType === 'favorites') {
      // Construire la requête de base
      let query = supabase
        .from('user_collections')
        .select(`
          id,
          razor_id,
          is_favorite,
          favorite_rating,
          variant_material,
          variant_finish,
          variant_comb_type,
          variant_notes,
          is_variant,
          razors (
            id,
            manufacturer,
            model,
            reference,
            image_url,
            blade_type,
            avg_gentleness
          )
        `)
        .eq('user_id', userId)
        .eq('is_favorite', true)
        .order('favorite_rating', { ascending: false })
      
      // Limiter les résultats si demandé
      if (limit && limit > 0) {
        query = query.limit(limit)
        topCount = limit
      }
      
      // Exécuter la requête
      const { data: favoriteRazors, error: favoritesError } = await query
      
      if (favoritesError) {
        return res.status(400).json({ error: favoritesError.message })
      }

      collectionData = {
        type: 'favorites',
        razors: favoriteRazors,
        topCount: topCount,
        creator: {
          username,
          rank: userRank
        }
      }
    } else if (collectionType === 'owned') {
      // Récupérer les rasoirs possédés (non wishlist)
      const { data: ownedRazors, error: ownedError } = await supabase
        .from('user_collections')
        .select(`
          id,
          razor_id,
          in_wishlist,
          is_favorite,
          variant_material,
          variant_finish,
          variant_comb_type,
          variant_notes,
          is_variant,
          razors (
            id,
            manufacturer,
            model,
            reference,
            image_url,
            blade_type,
            avg_gentleness
          )
        `)
        .eq('user_id', userId)
        .eq('in_wishlist', false)

      if (ownedError) {
        return res.status(400).json({ error: ownedError.message })
      }

      collectionData = {
        type: 'owned',
        razors: ownedRazors,
        creator: {
          username,
          rank: userRank
        }
      }
    } else if (collectionType === 'wishlist') {
      // Récupérer les rasoirs en wishlist
      const { data: wishlistRazors, error: wishlistError } = await supabase
        .from('user_collections')
        .select(`
          id,
          razor_id,
          in_wishlist,
          is_favorite,
          variant_material,
          variant_finish,
          variant_comb_type,
          variant_notes,
          is_variant,
          razors (
            id,
            manufacturer,
            model,
            reference,
            image_url,
            blade_type,
            avg_gentleness
          )
        `)
        .eq('user_id', userId)
        .eq('in_wishlist', true)

      if (wishlistError) {
        return res.status(400).json({ error: wishlistError.message })
      }

      collectionData = {
        type: 'wishlist',
        razors: wishlistRazors,
        creator: {
          username,
          rank: userRank
        }
      }
    } else {
      return res.status(400).json({ error: 'Type de collection invalide' })
    }

    // Générer un token unique pour le partage
    const shareToken = nanoid(12)

    // Calculer la date d'expiration (30 jours)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    try {
      // Insérer le partage dans la base de données
      const { data: shareData, error: shareError } = await supabase
        .from('collection_shares')
        .insert({
          user_id: userId,
          share_token: shareToken,
          expires_at: expiresAt.toISOString(),
          collection_data: collectionData
        })
        .select()

      if (shareError) {
        console.error('Error creating share:', shareError)
        return res.status(400).json({ error: shareError.message })
      }

      // Déterminer le nom du type de collection en français
      let collectionTypeName = ''
      switch(collectionType) {
        case 'favorites':
          collectionTypeName = topCount > 0 ? `Top ${topCount} de mes favoris` : 'favoris';
          break;
        case 'owned':
          collectionTypeName = 'collection';
          break;
        case 'wishlist':
          collectionTypeName = 'liste de souhaits';
          break;
      }

      // Générer les liens
      let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://relife-razor.vercel.app'
      if (siteUrl.endsWith('/')) {
        siteUrl = siteUrl.slice(0, -1)
      }
      
      const shareUrl = `${siteUrl}/collections/shared/${shareToken}`
      const bbCode = `[url=${shareUrl}]Ma ${collectionTypeName.charAt(0).toUpperCase() + collectionTypeName.slice(1)} de rasoirs sur Relife Razor[/url]`

      // Retourner les données de partage
      return res.status(200).json({
        success: true,
        data: {
          shareToken,
          shareUrl,
          bbCode,
          expiresAt: expiresAt.toISOString()
        }
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return res.status(500).json({ error: "Erreur lors de l'enregistrement du partage" })
    }
  } catch (error) {
    console.error('Error sharing collection:', error)
    return res.status(500).json({ error: 'Erreur lors du partage de la collection' })
  }
}
