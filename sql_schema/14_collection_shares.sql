-- Création de la table collection_shares pour stocker les données de partage
CREATE TABLE public.collection_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token VARCHAR(20) NOT NULL UNIQUE,
  collection_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Indexation du token de partage pour des recherches rapides
  CONSTRAINT valid_share_token CHECK (char_length(share_token) > 0)
);

-- Commentaires pour la documentation
COMMENT ON TABLE public.collection_shares IS 'Stocke les données de partage de collections de rasoirs';
COMMENT ON COLUMN public.collection_shares.id IS 'Identifiant unique du partage';
COMMENT ON COLUMN public.collection_shares.user_id IS 'ID de l''utilisateur qui a créé le partage';
COMMENT ON COLUMN public.collection_shares.share_token IS 'Token unique pour accéder au partage';
COMMENT ON COLUMN public.collection_shares.collection_data IS 'Données de la collection partagée au format JSON';
COMMENT ON COLUMN public.collection_shares.created_at IS 'Date de création du partage';
COMMENT ON COLUMN public.collection_shares.expires_at IS 'Date d''expiration du partage';

-- Créer un index sur le token pour des recherches rapides
CREATE INDEX idx_collection_shares_token ON public.collection_shares(share_token);

-- Politique RLS pour limiter la lecture/écriture
ALTER TABLE public.collection_shares ENABLE ROW LEVEL SECURITY;

-- Politique: tout le monde peut lire les partages (ils sont publics par conception)
CREATE POLICY "Les partages sont accessibles publiquement" 
  ON public.collection_shares
  FOR SELECT
  USING (true);

-- Politique: seul le propriétaire peut modifier/supprimer ses partages
CREATE POLICY "Les utilisateurs peuvent gérer leurs propres partages" 
  ON public.collection_shares
  FOR ALL 
  USING (auth.uid() = user_id);
