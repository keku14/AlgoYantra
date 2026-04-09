import { Toaster } from "react-hot-toast";

import { useTheme } from "../context/ThemeContext.jsx";

export default function AppToaster() {
  const { isDark } = useTheme();

  return (
    <Toaster
      position="top-right"
      gutter={12}
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? "rgba(8, 14, 32, 0.92)" : "rgba(255, 255, 255, 0.96)",
          color: isDark ? "#e2e8f0" : "#0f172a",
          border: isDark
            ? "1px solid rgba(148, 163, 184, 0.18)"
            : "1px solid rgba(148, 163, 184, 0.24)",
          boxShadow: isDark
            ? "0 24px 50px -28px rgba(2, 8, 23, 0.75)"
            : "0 24px 50px -30px rgba(15, 23, 42, 0.18)",
          backdropFilter: "blur(20px)",
          borderRadius: "20px",
          padding: "14px 16px",
        },
      }}
    />
  );
}
