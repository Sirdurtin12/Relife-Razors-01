-- Script pour créer les fonctions liées aux commentaires
-- Date: 2025-03-04
-- Description: Crée la fonction get_review_comments et met à jour get_reviews_with_profiles_and_likes

-- Create a function to get comments with user profiles
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
    COALESCE(c.parent_comment_id, c.id),
    c.created_at;
END;
$$ LANGUAGE plpgsql;

-- Supprimer la fonction existante avant de la recréer avec le nouveau type de retour
DROP FUNCTION IF EXISTS get_reviews_with_profiles_and_likes(BIGINT, UUID);

-- Update the existing reviews function to include comment count
CREATE OR REPLACE FUNCTION get_reviews_with_profiles_and_likes(
  razor_id_param BIGINT,
  current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  razor_id BIGINT,
  gentleness_rating INTEGER,
  review_content TEXT,
  likes_count INTEGER,
  comments_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  user_has_liked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.user_id,
    r.razor_id,
    r.gentleness_rating,
    r.review_content,
    r.likes_count,
    (SELECT COUNT(*) FROM review_comments rc WHERE rc.review_id = r.id)::INTEGER AS comments_count,
    r.created_at,
    r.updated_at,
    p.username,
    p.full_name,
    p.avatar_url,
    CASE
      WHEN current_user_id IS NULL THEN FALSE
      ELSE EXISTS (
        SELECT 1
        FROM review_likes rl
        WHERE rl.review_id = r.id AND rl.user_id = current_user_id
      )
    END AS user_has_liked
  FROM
    razor_reviews r
  LEFT JOIN
    profiles p ON r.user_id = p.id
  WHERE
    r.razor_id = razor_id_param
  ORDER BY
    r.created_at DESC;
END;
$$ LANGUAGE plpgsql;
