import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          1: "var(--brand-1)",
          2: "var(--brand-2)",
          3: "var(--brand-3)",
          4: "var(--brand-4)",
          5: "var(--brand-5)",
          6: "var(--brand-6)",
          7: "var(--brand-7)",
        },
        text: {
          1: "var(--text-1)",
          2: "var(--text-2)",
          3: "var(--text-3)",
          4: "var(--text-4)",
          white: "var(--text-white)",
        },
        fill: {
          1: "var(--fill-1)",
          2: "var(--fill-2)",
          3: "var(--fill-3)",
          4: "var(--fill-4)",
        },
        line: {
          1: "var(--line-1)",
          2: "var(--line-2)",
          3: "var(--line-3)",
          4: "var(--line-4)",
        },
        success: "#00b42a",
        warning: "#ff7d00",
        danger: "#f53f3f",
        link: "var(--brand-6)",
        "link-hover": "var(--brand-7)",
        hover: {
          bg: "var(--hover-bg)",
        },
        filter: {
          bg: "var(--filter-bg)",
          "bg-solid": "var(--filter-bg-solid)",
        },
      },
      boxShadow: {
        panel: "0 10px 30px rgba(15, 35, 95, 0.05)",
        soft: "0 6px 18px rgba(15, 35, 95, 0.06)",
        card: "0 6px 18px rgba(15, 35, 95, 0.04)",
        dropdown: "0 12px 32px rgba(29, 33, 41, 0.14)",
        drawer: "0 16px 40px rgba(29, 33, 41, 0.18)",
        brand: "0 4px 14px 0 rgba(22, 93, 255, 0.25)",
        "brand-lg": "0 8px 24px 0 rgba(22, 93, 255, 0.32)",
        "card-hover": "0 8px 30px rgba(22, 93, 255, 0.12)",
      },
      zIndex: {
        sticky: "10",
        dropdown: "100",
        drawer: "200",
        modal: "300",
      },
      fontFamily: {
        sans: ["PingFang SC", "SF Pro Display", "Helvetica Neue", "Arial", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeUp 0.45s ease-out forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
