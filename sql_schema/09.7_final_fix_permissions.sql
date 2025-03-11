-- Correction finale des permissions - 09.7_final_fix_permissions.sql

-- 1. Recréer la fonction sans obliger le paramètre current_user_id
DROP FUNCTION IF EXISTS get_review_comments(BIGINT, UUID);

-- 2. Recréer la fonction avec une signature simplifiée et une meilleure sécurité
CREATE OR REPLACE FUNCTION get_review_comments(
  review_id_param BIGINT,
  current_user_id UUID DEFAULT NULL
)
RETURNS SETOF JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Ajout de journalisation pour le débogage
  RAISE LOG 'get_review_comments appelé avec review_id=%, current_user_id=%', 
    review_id_param, 
    COALESCE(current_user_id::TEXT, 'NULL');

  SELECT json_agg(
    json_build_object(
      'id', c.id,
      'review_id', c.review_id,
      'user_id', c.user_id,
      'parent_comment_id', c.parent_comment_id,
      'comment_content', c.comment_content,
      'created_at', c.created_at,
      'updated_at', c.updated_at,
      'username', p.username,
      'full_name', p.full_name,
      'avatar_url', p.avatar_url,
      'is_review_author', (c.user_id = (SELECT user_id FROM razor_reviews WHERE id = c.review_id))
    )
  ) INTO result
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

  -- Si aucun commentaire trouvé, retourner un tableau vide
  IF result IS NULL THEN
    RETURN QUERY SELECT '[]'::JSON;
  ELSE
    RETURN QUERY SELECT result;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. S'assurer que les autorisations sont correctement définies
GRANT EXECUTE ON FUNCTION get_review_comments(BIGINT, UUID) TO public;
GRANT EXECUTE ON FUNCTION get_review_comments(BIGINT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_review_comments(BIGINT, UUID) TO anon;

COMMENT ON FUNCTION get_review_comments(BIGINT, UUID) IS 'Récupère les commentaires pour une critique donnée avec SECURITY DEFINER et journalisation';

-- 4. Mettre à jour ReviewComment dans le frontend
-- Mettre à jour le composant ReviewComments.tsx pour s'adapter au nouveau format JSON
