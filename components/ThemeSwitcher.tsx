"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ThemeSwitcher.module.css";

type Theme = {
  id: string;
  name: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySoft: string;
};

const THEMES: Theme[] = [
  {
    id: "sage",
    name: "Sage",
    primary: "#347e5d",
    primaryDark: "#1b4332",
    primaryLight: "#74c69d",
    primarySoft: "#d8f3dc",
  },
  {
    id: "purple",
    name: "Purple",
    primary: "#7c5cd6",
    primaryDark: "#4c3a9b",
    primaryLight: "#b8a4f0",
    primarySoft: "#f3eefe",
  },
  {
    id: "blue",
    name: "Ocean",
    primary: "#0e7490",
    primaryDark: "#155e75",
    primaryLight: "#67e8f9",
    primarySoft: "#ecfeff",
  },
  {
    id: "wine",
    name: "Wine",
    primary: "#b8455e",
    primaryDark: "#7d2c40",
    primaryLight: "#e8a4b3",
    primarySoft: "#fdf2f4",
  },
];

const STORAGE_KEY = "site-theme";

export default function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(THEMES[0].id);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Apply a theme — writes CSS custom properties to :root
  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", theme.primary);
    root.style.setProperty("--color-primary-dark", theme.primaryDark);
    root.style.setProperty("--color-primary-light", theme.primaryLight);
    root.style.setProperty("--color-primary-soft", theme.primarySoft);
    setActiveId(theme.id);
    localStorage.setItem(STORAGE_KEY, theme.id);
  };

  // Read saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const theme = THEMES.find((t) => t.id === saved) || THEMES[0];
    applyTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close panel on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      {/* Toggle button */}
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close theme picker" : "Open theme picker"}
      >
        <span className={styles.toggleIcon} aria-hidden="true">
          🎨
        </span>
      </button>

      {/* Swatch panel — drops below the toggle */}
      <div
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
        role="group"
        aria-label="Theme color options"
      >
        <span className={styles.panelLabel}>Theme</span>

        <div className={styles.swatches}>
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => applyTheme(theme)}
              className={`${styles.swatch} ${
                activeId === theme.id ? styles.swatchActive : ""
              }`}
              style={{ backgroundColor: theme.primary }}
              aria-label={`Apply ${theme.name} theme`}
              aria-pressed={activeId === theme.id}
              title={theme.name}
            >
              {activeId === theme.id && (
                <span className={styles.swatchCheck} aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}