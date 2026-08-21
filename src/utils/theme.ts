export type ThemeOption = "light" | "dark" | "system";

const THEME_KEY = "cashtrack_theme";

export function getStoredTheme(): ThemeOption {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark" || saved === "system") {
    return saved;
  }
  return "system";
}

export function getEffectiveTheme(option: ThemeOption): "light" | "dark" {
  if (option === "dark") return "dark";
  if (option === "light") return "light";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(option: ThemeOption) {
  const effective = getEffectiveTheme(option);
  const root = document.documentElement;

  if (effective === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // Persist user choice
  localStorage.setItem(THEME_KEY, option);

  // Dispatch custom event for real-time reactivity
  window.dispatchEvent(new CustomEvent("cashtrack_theme_changed", { detail: { option, effective } }));
}

export function initTheme() {
  const currentOption = getStoredTheme();
  applyTheme(currentOption);

  // Listen for system theme changes if set to system
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (getStoredTheme() === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
  }
}
