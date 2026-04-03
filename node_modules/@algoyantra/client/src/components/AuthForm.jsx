import { useState } from "react";

export default function AuthForm({ mode, loading, onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    email: mode === "login" ? "teacher@algoyantra.dev" : "",
    password: mode === "login" ? "Teach123!" : "",
    role: "teacher",
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(form);
  }

  function applyDemo(role) {
    setForm({
      name: role === "teacher" ? "Prof. Arya Menon" : "Riya Sharma",
      email: role === "teacher" ? "teacher@algoyantra.dev" : "student@algoyantra.dev",
      password: role === "teacher" ? "Teach123!" : "Learn123!",
      role,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {mode === "signup" ? (
        <label className="block space-y-2">
          <span className="text-sm text-slate-300 light:text-slate-700">Full name</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60 light:border-slate-200 light:bg-white light:text-slate-900"
            placeholder="Enter your name"
          />
        </label>
      ) : null}

      <div className="space-y-2">
        <span className="text-sm text-slate-300 light:text-slate-700">Role</span>
        <div className="grid grid-cols-2 gap-3">
          {["teacher", "student"].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setForm((current) => ({ ...current, role }))}
              className={`rounded-2xl border px-4 py-3 text-sm font-medium capitalize transition ${
                form.role === role
                  ? "border-cyan-300/60 bg-cyan-400/15 text-cyan-100"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <label className="block space-y-2">
        <span className="text-sm text-slate-300 light:text-slate-700">Email</span>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60 light:border-slate-200 light:bg-white light:text-slate-900"
          placeholder="you@example.com"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-slate-300 light:text-slate-700">Password</span>
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60 light:border-slate-200 light:bg-white light:text-slate-900"
          placeholder="Enter your password"
        />
      </label>

      <div className="rounded-3xl border border-amber-300/15 bg-amber-400/10 p-4">
        <p className="text-sm font-semibold text-amber-200 light:text-amber-700">Demo accounts</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyDemo("teacher")}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-100 transition hover:bg-white/10 light:border-slate-200 light:text-slate-800"
          >
            Fill teacher credentials
          </button>
          <button
            type="button"
            onClick={() => applyDemo("student")}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-100 transition hover:bg-white/10 light:border-slate-200 light:text-slate-800"
          >
            Fill student credentials
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-semibold text-slate-950 transition hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Working..." : mode === "login" ? "Enter platform" : "Create account"}
      </button>
    </form>
  );
}
