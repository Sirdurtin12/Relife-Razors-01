import { createClient } from '@supabase/supabase-js';

// Ces valeurs proviennent des variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Vérification des valeurs
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined');
}

// Création du client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types simplifiés pour éviter les erreurs de typage
export type Razor = any;
export type RazorInsert = any;
export type RazorUpdate = any;

// Version simplifié pour éviter les erreurs de build
export type RazorExtended = {
  id?: number;
  name?: string;
  brand?: string;
  model?: string;
  gentleness_rating?: number;
  aggression_level?: string;
  head_type?: string;
  handle_material?: string;
  price_range?: string;
  image_url?: string;
  description?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  material_variant?: string | null;
  available_finish?: string | null;
  comb_type?: string | null;
  is_private?: boolean | null;
  release_year?: number | null;
  in_collection?: boolean | null;
  favorite_rating?: number | null;
}

export type Profile = any;
export type RazorVariant = any;
export type UserRating = any;
export type UserCollection = any;
