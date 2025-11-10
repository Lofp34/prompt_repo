import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { FiBookOpen, FiFolder, FiLogOut, FiPlusCircle, FiSettings } from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

const DashboardLayout: React.FC = () => {
  const { logout } = useAuth();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-primary text-white shadow"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200">
          <h1 className="text-xl font-semibold text-slate-900">CROSTAR Studio</h1>
          <p className="text-sm text-slate-500">Gestionnaire de prompts</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLink to="/app/library" className={navLinkClass} end>
            <FiBookOpen className="text-lg" /> Bibliothèque
          </NavLink>
          <NavLink to="/app/prompts/new" className={navLinkClass}>
            <FiPlusCircle className="text-lg" /> Nouveau prompt
          </NavLink>
          <NavLink to="/app/categories" className={navLinkClass}>
            <FiFolder className="text-lg" /> Rubriques
          </NavLink>
          <NavLink to="/app/settings" className={navLinkClass}>
            <FiSettings className="text-lg" /> Paramètres
          </NavLink>
        </nav>
        <div className="px-4 py-4 border-t border-slate-200">
          <button
            type="button"
            className="flex items-center gap-2 w-full justify-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            onClick={logout}
          >
            <FiLogOut /> Déconnexion
          </button>
        </div>
      </aside>
      <main className="flex-1">
        <div className="px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
