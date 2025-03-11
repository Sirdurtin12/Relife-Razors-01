-- Script de correction pour l'ambiguïté entre les fonctions get_ratings_with_profiles
-- Ce script ajoute une surcharge de fonction qui accepte un UUID et le convertit en BIGINT

-- Option 1: Supprimer directement la fonction (à utiliser si la fonction existe déjà)
-- DROP FUNCTION IF EXISTS get_ratings_with_profiles(uuid);

-- Option 2: Tenter de supprimer la fonction avec un bloc DO-CATCH (à utiliser si on n'est pas sûr que la fonction existe)
DO $$
BEGIN
    -- Tenter de supprimer la fonction si elle existe
    EXECUTE 'DROP FUNCTION IF EXISTS get_ratings_with_profiles(uuid)';
EXCEPTION
    WHEN undefined_function THEN
        -- La fonction n'existe pas, ignorer l'erreur
        RAISE NOTICE 'Function get_ratings_with_profiles(uuid) does not exist, skipping drop';
END
$$;

-- Fonction pour récupérer les évaluations avec les informations de profil - Version UUID
-- Cette version permet d'appeler la fonction avec un ID de type UUID
CREATE OR REPLACE FUNCTION get_ratings_with_profiles(razor_id_param UUID)
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
BEGIN
    -- Cette fonction convertit l'UUID en BIGINT pour être utilisée avec la table user_ratings
    -- qui attend un razor_id de type BIGINT
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
        r.razor_id = CAST(CAST(razor_id_param AS TEXT) AS BIGINT);
        
    -- Note: Cette fonction suppose que l'UUID peut être converti en BIGINT
    -- Ce qui est généralement le cas pour les IDs numériques convertis en UUID dans l'URL
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- Commentaire sur les fonctions
COMMENT ON FUNCTION get_ratings_with_profiles(BIGINT) IS 'Récupère les évaluations avec les profils utilisateurs pour un rasoir donné par son ID numérique';
COMMENT ON FUNCTION get_ratings_with_profiles(UUID) IS 'Surcharge de la fonction get_ratings_with_profiles pour compatibilité avec les paramètres UUID, convertit l''UUID en BIGINT';
