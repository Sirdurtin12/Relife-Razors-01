-- Script pour ajouter les fonctions de statistiques des utilisateurs
-- Date: 2025-04-10
-- Description: Crée la fonction get_user_stats et met à jour get_review_comments

-- Create a function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(
  user_id_param UUID
)
RETURNS TABLE (
  razors_created INTEGER,
  comments_posted INTEGER,
  reviews_posted INTEGER,
  likes_received INTEGER,
  owned_razors INTEGER,
  wishlisted_razors INTEGER,
  favorite_razors INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Nombre de rasoirs créés
    (SELECT COUNT(*) FROM razors WHERE created_by = user_id_param)::INTEGER AS razors_created,
    -- Nombre de commentaires postés
    (SELECT COUNT(*) FROM review_comments WHERE user_id = user_id_param)::INTEGER AS comments_posted,
    -- Nombre d'avis postés
    (SELECT COUNT(*) FROM razor_reviews WHERE user_id = user_id_param)::INTEGER AS reviews_posted,
    -- Nombre de likes reçus sur les avis
    (SELECT COUNT(*) FROM review_likes l JOIN razor_reviews r ON l.review_id = r.id WHERE r.user_id = user_id_param)::INTEGER AS likes_received,
    -- Nombre de rasoirs possédés
    (SELECT COUNT(*) FROM user_collections WHERE user_id = user_id_param AND in_collection = true)::INTEGER AS owned_razors,
    -- Nombre de rasoirs en wishlist
    (SELECT COUNT(*) FROM user_collections WHERE user_id = user_id_param AND in_wishlist = true)::INTEGER AS wishlisted_razors,
    -- Nombre de rasoirs favoris
    (SELECT COUNT(*) FROM user_collections WHERE user_id = user_id_param AND is_favorite = true)::INTEGER AS favorite_razors;
END;
$$ LANGUAGE plpgsql;

-- Update get_review_comments to include user stats for star rating calculation
DROP FUNCTION IF EXISTS get_review_comments(BIGINT, UUID);

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
  is_review_author BOOLEAN,
  razors_created INTEGER,
  comments_posted INTEGER,
  reviews_posted INTEGER,
  likes_received INTEGER,
  owned_razors INTEGER,
  wishlisted_razors INTEGER,
  favorite_razors INTEGER
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
    c.user_id = (SELECT r.user_id FROM razor_reviews r WHERE r.id = c.review_id) AS is_review_author,
    stats.razors_created,
    stats.comments_posted,
    stats.reviews_posted,
    stats.likes_received,
    stats.owned_razors,
    stats.wishlisted_razors,
    stats.favorite_razors
  FROM
    review_comments c
  LEFT JOIN
    profiles p ON c.user_id = p.id
  LEFT JOIN LATERAL
    get_user_stats(c.user_id) stats ON true
  WHERE
    c.review_id = review_id_param
  ORDER BY
    COALESCE(c.parent_comment_id, c.id),
    c.created_at;
END;
$$ LANGUAGE plpgsql;

-- Grant access to the new function
GRANT EXECUTE ON FUNCTION get_user_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_user_stats(UUID) TO service_role;

-- Update get_reviews_with_profiles_and_likes to include user stats for star rating calculation
DROP FUNCTION IF EXISTS get_reviews_with_profiles_and_likes(BIGINT, UUID);

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
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  likes_count BIGINT,
  comments_count BIGINT,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  user_has_liked BOOLEAN,
  razors_created INTEGER,
  comments_posted INTEGER,
  reviews_posted INTEGER,
  likes_received INTEGER,
  owned_razors INTEGER,
  wishlisted_razors INTEGER,
  favorite_razors INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.user_id,
    r.razor_id,
    r.gentleness_rating,
    r.review_content,
    r.created_at,
    r.updated_at,
    COUNT(DISTINCT l.id)::BIGINT AS likes_count,
    COUNT(DISTINCT c.id)::BIGINT AS comments_count,
    p.username,
    p.full_name,
    p.avatar_url,
    CASE 
      WHEN current_user_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM review_likes ul 
        WHERE ul.review_id = r.id AND ul.user_id = current_user_id
      )
    END AS user_has_liked,
    stats.razors_created,
    stats.comments_posted,
    stats.reviews_posted,
    stats.likes_received,
    stats.owned_razors,
    stats.wishlisted_razors,
    stats.favorite_razors
  FROM
    razor_reviews r
  LEFT JOIN
    profiles p ON r.user_id = p.id
  LEFT JOIN
    review_likes l ON r.id = l.review_id
  LEFT JOIN
    review_comments c ON r.id = c.review_id
  LEFT JOIN LATERAL
    get_user_stats(r.user_id) stats ON true
  WHERE
    r.razor_id = razor_id_param
  GROUP BY
    r.id, p.username, p.full_name, p.avatar_url, stats.razors_created, stats.comments_posted, 
    stats.reviews_posted, stats.likes_received, stats.owned_razors, stats.wishlisted_razors, stats.favorite_razors;
END;
$$ LANGUAGE plpgsql;

-- Grant access to updated functions
GRANT EXECUTE ON FUNCTION get_reviews_with_profiles_and_likes(BIGINT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_reviews_with_profiles_and_likes(BIGINT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_reviews_with_profiles_and_likes(BIGINT, UUID) TO service_role;
