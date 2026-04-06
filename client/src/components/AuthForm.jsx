import { useState } from "react";

export default function AuthForm({ mode, loading, onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
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
                  ? "border-indigo-300/50 bg-indigo-500/15 text-indigo-100 light:text-indigo-700"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white light:border-slate-200 light:bg-white light:text-slate-700"
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

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 px-5 py-3 font-semibold text-white transition hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Working..." : mode === "login" ? "Enter platform" : "Create account"}
      </button>
    </form>
  );
}
