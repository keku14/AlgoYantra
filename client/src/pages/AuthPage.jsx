import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AuthForm from "../components/AuthForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} replace />;
  }

  async function handleSubmit(form) {
    try {
      setLoading(true);
      const account =
        mode === "login"
          ? await login({
              email: form.email,
              password: form.password,
              role: form.role,
            })
          : await signup(form);

      toast.success(mode === "login" ? "Welcome back." : "Account created.");
      navigate(location.state?.from || (account.role === "teacher" ? "/teacher" : "/student"), {
        replace: true,
      });
    } catch (error) {
      const message = error.response?.data?.message
        || (error.request
          ? "Server unavailable. Start the backend and check the MongoDB connection."
          : "Authentication failed.");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <section className="glass-panel section-gradient flex flex-col justify-between p-8 sm:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-300/80 light:text-indigo-600">
              Teacher and student access
            </p>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-[-0.06em] text-white light:text-slate-900">
              Log in or sign up to start assignments right away.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 light:text-slate-600">
              Teachers create assignments and review results. Students solve them interactively and
              track their performance from one place.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5 shadow-glass light:bg-white/85">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">Teacher</p>
              <p className="mt-3 text-lg font-semibold text-white light:text-slate-900">
                Create assignments and check assignment-wise results
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5 shadow-glass light:bg-white/85">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">Student</p>
              <p className="mt-3 text-lg font-semibold text-white light:text-slate-900">
                Solve assignments interactively and see performance analytics
              </p>
            </div>
          </div>
        </section>

        <section className="glass-panel p-8 sm:p-10">
          <div className="mb-6 flex gap-3 rounded-full bg-slate-950/35 p-1.5 light:bg-slate-100">
            {["login", "signup"].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold capitalize transition ${
                  mode === value
                    ? "bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 text-white shadow-glow"
                    : "text-slate-300 hover:text-white light:text-slate-700"
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          <h2 className="font-display text-3xl font-bold tracking-[-0.05em] text-white light:text-slate-900">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-2 text-sm text-slate-400 light:text-slate-600">
            {mode === "login"
              ? "Sign in as a teacher or student."
              : "Choose your role and open the right dashboard."}
          </p>

          <div className="mt-8">
            <AuthForm key={mode} mode={mode} loading={loading} onSubmit={handleSubmit} />
          </div>
        </section>
      </div>
    </div>
  );
}
