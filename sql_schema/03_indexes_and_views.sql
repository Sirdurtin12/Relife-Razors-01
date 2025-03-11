-- Script SQL pour la création des index et vues
-- Extrait et consolidé des migrations existantes

-- Index pour la table razors
CREATE INDEX IF NOT EXISTS idx_razors_manufacturer ON razors(manufacturer);
CREATE INDEX IF NOT EXISTS idx_razors_model ON razors(model);
CREATE INDEX IF NOT EXISTS idx_razors_blade_type ON razors(blade_type);
CREATE INDEX IF NOT EXISTS idx_razors_gentleness ON razors(gentleness);
CREATE INDEX IF NOT EXISTS idx_razors_created_by ON razors(created_by);
CREATE INDEX IF NOT EXISTS idx_razors_is_private ON razors(is_private);
CREATE INDEX IF NOT EXISTS idx_razors_weight ON razors(weight_grams);
CREATE INDEX IF NOT EXISTS idx_razors_gap ON razors(gap_mm);
CREATE INDEX IF NOT EXISTS idx_razors_blade_exposure ON razors(blade_exposure_mm);
CREATE INDEX IF NOT EXISTS idx_razors_price_range ON razors(price_range);
CREATE INDEX IF NOT EXISTS idx_razors_material ON razors(base_material);
CREATE INDEX IF NOT EXISTS idx_razors_comb_type ON razors(comb_type);
CREATE INDEX IF NOT EXISTS idx_razors_release_year ON razors(release_year);

-- Index pour la table razor_variants
CREATE INDEX IF NOT EXISTS idx_razor_variants_parent_razor_id ON razor_variants(parent_razor_id);
CREATE INDEX IF NOT EXISTS idx_razor_variants_user_id ON razor_variants(user_id);

-- Index pour la table user_ratings
CREATE INDEX IF NOT EXISTS idx_user_ratings_razor_id ON user_ratings(razor_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_user_id ON user_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_gentleness ON user_ratings(gentleness_rating);

-- Index pour la table user_collections
CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON user_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_razor_id ON user_collections(razor_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_in_collection ON user_collections(in_collection);
CREATE INDEX IF NOT EXISTS idx_user_collections_in_wishlist ON user_collections(in_wishlist);
CREATE INDEX IF NOT EXISTS idx_user_collections_is_favorite ON user_collections(is_favorite);
CREATE INDEX IF NOT EXISTS idx_user_collections_is_variant ON user_collections(is_variant);

-- Index pour la table profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Vue pour joindre les évaluations et les profils
CREATE OR REPLACE VIEW ratings_with_profiles AS
SELECT 
    r.*,
    p.username,
    p.full_name,
    p.avatar_url
FROM 
    user_ratings r
LEFT JOIN 
    profiles p ON r.user_id = p.id;

-- Vue pour les rasoirs avec alias de gentleness pour compatibilité avec le code existant
CREATE OR REPLACE VIEW razors_with_avg_gentleness AS
SELECT 
  r.*,
  r.gentleness AS avg_gentleness
FROM 
  razors r;

-- Vue pour les statistiques de rasoirs
CREATE OR REPLACE VIEW razor_stats AS
SELECT 
    r.id,
    r.manufacturer,
    r.model,
    r.reference,
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
GROUP BY 
    r.id;
