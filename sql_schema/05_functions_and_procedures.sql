-- Script SQL pour les fonctions et procédures stockées
-- Extrait et consolidé des migrations existantes

-- Fonction pour récupérer les évaluations avec les informations de profil
CREATE OR REPLACE FUNCTION get_ratings_with_profiles(razor_id_param BIGINT)
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
        r.razor_id = razor_id_param;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- Fonction pour obtenir les statistiques d'un rasoir
CREATE OR REPLACE FUNCTION get_razor_stats(razor_id_param BIGINT)
RETURNS TABLE (
    rating_count BIGINT,
    avg_gentleness NUMERIC,
    collection_count BIGINT,
    favorite_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT ur.id) AS rating_count,
        COALESCE(AVG(ur.gentleness_rating), 0) AS avg_gentleness,
        COUNT(DISTINCT uc.id) AS collection_count,
        COUNT(DISTINCT CASE WHEN uc.is_favorite THEN uc.id END) AS favorite_count
    FROM 
        razors r
    LEFT JOIN 
        user_ratings ur ON r.id = ur.razor_id
    LEFT JOIN 
        user_collections uc ON r.id = uc.razor_id
    WHERE 
        r.id = razor_id_param
    GROUP BY 
        r.id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- Fonction pour supprimer un rasoir (pour les administrateurs)
CREATE OR REPLACE FUNCTION admin_delete_razor(razor_id_param BIGINT)
RETURNS VOID AS $$
BEGIN
    -- Vérifier si l'utilisateur est administrateur
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
        RAISE EXCEPTION 'Accès refusé: vous devez être administrateur pour supprimer des rasoirs';
    END IF;
    
    -- Supprimer le rasoir et toutes les données associées
    DELETE FROM razors WHERE id = razor_id_param;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- Fonction pour obtenir les variantes d'un rasoir pour un utilisateur
CREATE OR REPLACE FUNCTION get_user_razor_variants(razor_id_param BIGINT, user_id_param UUID)
RETURNS TABLE (
    id UUID,
    parent_razor_id BIGINT,
    selected_material TEXT,
    selected_finish TEXT,
    selected_comb_type TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rv.id,
        rv.parent_razor_id,
        rv.selected_material,
        rv.selected_finish,
        rv.selected_comb_type,
        rv.notes,
        rv.created_at,
        rv.updated_at
    FROM 
        razor_variants rv
    WHERE 
        rv.parent_razor_id = razor_id_param
        AND rv.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- Fonction pour rechercher des rasoirs par critères
CREATE OR REPLACE FUNCTION search_razors(
    manufacturer_param TEXT DEFAULT NULL,
    model_param TEXT DEFAULT NULL,
    blade_type_param TEXT DEFAULT NULL,
    min_gentleness INTEGER DEFAULT NULL,
    max_gentleness INTEGER DEFAULT NULL,
    material_param TEXT DEFAULT NULL,
    comb_type_param TEXT DEFAULT NULL
)
RETURNS TABLE (
    id BIGINT,
    manufacturer TEXT,
    model TEXT,
    reference TEXT,
    blade_type TEXT,
    image_url TEXT,
    gentleness INTEGER,
    weight_grams NUMERIC,
    avg_user_gentleness NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.manufacturer,
        r.model,
        r.reference,
        r.blade_type,
        r.image_url,
        r.gentleness,
        r.weight_grams,
        COALESCE(AVG(ur.gentleness_rating), 0) AS avg_user_gentleness
    FROM 
        razors r
    LEFT JOIN 
        user_ratings ur ON r.id = ur.razor_id
    WHERE 
        (manufacturer_param IS NULL OR r.manufacturer ILIKE '%' || manufacturer_param || '%')
        AND (model_param IS NULL OR r.model ILIKE '%' || model_param || '%')
        AND (blade_type_param IS NULL OR r.blade_type = blade_type_param)
        AND (min_gentleness IS NULL OR r.gentleness >= min_gentleness)
        AND (max_gentleness IS NULL OR r.gentleness <= max_gentleness)
        AND (material_param IS NULL OR 
             r.base_material ILIKE '%' || material_param || '%' OR 
             r.material_variant ILIKE '%' || material_param || '%')
        AND (comb_type_param IS NULL OR r.comb_type ILIKE '%' || comb_type_param || '%')
        AND (NOT r.is_private OR r.created_by = auth.uid())
    GROUP BY 
        r.id
    ORDER BY 
        r.manufacturer, r.model;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;
