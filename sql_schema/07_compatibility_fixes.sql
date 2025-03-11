-- Script SQL pour assurer la compatibilité avec le code existant
-- Créé pour résoudre les problèmes liés aux noms de colonnes entre le code client et la base de données

-- Note: La manipulation de la colonne avg_gentleness est désormais gérée par le script 15_fix_gentleness_trigger.sql
-- Ce script ne s'occupe que de la colonne gentleness

-- Modification de la colonne gentleness pour la rendre optionnelle avec une valeur par défaut
DO $$
BEGIN
  -- Modifier la contrainte NOT NULL sur la colonne gentleness
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'razors' 
    AND column_name = 'gentleness' 
    AND is_nullable = 'NO'
  ) THEN
    -- Supprimer la contrainte NOT NULL
    ALTER TABLE razors ALTER COLUMN gentleness DROP NOT NULL;
    
    -- Mettre à jour les valeurs NULL existantes (le cas échéant)
    UPDATE razors SET gentleness = 10 WHERE gentleness IS NULL;
    
    -- Vérifier que la valeur par défaut est bien 10
    IF (SELECT column_default FROM information_schema.columns 
        WHERE table_name = 'razors' AND column_name = 'gentleness') IS NULL THEN
      ALTER TABLE razors ALTER COLUMN gentleness SET DEFAULT 10;
    END IF;
    
    -- Ajouter un commentaire expliquant la nouvelle fonction de cette colonne
    COMMENT ON COLUMN razors.gentleness IS 'Valeur par défaut pour les nouveaux rasoirs sans évaluation. Utilisé comme valeur de secours lorsque les évaluations utilisateurs sont absentes.';
  END IF;
END
$$;
