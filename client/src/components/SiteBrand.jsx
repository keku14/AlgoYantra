import { Link } from "react-router-dom";

export default function SiteBrand({ className = "" }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center text-3xl font-black tracking-[-0.06em] text-white transition hover:opacity-90 light:text-slate-900 sm:text-4xl ${className}`.trim()}
      aria-label="AlgoYantra home"
    >
      AlgoYantra
    </Link>
  );
}
