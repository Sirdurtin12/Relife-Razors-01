-- Script SQL pour les déclencheurs et automatisations
-- Extrait et consolidé des migrations existantes

-- Déclencheur pour créer automatiquement un profil utilisateur lors de l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'preferred_username', 'user_' || SUBSTR(NEW.id::text, 1, 8)), 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), 
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le déclencheur existant s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Déclencheur qui s'exécute après l'ajout d'un nouvel utilisateur
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Déclencheur pour mettre à jour les statistiques des rasoirs
CREATE OR REPLACE FUNCTION update_razor_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour la note moyenne de douceur dans razors
    WITH avg_ratings AS (
        SELECT 
            razor_id,
            AVG(gentleness_rating) AS avg_gentleness
        FROM 
            user_ratings
        GROUP BY 
            razor_id
    )
    UPDATE razors r
    SET 
        gentleness = CEIL(ar.avg_gentleness)
    FROM 
        avg_ratings ar
    WHERE 
        r.id = ar.razor_id
        AND r.id = NEW.razor_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le déclencheur existant s'il existe
DROP TRIGGER IF EXISTS on_rating_changed ON user_ratings;

-- Déclencheur qui s'exécute après l'ajout ou la mise à jour d'une évaluation
CREATE TRIGGER on_rating_changed
AFTER INSERT OR UPDATE ON user_ratings
FOR EACH ROW
EXECUTE FUNCTION update_razor_stats();

-- Déclencheur pour maintenir la cohérence des collections et variantes
CREATE OR REPLACE FUNCTION sync_collections_and_variants()
RETURNS TRIGGER AS $$
BEGIN
    -- Si une nouvelle variante est ajoutée, assurez-vous qu'elle est dans la collection
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO user_collections (
            user_id, 
            razor_id, 
            in_collection, 
            is_variant,
            variant_material,
            variant_finish,
            variant_comb_type,
            variant_notes
        )
        VALUES (
            NEW.user_id,
            NEW.parent_razor_id,
            TRUE,
            TRUE,
            NEW.selected_material,
            NEW.selected_finish,
            NEW.selected_comb_type,
            NEW.notes
        )
        ON CONFLICT (user_id, razor_id, variant_material, variant_finish, variant_comb_type) 
        DO UPDATE SET
            in_collection = TRUE,
            is_variant = TRUE,
            variant_notes = NEW.notes;
    
    -- Si une variante est mise à jour, mettre à jour la collection
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE user_collections
        SET 
            variant_material = NEW.selected_material,
            variant_finish = NEW.selected_finish,
            variant_comb_type = NEW.selected_comb_type,
            variant_notes = NEW.notes
        WHERE 
            user_id = NEW.user_id
            AND razor_id = NEW.parent_razor_id
            AND is_variant = TRUE
            AND variant_material = OLD.selected_material
            AND variant_finish = OLD.selected_finish
            AND variant_comb_type = OLD.selected_comb_type;
    
    -- Si une variante est supprimée, supprimer de la collection si c'est une variante
    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM user_collections
        WHERE 
            user_id = OLD.user_id
            AND razor_id = OLD.parent_razor_id
            AND is_variant = TRUE
            AND variant_material = OLD.selected_material
            AND variant_finish = OLD.selected_finish
            AND variant_comb_type = OLD.selected_comb_type;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le déclencheur existant s'il existe
DROP TRIGGER IF EXISTS on_variant_changed ON razor_variants;

-- Déclencheurs pour la synchronisation des collections et variantes
CREATE TRIGGER on_variant_changed
AFTER INSERT OR UPDATE OR DELETE ON razor_variants
FOR EACH ROW
EXECUTE FUNCTION sync_collections_and_variants();
