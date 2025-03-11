-- Définition de la table pour stocker les partages de collections
CREATE TABLE collection_shares (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  collection_data JSONB NOT NULL,
  
  -- Contraintes
  CONSTRAINT collection_shares_share_token_key UNIQUE (share_token)
);

-- Index pour accélérer les recherches par token
CREATE INDEX collection_shares_token_idx ON collection_shares(share_token);

-- Index pour filtrer par utilisateur
CREATE INDEX collection_shares_user_id_idx ON collection_shares(user_id);

-- Politique RLS pour permettre l'accès en lecture
CREATE POLICY "Public read access to shared collections" 
  ON collection_shares 
  FOR SELECT 
  USING (true);

-- Politique RLS pour restreindre l'accès en écriture
CREATE POLICY "Users can create their own shares" 
  ON collection_shares 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Politique RLS pour permettre aux utilisateurs de supprimer leurs propres partages
CREATE POLICY "Users can delete their own shares" 
  ON collection_shares 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);
