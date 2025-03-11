-- Script SQL pour la configuration des politiques de sécurité Row Level Security (RLS)
-- Extrait et consolidé des migrations existantes

-- Activer RLS sur les tables principales
ALTER TABLE razors ENABLE ROW LEVEL SECURITY;
ALTER TABLE razor_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table razors
CREATE POLICY "Anyone can view non-private razors" ON razors
FOR SELECT 
USING (NOT is_private OR auth.uid() = created_by);

CREATE POLICY "Owners and admins can update razors" ON razors 
FOR UPDATE 
USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Creators can insert razors" ON razors 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can delete any razor" ON razors
FOR DELETE 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE) OR auth.uid() = created_by);

-- Politiques pour la table razor_variants
CREATE POLICY "Users can view their own variants" 
ON razor_variants FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own variants" 
ON razor_variants FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own variants" 
ON razor_variants FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own variants" 
ON razor_variants FOR DELETE 
USING (auth.uid() = user_id);

-- Politiques pour la table user_ratings
CREATE POLICY "Anyone can view ratings" 
ON user_ratings FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own ratings" 
ON user_ratings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
ON user_ratings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" 
ON user_ratings FOR DELETE 
USING (auth.uid() = user_id);

-- Politiques pour la table user_collections
CREATE POLICY "Users can view their own collections" 
ON user_collections FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to their own collections" 
ON user_collections FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" 
ON user_collections FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own collections" 
ON user_collections FOR DELETE 
USING (auth.uid() = user_id);

-- Politiques pour la table profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Commentaires sur les politiques
COMMENT ON POLICY "Anyone can view non-private razors" ON razors IS 'Permet à tous de voir les rasoirs non privés, et aux créateurs de voir leurs propres rasoirs privés';
COMMENT ON POLICY "Owners and admins can update razors" ON razors IS 'Permet aux propriétaires et administrateurs de mettre à jour les fiches';
COMMENT ON POLICY "Users can view their own variants" ON razor_variants IS 'Les variantes enregistrées ne sont visibles que par les créateurs de variante dans leur espace de collection';
