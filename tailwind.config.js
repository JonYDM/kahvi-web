/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Paleta Kahvi ──────────────────────────────────────────────────
        "cafe-intenso": "#2B1F19",
        "cafe-principal": "#6B4F3B",
        "caramelo": "#C9BB5A",
        "crema": "#F4E9DB",
        "verde-menta": "#6FAF9A",

        // Tokens semánticos (CSS variables HSL).
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          strong: "hsl(var(--accent-strong))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        info: "hsl(var(--info))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        // Alias de compatibilidad
        canvas: "hsl(var(--background))",
        surface: "hsl(var(--card))",
        hairline: "hsl(var(--border))",
        ink: {
          DEFAULT: "hsl(var(--foreground))",
          soft: "hsl(var(--muted-foreground))",
          muted: "hsl(var(--muted-foreground))",
        },
        danger: "hsl(var(--destructive))",
        "primary-50": "hsl(var(--secondary))",
        "primary-100": "hsl(var(--secondary))",

        // ── Tokens de superficies (Kahvi, calco del Stitch base) ──────────
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#fdf5ed",
        "surface-container": "#f9ede0",
        "surface-container-high": "#f4e9db",
        "surface-container-highest": "#efe3d4",
        "surface-variant": "#e8ddd0",
        "surface-dim": "#ddd5c8",
        "on-surface": "#2B1F19",
        "on-surface-variant": "#6B4F3B",
        outline: "#9c7e6a",
        "outline-variant": "#d5c5b5",
        // Primary (verde menta) — Kahvi
        "st-primary": "#4a9982",
        "primary-container": "#6FAF9A",
        "on-primary": "#ffffff",
        "on-primary-container": "#1a4a3d",
        "primary-fixed": "#b8ddd3",
        "primary-fixed-dim": "#8ccab9",
        "on-primary-fixed": "#0d2e26",
        // Secondary (caramelo/café) — Kahvi
        "st-secondary": "#6B4F3B",
        "secondary-container": "#C9BB5A",
        "on-secondary": "#ffffff",
        "secondary-fixed": "#f0e8b8",
        "secondary-fixed-dim": "#ddd08a",
        "on-secondary-fixed": "#3a3210",
        "on-secondary-fixed-variant": "#5a4e1a",
        "on-secondary-container": "#3a3210",
        // Tertiary (café intenso)
        tertiary: "#3d2b1f",
        "tertiary-container": "#6B4F3B",
        "tertiary-fixed": "#d4c3b3",
        "on-tertiary-fixed-variant": "#4d3728",
        "on-tertiary-container": "#f4e9db",
        // Error
        "error-st": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        // Nav: fondo crema translúcido + blur
        "surface-nav": "rgba(244, 233, 219, 0.88)",
      },
      fontFamily: {
        sans: ["Nunito", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        marca: ["Nunito", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: ["2.25rem", { lineHeight: "2.75rem", letterSpacing: "-0.02em", fontWeight: "800" }],
        h1: ["1.75rem", { lineHeight: "2.25rem", letterSpacing: "-0.01em", fontWeight: "700" }],
        h2: ["1.375rem", { lineHeight: "1.75rem", fontWeight: "600" }],
        h3: ["1.125rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        metric: ["2rem", { lineHeight: "2.375rem", letterSpacing: "-0.03em", fontWeight: "700" }],
        "headline-xl": ["36px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "800" }],
        "headline-lg": ["28px", { lineHeight: "36px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "headline-md": ["22px", { lineHeight: "28px", fontWeight: "600" }],
        "headline-sm": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-sm": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "label-lg": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "600" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "600" }],
        "label-sm": ["11px", { lineHeight: "14px", letterSpacing: "0.04em", fontWeight: "700" }],
        "metric-display": ["32px", { lineHeight: "38px", letterSpacing: "-0.03em", fontWeight: "700" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 16px)",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(43,31,25,0.06)",
        soft: "0 2px 8px -2px rgba(107,79,59,0.10), 0 1px 4px -1px rgba(43,31,25,0.05)",
        lift: "0 10px 24px -4px rgba(107,79,59,0.14), 0 4px 10px -2px rgba(43,31,25,0.06)",
        float: "0 20px 40px -8px rgba(43,31,25,0.24)",
        "primary-glow": "0 6px 20px hsl(var(--primary) / 0.28)",
        "inset-up":
          "inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -3px 8px -3px rgba(107,79,59,0.14), 0 6px 16px -6px rgba(43,31,25,0.14)",
      },
      backgroundImage: {
        brand: "linear-gradient(135deg, #6FAF9A 0%, #4a9982 100%)",
        "brand-mesh":
          "radial-gradient(at 20% 20%, rgba(111,175,154,0.35) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(107,79,59,0.30) 0px, transparent 50%), radial-gradient(at 90% 90%, rgba(201,187,90,0.25) 0px, transparent 50%)",
        "accent-grad": "linear-gradient(135deg, #C9BB5A 0%, #b0a340 100%)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "out-back": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.6)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "vito-float": {
          "0%, 100%": { transform: "translateY(0) rotate(-1deg)" },
          "50%": { transform: "translateY(-6px) rotate(1deg)" },
        },
        "vito-hop": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "30%": { transform: "translateY(-14px) scale(1.05)" },
          "55%": { transform: "translateY(0) scale(0.97)" },
          "70%": { transform: "translateY(-5px) scale(1.02)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 280ms cubic-bezier(0.16, 1, 0.3, 1)",
        "vito-float": "vito-float 3.5s ease-in-out infinite",
        "vito-hop": "vito-hop 600ms ease-out",
      },
    },
  },
  plugins: [],
};
