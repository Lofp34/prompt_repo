import React from "react";

const SettingsPage: React.FC = () => (
  <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
    <div>
      <h2 className="text-2xl font-semibold text-slate-900">Paramètres</h2>
      <p className="text-sm text-slate-500">
        Ce module sera enrichi prochainement : gestion multi-utilisateurs, intégrations LLM, etc.
      </p>
    </div>
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
      Vous pouvez déjà gérer vos rubriques, importer/exporter vos prompts et préparer des hooks pour une future
      amélioration automatique de prompt.
    </div>
  </div>
);

export default SettingsPage;
