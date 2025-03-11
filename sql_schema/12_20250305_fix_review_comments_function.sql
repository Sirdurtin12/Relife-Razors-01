-- Correction de la fonction get_review_comments pour réparer la jointure entre review_comments et profiles

-- Supprimer d'abord la fonction existante
DROP FUNCTION IF EXISTS get_review_comments(bigint, uuid);

-- Recréer la fonction avec la correction
CREATE OR REPLACE FUNCTION get_review_comments(
  review_id_param BIGINT,
  current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  review_id BIGINT,
  user_id UUID,
  parent_comment_id BIGINT,
  comment_content TEXT,
  content TEXT, -- Ajout d'un alias 'content' pour la rétrocompatibilité avec le frontend
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_review_author BOOLEAN
) AS $$
BEGIN
  -- Log pour le débogage
  RAISE NOTICE 'Executing get_review_comments with review_id_param: %', review_id_param;
  
  RETURN QUERY
  SELECT
    c.id,
    c.review_id,
    c.user_id,
    c.parent_comment_id,
    c.comment_content,
    c.comment_content AS content, -- Duplication sous le nom 'content' pour la rétrocompatibilité
    c.created_at,
    c.updated_at,
    p.username,
    p.full_name,
    p.avatar_url,
    c.user_id = (SELECT rr.user_id FROM razor_reviews rr WHERE rr.id = c.review_id) AS is_review_author
  FROM
    review_comments c
  LEFT JOIN
    profiles p ON c.user_id = p.id  -- Correction: Dans Supabase, p.id est l'UUID de l'utilisateur
  WHERE
    c.review_id = review_id_param
  ORDER BY
    COALESCE(c.parent_comment_id, c.id),
    c.created_at;
END;
$$ LANGUAGE plpgsql;

-- Fonction utilitaire pour vérifier la structure de la table profiles
-- Utile pour déboguer les jointures problématiques
CREATE OR REPLACE FUNCTION debug_profiles_schema()
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    columns.column_name::TEXT,
    columns.data_type::TEXT
  FROM 
    information_schema.columns
  WHERE 
    table_name = 'profiles'
  ORDER BY 
    ordinal_position;
END;
$$ LANGUAGE plpgsql;
