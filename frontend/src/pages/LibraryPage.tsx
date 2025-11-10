import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  deletePrompt,
  duplicatePrompt,
  exportLibrary,
  fetchCategories,
  fetchPrompt,
  fetchPrompts,
  fetchTags,
  importLibrary,
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../hooks/useDebounce";
import PromptCard from "../components/PromptCard";
import { formatPromptPreview } from "../utils/promptFormatter";
import { ImportPayload, PromptFilters, PromptSummary } from "../types";

const LibraryPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [filters, setFilters] = useState<PromptFilters>({ sort: "-updated_at" });

  const promptsQuery = useQuery({
    queryKey: ["prompts", filters, debouncedSearch, token],
    queryFn: () =>
      fetchPrompts(token, {
        ...filters,
        search: debouncedSearch || undefined,
      }),
    enabled: Boolean(token),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", token],
    queryFn: () => fetchCategories(token),
    enabled: Boolean(token),
  });

  const tagsQuery = useQuery({
    queryKey: ["tags", token],
    queryFn: () => fetchTags(token),
    enabled: Boolean(token),
  });

  const deleteMutation = useMutation({
    mutationFn: (promptId: number) => deletePrompt(token, promptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success("Prompt supprimé");
    },
    onError: () => toast.error("Impossible de supprimer le prompt"),
  });

  const duplicateMutation = useMutation({
    mutationFn: (promptId: number) => duplicatePrompt(token, promptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success("Prompt dupliqué");
    },
    onError: () => toast.error("Impossible de dupliquer le prompt"),
  });

  const importMutation = useMutation({
    mutationFn: (payload: ImportPayload) => importLibrary(token, payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success(`${result.created} prompts importés (${result.skipped} ignorés)`);
    },
    onError: () => toast.error("Import impossible : vérifiez le fichier"),
  });

  const categories = categoriesQuery.data ?? [];
  const tags = tagsQuery.data ?? [];
  const prompts = promptsQuery.data ?? [];

  const models = useMemo(
    () => Array.from(new Set(prompts.map((prompt) => prompt.modele_cible).filter(Boolean))) as string[],
    [prompts]
  );
  const languages = useMemo(
    () => Array.from(new Set(prompts.map((prompt) => prompt.langue).filter(Boolean))) as string[],
    [prompts]
  );

  const subcategories = useMemo(() => {
    if (!filters.category_id) return [];
    const category = categories.find((item) => item.id === filters.category_id);
    return category?.subcategories ?? [];
  }, [categories, filters.category_id]);

  const handleDelete = (promptId: number) => {
    deleteMutation.mutate(promptId);
  };

  const handleDuplicate = (promptId: number) => {
    duplicateMutation.mutate(promptId);
  };

  const handleCopy = async (prompt: PromptSummary) => {
    try {
      const fullPrompt = await fetchPrompt(token, prompt.id);
      const preview = formatPromptPreview({
        title: fullPrompt.title,
        description: fullPrompt.description ?? "",
        contexte: fullPrompt.contexte ?? "",
        role: fullPrompt.role ?? "",
        objectif: fullPrompt.objectif ?? "",
        style: fullPrompt.style ?? "",
        ton: fullPrompt.ton ?? "",
        audience: fullPrompt.audience ?? "",
        resultat: fullPrompt.resultat ?? "",
        category_id: fullPrompt.category?.id,
        subcategory_id: fullPrompt.subcategory?.id,
        tags: fullPrompt.tags.map((tag) => tag.name),
        modele_cible: fullPrompt.modele_cible ?? "",
        langue: fullPrompt.langue ?? "",
      });
      await navigator.clipboard.writeText(preview);
      toast.success("Prompt copié dans le presse-papier");
    } catch (error) {
      toast.error("Impossible de copier le prompt");
    }
  };

  const handleClearFilters = () => {
    setFilters({ sort: "-updated_at" });
    setSearch("");
  };

  const handleExport = async () => {
    try {
      const data = await exportLibrary(token);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `crostar-prompts-${new Date().toISOString()}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("Export réalisé");
    } catch (error) {
      toast.error("L'export a échoué");
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const content = await file.text();
      const payload = JSON.parse(content) as ImportPayload;
      importMutation.mutate(payload);
    } catch (error) {
      toast.error("Le fichier n'est pas valide");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Bibliothèque de prompts</h2>
          <p className="text-sm text-slate-500">
            Recherchez, filtrez et gérez vos prompts structurés selon la méthode CROSTAR.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            onClick={handleImportClick}
          >
            Importer
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
          />
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-dark"
            onClick={handleExport}
          >
            Exporter
          </button>
        </div>
      </header>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <label className="text-sm text-slate-500 block mb-1" htmlFor="search">
              Recherche plein texte
            </label>
            <input
              id="search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Titre, description, contenu CROSTAR..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              onClick={handleClearFilters}
            >
              Réinitialiser
            </button>
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-dark"
              onClick={() => navigate("/app/prompts/new")}
            >
              Nouveau prompt
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1" htmlFor="category">
              Rubrique
            </label>
            <select
              id="category"
              value={filters.category_id ?? ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  category_id: event.target.value ? Number(event.target.value) : undefined,
                  subcategory_id: undefined,
                }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Toutes</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1" htmlFor="subcategory">
              Sous-rubrique
            </label>
            <select
              id="subcategory"
              value={filters.subcategory_id ?? ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  subcategory_id: event.target.value ? Number(event.target.value) : undefined,
                }))
              }
              disabled={!filters.category_id}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">Toutes</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1" htmlFor="tag">
              Tag
            </label>
            <select
              id="tag"
              value={filters.tag ?? ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  tag: event.target.value || undefined,
                }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Tous</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.name}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1" htmlFor="model">
              Modèle
            </label>
            <select
              id="model"
              value={filters.modele_cible ?? ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  modele_cible: event.target.value || undefined,
                }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Tous</option>
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1" htmlFor="language">
              Langue
            </label>
            <select
              id="language"
              value={filters.langue ?? ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  langue: event.target.value || undefined,
                }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Toutes</option>
              {languages.map((language) => (
                <option key={language} value={language}>
                  {language?.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1" htmlFor="sort">
              Tri
            </label>
            <select
              id="sort"
              value={filters.sort}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  sort: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="-updated_at">Dernière modification</option>
              <option value="-created_at">Date de création</option>
              <option value="title">Titre (A-Z)</option>
              <option value="rubrique">Rubrique</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {promptsQuery.isLoading ? (
          <div className="text-center text-slate-500 py-10">Chargement des prompts...</div>
        ) : prompts.length === 0 ? (
          <div className="text-center text-slate-500 py-10">
            Aucun prompt trouvé. Créez-en un nouveau pour démarrer.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onEdit={(id) => navigate(`/app/prompts/${id}`)}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onCopy={handleCopy}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default LibraryPage;
