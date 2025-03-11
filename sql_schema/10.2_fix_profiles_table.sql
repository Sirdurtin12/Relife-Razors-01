-- Date: 2025-03-04
-- Script pour ajouter la colonne last_sign_in_at manquante à la table profiles

-- Vérifier si la colonne existe déjà avant de l'ajouter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'last_sign_in_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_sign_in_at TIMESTAMPTZ;
    RAISE NOTICE 'Colonne last_sign_in_at ajoutée à la table profiles';
    
    -- Mettre à jour les profils existants avec la date de création comme valeur par défaut
    UPDATE profiles SET last_sign_in_at = created_at WHERE last_sign_in_at IS NULL;
  ELSE
    RAISE NOTICE 'La colonne last_sign_in_at existe déjà dans la table profiles';
  END IF;
END $$;

-- Vérifier si la colonne created_at existe, sinon l'ajouter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Colonne created_at ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'La colonne created_at existe déjà dans la table profiles';
  END IF;
END $$;
