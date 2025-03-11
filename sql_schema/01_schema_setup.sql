-- Script SQL pour la mise en place initiale du schéma Relife Razor
-- Extrait et consolidé des migrations existantes

-- Activer l'extension uuid-ossp pour la génération des UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Configuration des schémas
COMMENT ON SCHEMA public IS 'Schéma principal pour l''application Relife Razor';

-- Supprimer la fonction existante avant de la recréer
DROP FUNCTION IF EXISTS exec_sql(text);

-- Création de la fonction pour exécuter du SQL dynamique
CREATE OR REPLACE FUNCTION exec_sql(sql_code text)
RETURNS void AS $$
BEGIN
    EXECUTE sql_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Définir la fonction d'audit pour les mises à jour
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
