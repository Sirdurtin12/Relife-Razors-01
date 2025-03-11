-- Migration SQL pour corriger le système de notation de gentleness
-- Cette migration implémente une solution robuste avec triggers
-- Date: 2025-03-05

-- Supprimer complètement la colonne existante pour éviter les problèmes
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Vérifier si la colonne existe
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'razors' AND column_name = 'avg_gentleness'
  ) INTO column_exists;

  -- Supprimer d'abord les dépendances si la colonne existe
  IF column_exists THEN
    -- Supprimer les triggers existants pour éviter les erreurs
    DROP TRIGGER IF EXISTS update_avg_gentleness_on_rating ON user_ratings;
    DROP TRIGGER IF EXISTS update_avg_gentleness_on_review ON razor_reviews;
    DROP FUNCTION IF EXISTS update_razor_avg_gentleness();
    
    -- Supprimer les index existants sur cette colonne
    DROP INDEX IF EXISTS razors_avg_gentleness_idx;
    
    -- Supprimer la colonne existante
    ALTER TABLE razors DROP COLUMN IF EXISTS avg_gentleness;
  END IF;
  
  -- Ajouter la colonne comme colonne normale
  ALTER TABLE razors ADD COLUMN avg_gentleness NUMERIC;
  
  -- Ajouter une colonne pour le nombre de votes
  ALTER TABLE razors ADD COLUMN IF NOT EXISTS gentleness_votes_count INTEGER DEFAULT 0;
  
  -- Ajouter un commentaire à la colonne
  COMMENT ON COLUMN razors.avg_gentleness IS 'Moyenne des évaluations de douceur données par les utilisateurs.';
  COMMENT ON COLUMN razors.gentleness_votes_count IS 'Nombre total de votes utilisés pour calculer la moyenne de douceur.';
END
$$;

-- Créer une nouvelle fonction de trigger améliorée qui gère correctement UPDATE/INSERT/DELETE
CREATE OR REPLACE FUNCTION update_razor_avg_gentleness()
RETURNS TRIGGER AS $$
DECLARE
    razor_id_to_update BIGINT;
BEGIN
    -- Déterminer le razor_id à mettre à jour en fonction de l'opération
    IF TG_OP = 'DELETE' THEN
        razor_id_to_update := OLD.razor_id;
    ELSE
        razor_id_to_update := NEW.razor_id;
    END IF;
    
    -- Mettre à jour avg_gentleness en combinant les évaluations des deux tables
    UPDATE razors r
    SET avg_gentleness = (
        SELECT ROUND(AVG(gentleness_rating)::numeric, 1)
        FROM (
            SELECT gentleness_rating FROM user_ratings ur WHERE ur.razor_id = r.id
            UNION ALL
            SELECT gentleness_rating FROM razor_reviews rr WHERE rr.razor_id = r.id
        ) combined_ratings
    ),
    gentleness_votes_count = (
        SELECT COUNT(*)
        FROM (
            SELECT gentleness_rating FROM user_ratings ur WHERE ur.razor_id = r.id
            UNION ALL
            SELECT gentleness_rating FROM razor_reviews rr WHERE rr.razor_id = r.id
        ) combined_ratings
    )
    WHERE r.id = razor_id_to_update;
    
    -- Si aucune évaluation n'existe, utiliser gentleness comme valeur par défaut
    UPDATE razors r
    SET avg_gentleness = r.gentleness,
        gentleness_votes_count = 0
    WHERE r.id = razor_id_to_update
    AND NOT EXISTS (
        SELECT 1 FROM user_ratings ur WHERE ur.razor_id = r.id
        UNION ALL
        SELECT 1 FROM razor_reviews rr WHERE rr.razor_id = r.id
    );
    
    -- Retourner la ligne appropriée selon l'opération
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Créer un trigger pour la table user_ratings
CREATE TRIGGER update_avg_gentleness_on_rating
AFTER INSERT OR UPDATE OR DELETE ON user_ratings
FOR EACH ROW
EXECUTE FUNCTION update_razor_avg_gentleness();

