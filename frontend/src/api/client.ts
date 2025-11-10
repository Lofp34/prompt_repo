import axios from "axios";

import { API_URL, withAuthHeader } from "../context/AuthContext";
import {
  Category,
  ImportPayload,
  ImportResponse,
  LibraryExport,
  Prompt,
  PromptFilters,
  PromptFormValues,
  PromptSummary,
  PromptVersion,
  Subcategory,
  Tag,
} from "../types";

const api = axios.create({
  baseURL: API_URL,
});

export const fetchPrompts = async (token: string | null, filters: PromptFilters = {}) => {
  const { data } = await api.get<PromptSummary[]>("/prompts", {
    ...withAuthHeader(token),
    params: filters,
  });
  return data;
};

export const fetchPrompt = async (token: string | null, id: number) => {
  const { data } = await api.get<Prompt>(`/prompts/${id}`, withAuthHeader(token));
  return data;
};

export const createPrompt = async (token: string | null, values: PromptFormValues) => {
  const { data } = await api.post<Prompt>("/prompts", values, withAuthHeader(token));
  return data;
};

export const updatePrompt = async (
  token: string | null,
  id: number,
  values: Partial<PromptFormValues>
) => {
  const { data } = await api.put<Prompt>(`/prompts/${id}`, values, withAuthHeader(token));
  return data;
};

export const deletePrompt = async (token: string | null, id: number) => {
  await api.delete(`/prompts/${id}`, withAuthHeader(token));
};

export const duplicatePrompt = async (token: string | null, id: number) => {
  const { data } = await api.post<Prompt>(
    `/prompts/${id}/duplicate`,
    {},
    withAuthHeader(token)
  );
  return data;
};

export const fetchPromptVersions = async (token: string | null, id: number) => {
  const { data } = await api.get<PromptVersion[]>(
    `/prompts/${id}/versions`,
    withAuthHeader(token)
  );
  return data;
};

export const fetchCategories = async (token: string | null) => {
  const { data } = await api.get<Category[]>("/categories", withAuthHeader(token));
  return data;
};

export const createCategory = async (token: string | null, name: string) => {
  const { data } = await api.post<Category>(
    "/categories",
    { name },
    withAuthHeader(token)
  );
  return data;
};

export const updateCategory = async (token: string | null, id: number, name: string) => {
  const { data } = await api.put<Category>(
    `/categories/${id}`,
    { name },
    withAuthHeader(token)
  );
  return data;
};

export const deleteCategory = async (token: string | null, id: number) => {
  await api.delete(`/categories/${id}`, withAuthHeader(token));
};

export const fetchSubcategories = async (token: string | null, categoryId: number) => {
  const { data } = await api.get<Subcategory[]>(
    `/categories/${categoryId}/subcategories`,
    withAuthHeader(token)
  );
  return data;
};

export const createSubcategory = async (
  token: string | null,
  categoryId: number,
  name: string
) => {
  const { data } = await api.post<Subcategory>(
    `/categories/${categoryId}/subcategories`,
    { name, category_id: categoryId },
    withAuthHeader(token)
  );
  return data;
};

export const updateSubcategory = async (
  token: string | null,
  subcategoryId: number,
  payload: { name: string; category_id: number }
) => {
  const { data } = await api.put<Subcategory>(
    `/categories/subcategories/${subcategoryId}`,
    payload,
    withAuthHeader(token)
  );
  return data;
};

export const deleteSubcategory = async (token: string | null, subcategoryId: number) => {
  await api.delete(`/categories/subcategories/${subcategoryId}`, withAuthHeader(token));
};

export const fetchTags = async (token: string | null) => {
  const { data } = await api.get<Tag[]>("/tags", withAuthHeader(token));
  return data;
};

export const createTag = async (token: string | null, name: string) => {
  const { data } = await api.post<Tag>("/tags", { name }, withAuthHeader(token));
  return data;
};

export const deleteTag = async (token: string | null, id: number) => {
  await api.delete(`/tags/${id}`, withAuthHeader(token));
};

export const exportLibrary = async (token: string | null) => {
  const { data } = await api.get<LibraryExport>("/library/export", withAuthHeader(token));
  return data;
};

export const importLibrary = async (token: string | null, payload: ImportPayload) => {
  const { data } = await api.post<ImportResponse>(
    "/library/import",
    payload,
    withAuthHeader(token)
  );
  return data;
};
export default api;
