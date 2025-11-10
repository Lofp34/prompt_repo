import React from "react";
import { FiCopy, FiEdit2, FiTrash2, FiRepeat } from "react-icons/fi";
import dayjs from "dayjs";
import "dayjs/locale/fr";

import { PromptSummary } from "../types";

interface PromptCardProps {
  prompt: PromptSummary;
  onEdit: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onCopy: (prompt: PromptSummary) => void;
}

dayjs.locale("fr");

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onEdit, onDuplicate, onDelete, onCopy }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{prompt.title}</h3>
        {prompt.description && <p className="text-sm text-slate-600 mt-1">{prompt.description}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
          onClick={() => onCopy(prompt)}
          title="Copier le prompt"
        >
          <FiCopy />
        </button>
        <button
          type="button"
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
          onClick={() => onDuplicate(prompt.id)}
          title="Dupliquer"
        >
          <FiRepeat />
        </button>
        <button
          type="button"
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
          onClick={() => onEdit(prompt.id)}
          title="Modifier"
        >
          <FiEdit2 />
        </button>
        <button
          type="button"
          className="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
          onClick={() => onDelete(prompt.id)}
          title="Supprimer"
        >
          <FiTrash2 />
        </button>
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-slate-500">
      {prompt.category && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary font-medium">
          {prompt.category.name}
          {prompt.subcategory ? ` / ${prompt.subcategory.name}` : ""}
        </span>
      )}
      {prompt.modele_cible && (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1">
          Modèle : {prompt.modele_cible}
        </span>
      )}
      {prompt.langue && (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1">
          Langue : {prompt.langue.toUpperCase()}
        </span>
      )}
      {prompt.tags.map((tag) => (
        <span key={tag.id} className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-3 py-1">
          #{tag.name}
        </span>
      ))}
    </div>
    <div className="mt-4 text-xs text-slate-400 flex justify-between">
      <span>Créé le {dayjs(prompt.created_at).format("DD MMM YYYY")}</span>
      <span>Mis à jour le {dayjs(prompt.updated_at).format("DD MMM YYYY")}</span>
    </div>
  </div>
);

export default PromptCard;
