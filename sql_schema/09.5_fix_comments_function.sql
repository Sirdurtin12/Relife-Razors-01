-- Script pour corriger la fonction get_review_comments
-- Date: 2025-03-04
-- Description: Modifie la fonction pour s'assurer que les commentaires sont correctement récupérés

-- Modifie la fonction get_review_comments pour améliorer le tri et la gestion des commentaires
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
  -- Afficher un message de débogage
  RAISE NOTICE 'Récupération des commentaires pour review_id: %', review_id_param;

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
    c.user_id = (SELECT user_id FROM razor_reviews WHERE id = c.review_id) AS is_review_author
  FROM
    review_comments c
  LEFT JOIN
    profiles p ON c.user_id = p.id
  WHERE
    c.review_id = review_id_param
  ORDER BY
    -- Trier d'abord par commentaires parents (parent_comment_id IS NULL) puis par ID croissant
    CASE WHEN c.parent_comment_id IS NULL THEN 0 ELSE 1 END,
    COALESCE(c.parent_comment_id, c.id),
    c.created_at;
END;
$$ LANGUAGE plpgsql;
