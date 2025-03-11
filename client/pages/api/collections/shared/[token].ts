import { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Initialiser le client Supabase côté serveur
  const supabase = createServerSupabaseClient({ req, res })
  
  // Vérifier que la méthode est GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }
  
  try {
    const { token } = req.query
    
    // Vérifier que le token est valide
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token de partage invalide' })
    }
    
    // Récupérer les données de partage
    const { data, error } = await supabase
      .from('collection_shares')
      .select('*')
      .eq('share_token', token)
      .single()
    
    if (error || !data) {
      console.error('Error retrieving share:', error)
      return res.status(404).json({ error: 'Partage non trouvé ou expiré' })
    }
    
    // Vérifier si le partage est expiré
    const expiresAt = new Date(data.expires_at)
    if (expiresAt < new Date()) {
      return res.status(410).json({ error: 'Ce partage a expiré' })
    }
    
    // Retourner les données de partage
    return res.status(200).json({
      success: true,
      data: data.collection_data,
      sharedAt: data.created_at,
      expiresAt: data.expires_at
    })
  } catch (error) {
    console.error('Error retrieving shared collection:', error)
    return res.status(500).json({ error: "Erreur lors de la récupération de la collection partagée" })
  }
}
