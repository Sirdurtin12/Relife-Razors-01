-- Script pour créer la table des commentaires
-- Date: 2025-03-04
-- Description: Crée la table review_comments et configure les permissions

-- Create a table for review comments
CREATE TABLE IF NOT EXISTS review_comments (
  id BIGSERIAL PRIMARY KEY,
  review_id BIGINT NOT NULL REFERENCES razor_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id BIGINT REFERENCES review_comments(id) ON DELETE CASCADE,
  comment_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenant que la table existe, créer le trigger pour updated_at
CREATE TRIGGER set_review_comments_updated_at
BEFORE UPDATE ON review_comments
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Set up RLS for comments
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

-- Policies for review_comments
-- (On supprime d'abord pour éviter toute erreur "already exists")
DROP POLICY IF EXISTS "Anyone can read comments" ON review_comments;
DROP POLICY IF EXISTS "Users can create their own comments" ON review_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON review_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON review_comments;

-- Crée les politiques
CREATE POLICY "Anyone can read comments" 
ON review_comments FOR SELECT 
USING (TRUE);

CREATE POLICY "Users can create their own comments" 
ON review_comments FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON review_comments FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON review_comments FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Add comment to explain the new table
COMMENT ON TABLE review_comments IS 'Stores comments on razor reviews, supporting nested replies';
