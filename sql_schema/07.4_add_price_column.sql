-- Script pour ajouter une colonne de prix numérique à la table razors
-- Remplace la fourchette de prix (price_range) par un prix précis (price)

-- Ajout de la colonne price
ALTER TABLE razors ADD COLUMN IF NOT EXISTS price NUMERIC(10,2);

-- Commentaire sur la colonne
COMMENT ON COLUMN razors.price IS 'Prix du rasoir en valeur numérique';

-- Créer un trigger ou une fonction pour la migration des données (optionnel)
-- Cette fonction tentera de convertir les fourchettes de prix existantes en valeurs numériques approximatives
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Pour chaque rasoir avec une fourchette de prix mais sans prix numérique
    FOR r IN SELECT id, price_range FROM razors 
             WHERE price_range IS NOT NULL AND price IS NULL
    LOOP
        -- Essayons de convertir les fourchettes de prix typiques en valeurs numériques
        CASE r.price_range
            WHEN '< 20€' THEN
                UPDATE razors SET price = 15 WHERE id = r.id;
            WHEN '20-50€' THEN
                UPDATE razors SET price = 35 WHERE id = r.id;
            WHEN '50-100€' THEN
                UPDATE razors SET price = 75 WHERE id = r.id;
            WHEN '100-200€' THEN
                UPDATE razors SET price = 150 WHERE id = r.id;
            WHEN '> 200€' THEN
                UPDATE razors SET price = 250 WHERE id = r.id;
            ELSE
                -- Essayer d'extraire une valeur numérique si possible
                BEGIN
                    -- Extraction du premier nombre dans la chaîne (approximatif)
                    UPDATE razors 
                    SET price = (regexp_matches(r.price_range, '(\d+)'))[1]::numeric
                    WHERE id = r.id;
                EXCEPTION WHEN OTHERS THEN
                    -- Impossible d'extraire une valeur numérique, on laisse NULL
                    NULL;
                END;
        END CASE;
    END LOOP;
END
$$;

-- Note d'information dans le journal
DO $$
BEGIN
    RAISE NOTICE 'La colonne price a été ajoutée à la table razors.';
    RAISE NOTICE 'Pensez à mettre à jour les rapports ou les requêtes qui utilisent encore price_range.';
END
$$;
