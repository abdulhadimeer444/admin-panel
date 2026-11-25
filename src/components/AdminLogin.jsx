import React, { useState } from "react";
import { api, saveSession } from "../lib/api";

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (result.user?.role !== "admin") throw new Error("This account does not have admin access.");
      saveSession(result.token, result.user);
      onLogin(result.user);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-8 shadow-2xl space-y-5">
        <div>
          <p className="text-indigo-400 text-sm font-semibold">SHOP.CO ADMIN</p>
          <h1 className="text-2xl font-bold text-white mt-2">Sign in to dashboard</h1>
          <p className="text-sm text-slate-400 mt-2">Use an account whose backend role is admin.</p>
        </div>
        {error && <p className="rounded-xl bg-rose-500/10 text-rose-300 p-3 text-sm">{error}</p>}
        <label className="block text-sm text-slate-300">Email
          <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500" />
        </label>
        <label className="block text-sm text-slate-300">Password
          <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500" />
        </label>
        <button disabled={busy} className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 py-3 font-semibold text-white">{busy ? "Signing in..." : "Login"}</button>
      </form>
    </div>
  );
}
