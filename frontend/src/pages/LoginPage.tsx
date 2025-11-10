import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Connexion réussie");
      const redirect = (location.state as { from?: Location })?.from?.pathname ?? "/app/library";
      navigate(redirect, { replace: true });
    } catch (error) {
      toast.error("Échec de la connexion. Vérifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900/5 px-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-10">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">Bienvenue</h1>
        <p className="text-sm text-slate-500 mb-6">
          Connectez-vous pour accéder à votre bibliothèque de prompts CROSTAR.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary text-white py-2 font-medium shadow hover:bg-primary-dark transition disabled:opacity-70"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-6 text-center">
          Pas encore de compte ? <Link to="/register" className="text-primary font-medium">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
