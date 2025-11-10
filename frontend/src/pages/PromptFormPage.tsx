import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  createCategory,
  createPrompt,
  createSubcategory,
  fetchCategories,
  fetchPrompt,
  fetchPromptVersions,
  fetchTags,
  updatePrompt,
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import { CROSTAR_HINTS, PROMPT_TEMPLATES, formatPromptPreview } from "../utils/promptFormatter";
import { PromptFormValues, PromptVersion } from "../types";

interface PromptFormPageProps {
  mode: "create" | "edit";
}

const emptyForm: PromptFormValues = {
  title: "",
  description: "",
  contexte: "",
  role: "",
  objectif: "",
  style: "",
  ton: "",
  audience: "",
  resultat: "",
  category_id: undefined,
  subcategory_id: undefined,
  tags: [],
  modele_cible: "",
  langue: "fr",
};

const essentialFields: Array<keyof PromptFormValues> = ["contexte", "objectif", "resultat"];
const essentialLabels: Record<string, string> = {
  contexte: "Contexte",
  objectif: "Objectif",
  resultat: "Résultat attendu",
};

const PromptFormPage: React.FC<PromptFormPageProps> = ({ mode }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { promptId } = useParams();

  const [formValues, setFormValues] = useState<PromptFormValues>(emptyForm);
  const [tagInput, setTagInput] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const promptQuery = useQuery({
    queryKey: ["prompt", promptId, token],
    queryFn: () => fetchPrompt(token, Number(promptId)),
    enabled: mode === "edit" && Boolean(promptId) && Boolean(token),
  });

  const versionsQuery = useQuery({
    queryKey: ["prompt", promptId, "versions"],
    queryFn: () => fetchPromptVersions(token, Number(promptId)),
    enabled: mode === "edit" && Boolean(promptId) && Boolean(token),
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

  const createPromptMutation = useMutation({
    mutationFn: (payload: PromptFormValues) => createPrompt(token, payload),
    onSuccess: (createdPrompt) => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success("Prompt créé avec succès");
      navigate(`/app/prompts/${createdPrompt.id}`);
    },
    onError: () => toast.error("Impossible de créer le prompt"),
  });

  const updatePromptMutation = useMutation({
    mutationFn: (payload: PromptFormValues) => updatePrompt(token, Number(promptId), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      queryClient.invalidateQueries({ queryKey: ["prompt", promptId] });
      toast.success("Prompt mis à jour");
    },
    onError: () => toast.error("Impossible de mettre à jour le prompt"),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => createCategory(token, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Rubrique créée");
    },
    onError: () => toast.error("Impossible de créer la rubrique"),
  });

  const createSubcategoryMutation = useMutation({
    mutationFn: ({ categoryId, name }: { categoryId: number; name: string }) =>
      createSubcategory(token, categoryId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Sous-rubrique créée");
    },
    onError: () => toast.error("Impossible de créer la sous-rubrique"),
  });

  useEffect(() => {
    if (promptQuery.data) {
      const prompt = promptQuery.data;
      setFormValues({
        title: prompt.title,
        description: prompt.description ?? "",
        contexte: prompt.contexte ?? "",
        role: prompt.role ?? "",
        objectif: prompt.objectif ?? "",
        style: prompt.style ?? "",
        ton: prompt.ton ?? "",
        audience: prompt.audience ?? "",
        resultat: prompt.resultat ?? "",
        category_id: prompt.category?.id,
        subcategory_id: prompt.subcategory?.id,
        tags: prompt.tags.map((tag) => tag.name),
        modele_cible: prompt.modele_cible ?? "",
        langue: prompt.langue ?? "",
      });
    }
  }, [promptQuery.data]);

  const preview = useMemo(() => formatPromptPreview(formValues), [formValues]);

  const missingEssentialFields = essentialFields.filter((field) =>
    !`${formValues[field] ?? ""}`.trim()
  );

  const categories = categoriesQuery.data ?? [];
  const availableTags = tagsQuery.data ?? [];

  const subcategories = useMemo(() => {
    if (!formValues.category_id) return [];
    return categories.find((category) => category.id === formValues.category_id)?.subcategories ?? [];
  }, [categories, formValues.category_id]);

  const handleFieldChange = (
    field: keyof PromptFormValues,
    value: string | number | undefined | string[]
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "category_id" ? { subcategory_id: undefined } : {}),
    }));
  };

  const handleTagAdd = () => {
    const value = tagInput.trim();
    if (!value || formValues.tags.includes(value)) return;
    setFormValues((prev) => ({ ...prev, tags: [...prev.tags, value] }));
    setTagInput("");
  };

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      handleTagAdd();
    }
  };

  const handleTagRemove = (tag: string) => {
    setFormValues((prev) => ({ ...prev, tags: prev.tags.filter((item) => item !== tag) }));
  };

  const handleTemplateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const templateKey = event.target.value;
    setSelectedTemplate(templateKey);
    const template = PROMPT_TEMPLATES.find((item) => item.label === templateKey);
    if (!template) return;
    const shouldReplace =
      mode === "create" || window.confirm("Remplacer le contenu du prompt par ce modèle ?");
    if (!shouldReplace) return;
    setFormValues((prev) => ({
      ...prev,
      title: template.values.title,
      description: template.values.description ?? "",
      contexte: template.values.contexte ?? "",
      role: template.values.role ?? "",
      objectif: template.values.objectif ?? "",
      style: template.values.style ?? "",
      ton: template.values.ton ?? "",
      audience: template.values.audience ?? "",
      resultat: template.values.resultat ?? "",
      modele_cible: template.values.modele_cible ?? prev.modele_cible,
      langue: template.values.langue ?? prev.langue,
      tags: template.values.tags ?? prev.tags,
    }));
  };

  const handleCopyPreview = async () => {
    try {
      await navigator.clipboard.writeText(preview);
      toast.success("Prompt copié");
    } catch (error) {
      toast.error("Impossible de copier le prompt");
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formValues.title.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }

    if (mode === "create") {
      createPromptMutation.mutate(formValues);
    } else {
      updatePromptMutation.mutate(formValues);
    }
  };

  const handleCreateCategory = async () => {
    const name = window.prompt("Nom de la nouvelle rubrique");
    if (!name?.trim()) return;
    await createCategoryMutation.mutateAsync(name.trim());
  };

  const handleCreateSubcategory = async () => {
    if (!formValues.category_id) {
      toast.error("Sélectionnez d'abord une rubrique");
      return;
    }
    const name = window.prompt("Nom de la nouvelle sous-rubrique");
    if (!name?.trim()) return;
    await createSubcategoryMutation.mutateAsync({
      categoryId: formValues.category_id,
      name: name.trim(),
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <header className="flex flex-col gap-2 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            {mode === "create" ? "Nouveau prompt" : "Modifier le prompt"}
          </h2>
          <p className="text-sm text-slate-500">
            Complétez chaque section du cadre CROSTAR pour générer un prompt structuré et efficace.
          </p>
        </header>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="title">
                Titre
              </label>
              <input
                id="title"
                value={formValues.title}
                onChange={(event) => handleFieldChange("title", event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="modele">
                Modèle cible
              </label>
              <input
                id="modele"
                value={formValues.modele_cible}
                onChange={(event) => handleFieldChange("modele_cible", event.target.value)}
                placeholder="GPT-5, Claude, Gemini..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="langue">
                Langue du prompt
              </label>
              <input
                id="langue"
                value={formValues.langue}
                onChange={(event) => handleFieldChange("langue", event.target.value)}
                placeholder="fr, en..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="template">
                Modèles de prompts
              </label>
              <select
                id="template"
                value={selectedTemplate}
                onChange={handleTemplateChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Aucun</option>
                {PROMPT_TEMPLATES.map((template) => (
                  <option key={template.label} value={template.label}>
                    {template.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="description">
              Description courte
            </label>
            <textarea
              id="description"
              value={formValues.description}
              onChange={(event) => handleFieldChange("description", event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="category">
                  Rubrique
                </label>
                <button type="button" className="text-xs text-primary" onClick={handleCreateCategory}>
                  + Ajouter
                </button>
              </div>
              <select
                id="category"
                value={formValues.category_id ?? ""}
                onChange={(event) => handleFieldChange(
                  "category_id",
                  event.target.value ? Number(event.target.value) : undefined
                )}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Aucune</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="subcategory">
                  Sous-rubrique
                </label>
                <button type="button" className="text-xs text-primary" onClick={handleCreateSubcategory}>
                  + Ajouter
                </button>
              </div>
              <select
                id="subcategory"
                value={formValues.subcategory_id ?? ""}
                onChange={(event) => handleFieldChange(
                  "subcategory_id",
                  event.target.value ? Number(event.target.value) : undefined
                )}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                disabled={!formValues.category_id}
              >
                <option value="">Aucune</option>
                {subcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="tags">
              Tags
            </label>
            <div className="flex items-center gap-2">
              <input
                id="tags"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Ajouter un tag et appuyer sur Entrée"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
              />
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600"
                onClick={handleTagAdd}
              >
                Ajouter
              </button>
            </div>
            {availableTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className={`px-3 py-1 rounded-full border ${
                      formValues.tags.includes(tag.name)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-slate-200 bg-slate-100 hover:bg-slate-200"
                    }`}
                    onClick={() => {
                      if (formValues.tags.includes(tag.name)) {
                        handleTagRemove(tag.name);
                      } else {
                        setFormValues((prev) => ({ ...prev, tags: [...prev.tags, tag.name] }));
                      }
                    }}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            )}
            {formValues.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {formValues.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1"
                  >
                    #{tag}
                    <button
                      type="button"
                      className="text-xs text-primary/80"
                      onClick={() => handleTagRemove(tag)}
                    >
                      Retirer
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {(
              [
                { field: "contexte", label: "Contexte" },
                { field: "role", label: "Rôle" },
                { field: "objectif", label: "Objectif" },
                { field: "style", label: "Style" },
                { field: "ton", label: "Ton" },
                { field: "audience", label: "Audience" },
                { field: "resultat", label: "Résultat attendu" },
              ] as const
            ).map(({ field, label }) => (
              <div key={field}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700" htmlFor={field}>
                    {label}
                  </label>
                  <span className="text-xs text-slate-400">{CROSTAR_HINTS[field]}</span>
                </div>
                <textarea
                  id={field}
                  value={formValues[field] as string}
                  onChange={(event) => handleFieldChange(field, event.target.value)}
                  rows={field === "resultat" ? 5 : 3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder={CROSTAR_HINTS[field]}
                />
              </div>
            ))}
          </div>

          {missingEssentialFields.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              Certains champs clés sont vides :
              {" "}
              {missingEssentialFields
                .map((field) => essentialLabels[field] ?? field)
                .join(", ")}
              . Complétez-les pour un prompt plus efficace.
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600"
              onClick={() => navigate(-1)}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-dark"
            >
              {mode === "create" ? "Créer le prompt" : "Enregistrer"}
            </button>
          </div>
        </form>
      </section>

      <aside className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-900">Prévisualisation</h3>
            <button
              type="button"
              className="text-sm text-primary font-medium"
              onClick={handleCopyPreview}
            >
              Copier
            </button>
          </div>
          <pre className="bg-slate-900/90 text-slate-100 rounded-lg p-4 max-h-[400px] overflow-auto text-xs whitespace-pre-wrap">
            {preview}
          </pre>
        </div>

        {mode === "edit" && versionsQuery.data && versionsQuery.data.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Historique</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {versionsQuery.data.map((version: PromptVersion) => (
                <li key={version.id} className="border border-slate-200 rounded-lg px-3 py-2">
                  {new Date(version.created_at).toLocaleString("fr-FR")}
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
};

export default PromptFormPage;
