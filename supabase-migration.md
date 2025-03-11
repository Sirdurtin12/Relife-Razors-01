# Migration Supabase pour Relife Razor

## Modifications requises

### Table razors
- Ajouter la colonne `avg_gentleness` (type: float)
- Ajouter la colonne `gentleness_votes_count` (type: integer, default: 0)

### Triggers et fonctions
1. Créer une fonction pour calculer la moyenne de douceur :
```sql
CREATE OR REPLACE FUNCTION calculate_avg_gentleness()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE razors
  SET avg_gentleness = (
    SELECT AVG(gentleness)
    FROM (
      SELECT gentleness FROM user_ratings WHERE razor_id = NEW.razor_id
      UNION ALL
      SELECT gentleness FROM razor_reviews WHERE razor_id = NEW.razor_id AND gentleness IS NOT NULL
    ) as all_ratings
  ),
  gentleness_votes_count = (
    SELECT COUNT(*)
    FROM (
      SELECT gentleness FROM user_ratings WHERE razor_id = NEW.razor_id
      UNION ALL
      SELECT gentleness FROM razor_reviews WHERE razor_id = NEW.razor_id AND gentleness IS NOT NULL
    ) as all_ratings
  )
  WHERE id = NEW.razor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

2. Créer un trigger pour les user_ratings :
```sql
CREATE TRIGGER update_razor_gentleness_from_user_ratings
AFTER INSERT OR UPDATE OR DELETE ON user_ratings
FOR EACH ROW
EXECUTE FUNCTION calculate_avg_gentleness();
```

3. Créer un trigger pour les razor_reviews :
```sql
CREATE TRIGGER update_razor_gentleness_from_reviews
AFTER INSERT OR UPDATE OR DELETE ON razor_reviews
FOR EACH ROW
EXECUTE FUNCTION calculate_avg_gentleness();
```

## Liste de vérification
- [ ] Structure des tables mise à jour
- [ ] Fonction calculate_avg_gentleness créée
- [ ] Trigger pour user_ratings créé
- [ ] Trigger pour razor_reviews créé
- [ ] Données existantes mises à jour avec les valeurs correctes

## Commande SQL pour mise à jour des données existantes
```sql
-- Mettre à jour tous les rasoirs existants avec les valeurs correctes
UPDATE razors r
SET 
  avg_gentleness = subquery.avg_gentleness,
  gentleness_votes_count = subquery.count
FROM (
  SELECT 
    r.id as razor_id,
    AVG(gentleness) as avg_gentleness,
    COUNT(*) as count
  FROM razors r
  LEFT JOIN LATERAL (
    SELECT gentleness FROM user_ratings WHERE razor_id = r.id
    UNION ALL
    SELECT gentleness FROM razor_reviews WHERE razor_id = r.id AND gentleness IS NOT NULL
  ) all_ratings ON true
  GROUP BY r.id
) as subquery
WHERE r.id = subquery.razor_id;
```
