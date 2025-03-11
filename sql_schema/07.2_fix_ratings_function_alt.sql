-- Script de correction alternatif pour l'ambiguïté entre les fonctions get_ratings_with_profiles
-- Au lieu de surcharger la fonction, cette version renomme complètement la fonction problématique
-- et fournit une nouvelle fonction avec un nom différent pour le cas UUID

-- Supprimer l'ancienne fonction UUID si elle existe (optionnel)
-- DROP FUNCTION IF EXISTS get_ratings_with_profiles(uuid);

-- Créer une nouvelle fonction avec un nom différent pour le paramètre UUID
CREATE OR REPLACE FUNCTION get_ratings_with_profiles_uuid(razor_id_text TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    razor_id BIGINT,
    gentleness_rating INTEGER,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT
) AS $$
DECLARE
    numeric_id BIGINT;
BEGIN
    -- Tentative de conversion du texte en BIGINT
    BEGIN
        numeric_id := CAST(razor_id_text AS BIGINT);
    EXCEPTION WHEN others THEN
        -- En cas d'échec, renvoyer un ensemble vide
        RAISE WARNING 'Impossible de convertir % en BIGINT', razor_id_text;
        RETURN;
    END;
    
    -- Utiliser le même code que la fonction originale mais avec l'ID converti
    RETURN QUERY
    SELECT 
        r.id,
        r.user_id,
        r.razor_id,
        r.gentleness_rating,
        r.comment,
        r.created_at,
        p.username,
        p.full_name,
        p.avatar_url
    FROM 
        user_ratings r
    LEFT JOIN 
        profiles p ON r.user_id = p.id
    WHERE 
        r.razor_id = numeric_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- Commentaire sur les fonctions
COMMENT ON FUNCTION get_ratings_with_profiles(BIGINT) IS 'Récupère les évaluations avec les profils utilisateurs pour un rasoir donné par son ID numérique';
COMMENT ON FUNCTION get_ratings_with_profiles_uuid(TEXT) IS 'Version alternative qui prend un ID sous forme de texte et le convertit en BIGINT avant de récupérer les évaluations';
