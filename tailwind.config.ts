import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        bg: "#f7f6f3",
        "bg-deep": "#f1efe9",
        surface: "#ffffff",
        "surface-muted": "#f6f5f2",
        "surface-raised": "#ffffff",
        "surface-ink": "#111111",

        // Borders
        border: "#e8e6e1",
        "border-strong": "#d6d3cc",
        "border-soft": "#ecebe7",

        // Text
        text: "#141414",
        "text-muted": "#5f5f5f",
        "text-soft": "#8a8883",
        "text-inverse": "#ffffff",

        // Brand (Signature Cleans green)
        accent: "#2c5f2d",
        "accent-dark": "#1f4721",
        "accent-bright": "#3d7a3e",
        "accent-soft": "#eaf3eb",
        "accent-glow": "#c8e4c9",

        // Semantic
        positive: "#2c5f2d",
        "positive-soft": "#eaf3eb",
        warn: "#b8860b",
        "warn-soft": "#faf0d9",
        danger: "#a33a2a",
        "danger-soft": "#f6e3de",
        info: "#2b5a8a",
        "info-soft": "#e6eef7",

        // Audit bands
        "band-healthy": "#2c5f2d",
        "band-action": "#b8860b",
        "band-intervene": "#a33a2a"
      },
      fontFamily: {
        sans: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "monospace"],
        display: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      fontSize: {
        "display-2xl": ["56px", { lineHeight: "1.02", letterSpacing: "-0.03em", fontWeight: "600" }],
        "display-xl": ["44px", { lineHeight: "1.04", letterSpacing: "-0.025em", fontWeight: "600" }],
        "display-lg": ["34px", { lineHeight: "1.08", letterSpacing: "-0.02em", fontWeight: "600" }],
        "display-md": ["26px", { lineHeight: "1.15", letterSpacing: "-0.015em", fontWeight: "600" }]
      },
      fontVariantNumeric: { tabular: "tabular-nums" },
      borderRadius: {
        "2xs": "4px",
        xs: "6px",
        "3xl": "28px"
      },
      boxShadow: {
        // Elevation hierarchy (deliberate, restrained)
        e1: "0 1px 2px rgba(17, 17, 17, 0.04), 0 0 0 1px rgba(17, 17, 17, 0.03)",
        e2: "0 2px 6px -2px rgba(17, 17, 17, 0.06), 0 1px 2px rgba(17, 17, 17, 0.04)",
        e3: "0 8px 24px -12px rgba(17, 17, 17, 0.12), 0 2px 4px rgba(17, 17, 17, 0.04)",
        e4: "0 22px 48px -24px rgba(17, 17, 17, 0.18), 0 4px 8px -2px rgba(17, 17, 17, 0.06)",
        // Focus / ring
        ring: "0 0 0 3px rgba(44, 95, 45, 0.18)",
        "ring-danger": "0 0 0 3px rgba(163, 58, 42, 0.18)",
        // Inset border used for ghost buttons + muted surfaces
        "inset-border": "inset 0 0 0 1px rgba(17, 17, 17, 0.06)",
        // Brand glow (used very sparingly, e.g. primary CTA hover)
        "accent-glow": "0 10px 24px -12px rgba(44, 95, 45, 0.45)"
      },
      backgroundImage: {
        "grain-noise":
          "radial-gradient(circle at 20% 10%, rgba(44,95,45,0.05), transparent 45%), radial-gradient(circle at 80% 0%, rgba(44,95,45,0.04), transparent 40%)",
        "accent-gradient": "linear-gradient(135deg, #2c5f2d 0%, #1f4721 100%)",
        "accent-gradient-bright": "linear-gradient(135deg, #3d7a3e 0%, #2c5f2d 100%)",
        "shine": "linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.4) 50%, transparent 80%)"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(0.92)" }
        }
      },
      animation: {
        "fade-up": "fade-up 340ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 240ms ease both",
        shimmer: "shimmer 1.6s linear infinite",
        "pulse-dot": "pulse-dot 1.8s ease-in-out infinite"
      },
      transitionTimingFunction: {
        swift: "cubic-bezier(0.22, 1, 0.36, 1)"
      }
    }
  },
  plugins: []
};

export default config;
