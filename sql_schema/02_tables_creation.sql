-- Script SQL pour la création des tables principales
-- Extrait et consolidé des migrations existantes

-- Table des rasoirs (table principale)
CREATE TABLE IF NOT EXISTS razors (
  id BIGSERIAL PRIMARY KEY,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  reference TEXT,
  blade_type TEXT NOT NULL DEFAULT 'DE',  -- DE, AC, GEM, autres
  image_url TEXT,
  additional_info TEXT,
  gentleness INTEGER NOT NULL DEFAULT 10,  -- Échelle 1-20
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_private BOOLEAN DEFAULT FALSE,
  
  -- Spécifications techniques
  weight_grams NUMERIC(6,2),                -- Poids en grammes
  gap_mm NUMERIC(4,2),                      -- Distance entre lame et peigne
  blade_exposure_mm NUMERIC(4,2),           -- Exposition de la lame en mm
  cutting_angle NUMERIC(4,1),               -- Angle de coupe en degrés
  price_range VARCHAR(50),                  -- Fourchette de prix
  base_material TEXT,                       -- Matériau de base
  material_variant TEXT,                    -- Variantes de matériaux disponibles
  available_finish TEXT,                    -- Finitions disponibles
  comb_type TEXT,                           -- Type de peigne
  release_year INTEGER,                     -- Année de sortie
  
  -- Contrainte d'unicité par utilisateur
  CONSTRAINT unique_razor_per_user UNIQUE (manufacturer, model, reference, created_by)
);

COMMENT ON TABLE razors IS 'Table principale des fiches de rasoirs';

-- Table des variantes de rasoir
CREATE TABLE IF NOT EXISTS razor_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_razor_id BIGINT NOT NULL REFERENCES razors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_material TEXT,
  selected_finish TEXT,
  selected_comb_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte unique pour empêcher les doublons
  UNIQUE(parent_razor_id, user_id, selected_material, selected_finish, selected_comb_type)
);

COMMENT ON TABLE razor_variants IS 'Variantes de rasoir sélectionnées par les utilisateurs pour leur collection';

-- Table des évaluations utilisateur
CREATE TABLE IF NOT EXISTS user_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razor_id BIGINT NOT NULL REFERENCES razors(id) ON DELETE CASCADE,
  gentleness_rating INTEGER NOT NULL CHECK (gentleness_rating BETWEEN 1 AND 20),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un utilisateur ne peut noter qu'une fois un rasoir
  UNIQUE(user_id, razor_id)
);

COMMENT ON TABLE user_ratings IS 'Évaluations des utilisateurs pour les rasoirs avec lien vers les profils utilisateurs';

-- Table des collections utilisateur
CREATE TABLE IF NOT EXISTS user_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razor_id BIGINT NOT NULL REFERENCES razors(id) ON DELETE CASCADE,
  in_collection BOOLEAN DEFAULT TRUE,
  in_wishlist BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  favorite_rating SMALLINT CHECK (favorite_rating BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  variant_material TEXT,
  variant_finish TEXT,
  variant_comb_type TEXT,
  variant_notes TEXT,
  is_variant BOOLEAN DEFAULT FALSE,
  
  -- Un utilisateur ne peut avoir qu'une fois un rasoir dans sa collection
  UNIQUE(user_id, razor_id, variant_material, variant_finish, variant_comb_type)
);

COMMENT ON TABLE user_collections IS 'Collections et listes de souhaits des utilisateurs';

-- Table des profils utilisateur
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE
);

COMMENT ON TABLE profiles IS 'Profils des utilisateurs étendus';

-- Déclencheurs pour la mise à jour automatique des dates
CREATE TRIGGER set_razors_updated_at
BEFORE UPDATE ON razors
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER set_razor_variants_updated_at
BEFORE UPDATE ON razor_variants
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