-- Également créer un trigger pour la table razor_reviews
CREATE OR REPLACE FUNCTION update_razor_avg_gentleness_from_reviews()
RETURNS TRIGGER AS $$
DECLARE
    razor_id_to_update BIGINT;
BEGIN
    -- Déterminer le razor_id à mettre à jour en fonction de l'opération
    IF TG_OP = 'DELETE' THEN
        razor_id_to_update := OLD.razor_id;
    ELSE
        razor_id_to_update := NEW.razor_id;
    END IF;
    
    -- Mettre à jour avg_gentleness en combinant les évaluations des deux tables
    UPDATE razors r
    SET avg_gentleness = (
        SELECT ROUND(AVG(gentleness_rating)::numeric, 1)
        FROM (
            SELECT gentleness_rating FROM user_ratings ur WHERE ur.razor_id = r.id
            UNION ALL
            SELECT gentleness_rating FROM razor_reviews rr WHERE rr.razor_id = r.id
        ) combined_ratings
    ),
    gentleness_votes_count = (
        SELECT COUNT(*)
        FROM (
            SELECT gentleness_rating FROM user_ratings ur WHERE ur.razor_id = r.id
            UNION ALL
            SELECT gentleness_rating FROM razor_reviews rr WHERE rr.razor_id = r.id
        ) combined_ratings
    )
    WHERE r.id = razor_id_to_update;
    
    -- Si aucune évaluation n'existe, utiliser gentleness comme valeur par défaut
    UPDATE razors r
    SET avg_gentleness = r.gentleness,
        gentleness_votes_count = 0
    WHERE r.id = razor_id_to_update
    AND NOT EXISTS (
        SELECT 1 FROM user_ratings ur WHERE ur.razor_id = r.id
        UNION ALL
        SELECT 1 FROM razor_reviews rr WHERE rr.razor_id = r.id
    );
    
    -- Retourner la ligne appropriée selon l'opération
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur razor_reviews
CREATE TRIGGER update_avg_gentleness_on_review
AFTER INSERT OR UPDATE OR DELETE ON razor_reviews
FOR EACH ROW
EXECUTE FUNCTION update_razor_avg_gentleness_from_reviews();

-- Mettre à jour toutes les moyennes de gentleness pour s'assurer que tout est à jour
DO $$
BEGIN
    -- Mettre à jour tous les rasoirs en prenant en compte les deux tables
    UPDATE razors r
    SET avg_gentleness = (
        SELECT ROUND(AVG(gentleness_rating)::numeric, 1)
        FROM (
            SELECT gentleness_rating FROM user_ratings ur WHERE ur.razor_id = r.id
            UNION ALL
            SELECT gentleness_rating FROM razor_reviews rr WHERE rr.razor_id = r.id
        ) combined_ratings
    ),
    gentleness_votes_count = (
        SELECT COUNT(*)
        FROM (
            SELECT gentleness_rating FROM user_ratings ur WHERE ur.razor_id = r.id
            UNION ALL
            SELECT gentleness_rating FROM razor_reviews rr WHERE rr.razor_id = r.id
        ) combined_ratings
    )
    WHERE EXISTS (
        SELECT 1 FROM user_ratings ur WHERE ur.razor_id = r.id
        UNION ALL
        SELECT 1 FROM razor_reviews rr WHERE rr.razor_id = r.id
    );
    
    -- Mettre à jour tous les rasoirs sans évaluations
    UPDATE razors r
    SET avg_gentleness = r.gentleness,
        gentleness_votes_count = 0
    WHERE NOT EXISTS (
        SELECT 1 FROM user_ratings ur WHERE ur.razor_id = r.id
        UNION ALL
        SELECT 1 FROM razor_reviews rr WHERE rr.razor_id = r.id
    );
END
$$;

-- Vérifier si un index existe pour avg_gentleness et en créer un sinon
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE tablename = 'razors' AND indexname = 'razors_avg_gentleness_idx'
  ) THEN
    CREATE INDEX razors_avg_gentleness_idx ON razors(avg_gentleness);
  END IF;
END
$$;
