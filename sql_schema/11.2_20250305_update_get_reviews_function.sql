-- 11.2_20250305_update_get_reviews_function.sql
-- Description: Met à jour la fonction get_reviews_with_profiles_and_likes pour inclure les champs de notation en étoiles

-- Supprimer la fonction existante
DROP FUNCTION IF EXISTS get_reviews_with_profiles_and_likes(BIGINT, UUID);

-- Recréer la fonction avec les nouveaux champs
CREATE OR REPLACE FUNCTION get_reviews_with_profiles_and_likes(
  razor_id_param BIGINT,
  current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  razor_id BIGINT,
  gentleness_rating INTEGER,
  efficiency_gentleness_ratio INTEGER, -- Nouveau champ
  lather_evacuation INTEGER, -- Nouveau champ
  handle_grip INTEGER, -- Nouveau champ
  overall_rating INTEGER, -- Nouveau champ
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
    r.efficiency_gentleness_ratio, -- Nouveau champ
    r.lather_evacuation, -- Nouveau champ
    r.handle_grip, -- Nouveau champ
    r.overall_rating, -- Nouveau champ
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

-- Accorder les droits d'accès à la fonction
GRANT EXECUTE ON FUNCTION get_reviews_with_profiles_and_likes(BIGINT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_reviews_with_profiles_and_likes(BIGINT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_reviews_with_profiles_and_likes(BIGINT, UUID) TO service_role;
