-- Correction de l'erreur "column must appear in the GROUP BY clause or be used in an aggregate function"
-- Date: 2025-03-04

-- Supprimer la fonction existante
DROP FUNCTION IF EXISTS get_review_comments(BIGINT, UUID);

-- Recréer la fonction sans utiliser json_agg qui cause le problème de GROUP BY
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
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_review_author BOOLEAN
) AS $$
BEGIN
  -- Journalisation pour le débogage
  RAISE LOG 'get_review_comments appelé avec review_id=%, current_user_id=%', 
    review_id_param, 
    COALESCE(current_user_id::TEXT, 'NULL');
    
  RETURN QUERY
  SELECT
    c.id,
    c.review_id,
    c.user_id,
    c.parent_comment_id,
    c.comment_content,
    c.created_at,
    c.updated_at,
    p.username,
    p.full_name,
    p.avatar_url,
    (c.user_id = (SELECT rr.user_id FROM razor_reviews rr WHERE rr.id = c.review_id)) AS is_review_author
  FROM
    review_comments c
  LEFT JOIN
    profiles p ON c.user_id = p.id
  WHERE
    c.review_id = review_id_param
  ORDER BY
    CASE WHEN c.parent_comment_id IS NULL THEN 0 ELSE 1 END,
    COALESCE(c.parent_comment_id, c.id),
    c.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder des autorisations sur la fonction
GRANT EXECUTE ON FUNCTION get_review_comments(BIGINT, UUID) TO public;
GRANT EXECUTE ON FUNCTION get_review_comments(BIGINT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_review_comments(BIGINT, UUID) TO anon;

COMMENT ON FUNCTION get_review_comments(BIGINT, UUID) IS 'Récupère les commentaires pour une critique donnée, corrigée pour éviter l''erreur de GROUP BY';
