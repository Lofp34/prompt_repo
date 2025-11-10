import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  fetchCategories,
  updateCategory,
  updateSubcategory,
} from "../api/client";
import { useAuth } from "../context/AuthContext";

const CategoriesPage: React.FC = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [categoryName, setCategoryName] = useState("");

  const categoriesQuery = useQuery({
    queryKey: ["categories", token],
    queryFn: () => fetchCategories(token),
    enabled: Boolean(token),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => createCategory(token, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setCategoryName("");
      toast.success("Rubrique créée");
    },
    onError: () => toast.error("Impossible de créer la rubrique"),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateCategory(token, id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Rubrique mise à jour");
    },
    onError: () => toast.error("Impossible de renommer la rubrique"),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Rubrique supprimée");
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error("Suppression impossible : rubrique utilisée ?");
    },
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

  const updateSubcategoryMutation = useMutation({
    mutationFn: ({ id, name, category_id }: { id: number; name: string; category_id: number }) =>
      updateSubcategory(token, id, { name, category_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Sous-rubrique mise à jour");
    },
    onError: () => toast.error("Impossible de renommer la sous-rubrique"),
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: (id: number) => deleteSubcategory(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Sous-rubrique supprimée");
    },
    onError: () => toast.error("Suppression impossible : sous-rubrique utilisée ?"),
  });

  const handleCreateCategory = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryName.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    createCategoryMutation.mutate(categoryName.trim());
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">Organisation des rubriques</h2>
        <p className="text-sm text-slate-500">
          Structurez votre bibliothèque grâce aux rubriques, sous-rubriques et tags.
        </p>
      </header>

      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <form onSubmit={handleCreateCategory} className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="categoryName">
              Nouvelle rubrique
            </label>
            <input
              id="categoryName"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Ex. Analyse, Création, Formation"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-dark"
            disabled={createCategoryMutation.isPending}
          >
            Ajouter
          </button>
        </form>
      </section>

      <section className="space-y-4">
        {categoriesQuery.isLoading ? (
          <div className="text-center text-slate-500 py-10">Chargement...</div>
        ) : (
          <div className="space-y-4">
            {categoriesQuery.data?.map((category) => (
              <div key={category.id} className="bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{category.name}</h3>
                    <p className="text-xs text-slate-500">
                      {(category.subcategories?.length ?? 0)} sous-rubrique
                      {(category.subcategories?.length ?? 0) > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600"
                      onClick={() => {
                        const name = window.prompt("Renommer la rubrique", category.name);
                        if (name?.trim()) {
                          updateCategoryMutation.mutate({ id: category.id, name: name.trim() });
                        }
                      }}
                    >
                      Renommer
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-600"
                      onClick={() => {
                        if (window.confirm("Supprimer cette rubrique ?")) {
                          deleteCategoryMutation.mutate(category.id);
                        }
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                <div className="px-6 py-4 space-y-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <input
                      type="text"
                      placeholder="Ajouter une sous-rubrique"
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          const target = event.target as HTMLInputElement;
                          if (target.value.trim()) {
                            createSubcategoryMutation.mutate({
                              categoryId: category.id,
                              name: target.value.trim(),
                            });
                            target.value = "";
                          }
                        }
                      }}
                    />
                    <span className="text-xs text-slate-400">
                      Appuyez sur Entrée pour enregistrer
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(category.subcategories ?? []).map((subcategory) => (
                      <div
                        key={subcategory.id}
                        className="flex items-center gap-2 rounded-full bg-slate-100 border border-slate-200 px-3 py-1"
                      >
                        <span className="text-sm text-slate-700">{subcategory.name}</span>
                        <button
                          type="button"
                          className="text-xs text-primary"
                          onClick={() => {
                            const name = window.prompt("Renommer", subcategory.name);
                            if (name?.trim()) {
                              updateSubcategoryMutation.mutate({
                                id: subcategory.id,
                                name: name.trim(),
                                category_id: category.id,
                              });
                            }
                          }}
                        >
                          Renommer
                        </button>
                        <button
                          type="button"
                          className="text-xs text-rose-600"
                          onClick={() => {
                            if (window.confirm("Supprimer cette sous-rubrique ?")) {
                              deleteSubcategoryMutation.mutate(subcategory.id);
                            }
                          }}
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                    {(category.subcategories?.length ?? 0) === 0 && (
                      <span className="text-sm text-slate-500">Aucune sous-rubrique pour le moment.</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CategoriesPage;
