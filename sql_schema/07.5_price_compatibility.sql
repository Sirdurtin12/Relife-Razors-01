-- Script pour assurer la compatibilité entre price et price_range
-- Cette transition permet de maintenir la compatibilité avec le code existant 
-- tout en permettant la migration vers le nouveau champ

-- Créer un trigger pour maintenir la synchronisation entre price et price_range
CREATE OR REPLACE FUNCTION sync_price_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Si le price a été modifié, mettre à jour price_range
    IF NEW.price IS DISTINCT FROM OLD.price THEN
        -- Convertir le prix numérique en fourchette de prix
        IF NEW.price IS NULL THEN
            NEW.price_range := NULL;
        ELSIF NEW.price < 20 THEN
            NEW.price_range := '< 20€';
        ELSIF NEW.price BETWEEN 20 AND 49.99 THEN
            NEW.price_range := '20-50€';
        ELSIF NEW.price BETWEEN 50 AND 99.99 THEN
            NEW.price_range := '50-100€';
        ELSIF NEW.price BETWEEN 100 AND 199.99 THEN
            NEW.price_range := '100-200€';
        ELSE
            NEW.price_range := '> 200€';
        END IF;
    END IF;
    
    -- Si price_range a été modifié manuellement, essayer de mettre à jour price
    -- Ceci est important pour la compatibilité ascendante
    IF NEW.price_range IS DISTINCT FROM OLD.price_range AND 
       (NEW.price IS NULL OR OLD.price IS NULL OR NEW.price = OLD.price) THEN
        CASE NEW.price_range
            WHEN '< 20€' THEN
                NEW.price := 15;
            WHEN '20-50€' THEN
                NEW.price := 35;
            WHEN '50-100€' THEN
                NEW.price := 75;
            WHEN '100-200€' THEN
                NEW.price := 150;
            WHEN '> 200€' THEN
                NEW.price := 250;
            ELSE
                -- Essayer d'extraire une valeur numérique si possible
                BEGIN
                    -- Pour une éventuelle valeur numérique personnalisée
                    NEW.price := (regexp_matches(NEW.price_range, '(\d+)'))[1]::numeric;
                EXCEPTION WHEN OTHERS THEN
                    -- Garder l'ancienne valeur ou NULL
                    NULL;
                END;
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ajouter le trigger sur la table razors
DROP TRIGGER IF EXISTS sync_price_fields_trigger ON razors;
CREATE TRIGGER sync_price_fields_trigger
BEFORE UPDATE ON razors
FOR EACH ROW
EXECUTE FUNCTION sync_price_fields();

-- Ajouter également un trigger pour les insertions
CREATE OR REPLACE FUNCTION init_price_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Si seul price est défini, définir price_range
    IF NEW.price IS NOT NULL AND NEW.price_range IS NULL THEN
        IF NEW.price < 20 THEN
            NEW.price_range := '< 20€';
        ELSIF NEW.price BETWEEN 20 AND 49.99 THEN
            NEW.price_range := '20-50€';
        ELSIF NEW.price BETWEEN 50 AND 99.99 THEN
            NEW.price_range := '50-100€';
        ELSIF NEW.price BETWEEN 100 AND 199.99 THEN
            NEW.price_range := '100-200€';
        ELSE
            NEW.price_range := '> 200€';
        END IF;
    END IF;
    
    -- Si seul price_range est défini, définir price
    IF NEW.price IS NULL AND NEW.price_range IS NOT NULL THEN
        CASE NEW.price_range
            WHEN '< 20€' THEN
                NEW.price := 15;
            WHEN '20-50€' THEN
                NEW.price := 35;
            WHEN '50-100€' THEN
                NEW.price := 75;
            WHEN '100-200€' THEN
                NEW.price := 150;
            WHEN '> 200€' THEN
                NEW.price := 250;
            ELSE
                -- Tenter d'extraire un nombre
                BEGIN
                    NEW.price := (regexp_matches(NEW.price_range, '(\d+)'))[1]::numeric;
                EXCEPTION WHEN OTHERS THEN
                    NULL;
                END;
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ajouter le trigger pour les insertions
DROP TRIGGER IF EXISTS init_price_fields_trigger ON razors;
CREATE TRIGGER init_price_fields_trigger
BEFORE INSERT ON razors
FOR EACH ROW
EXECUTE FUNCTION init_price_fields();
