export type CROSTARField = "contexte" | "role" | "objectif" | "style" | "ton" | "audience" | "resultat";

export interface Category {
  id: number;
  name: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: number;
  name: string;
  category_id: number;
}

export interface Tag {
  id: number;
  name: string;
}

export interface PromptSummary {
  id: number;
  title: string;
  description?: string | null;
  modele_cible?: string | null;
  langue?: string | null;
  category?: Category | null;
  subcategory?: Subcategory | null;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface Prompt extends PromptSummary {
  contexte?: string | null;
  role?: string | null;
  objectif?: string | null;
  style?: string | null;
  ton?: string | null;
  audience?: string | null;
  resultat?: string | null;
}

export interface PromptVersion {
  id: number;
  prompt_id: number;
  snapshot: string;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface PromptFilters {
  search?: string;
  category_id?: number;
  subcategory_id?: number;
  tag?: string;
  modele_cible?: string;
  langue?: string;
  sort?: string;
}

export interface PromptFormValues {
  title: string;
  description: string;
  contexte: string;
  role: string;
  objectif: string;
  style: string;
  ton: string;
  audience: string;
  resultat: string;
  category_id?: number;
  subcategory_id?: number;
  tags: string[];
  modele_cible: string;
  langue: string;
}

export interface ImportResponse {
  created: number;
  skipped: number;
}

export interface LibraryExport {
  exported_at: string;
  categories: { name: string }[];
  subcategories: { name: string; category: string | null }[];
  tags: string[];
  prompts: Array<Record<string, unknown>>;
}

export interface ImportPromptPayload {
  title: string;
  description?: string;
  contexte?: string;
  role?: string;
  objectif?: string;
  style?: string;
  ton?: string;
  audience?: string;
  resultat?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  modele_cible?: string;
  langue?: string;
}

export interface ImportPayload {
  prompts: ImportPromptPayload[];
}
