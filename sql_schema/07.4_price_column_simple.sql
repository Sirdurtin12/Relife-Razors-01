-- Script simple pour ajouter une colonne price à la table razors
-- À exécuter directement dans l'interface SQL de Supabase

-- Ajout de la colonne price
ALTER TABLE public.razors ADD COLUMN IF NOT EXISTS price NUMERIC(10,2);

-- Commentaire sur la colonne
COMMENT ON COLUMN public.razors.price IS 'Prix du rasoir en valeur numérique';

-- Mise à jour des données existantes (conversion approximative)
UPDATE public.razors SET price = 
  CASE price_range
    WHEN '< 20€' THEN 15
    WHEN '20-50€' THEN 35
    WHEN '50-100€' THEN 75
    WHEN '100-200€' THEN 150
    WHEN '> 200€' THEN 250
    ELSE NULL
  END
WHERE price IS NULL AND price_range IS NOT NULL;
