"use client";

import { useEffect, useState } from "react";
import styles from "./Header.module.css";

const NAV_LINKS = [
  { id: "hero", label: "Home" },
  { id: "lose-weight", label: "Lose Weight" },
  { id: "bmi", label: "BMI Check" },
  { id: "how-it-works", label: "How It Works" },
  { id: "plans", label: "GLP-1 Plans" },
  { id: "why-us", label: "Why Us" },
  { id: "doctors", label: "Our Doctors" },
  { id: "reviews", label: "Reviews" },
  { id: "faq", label: "FAQ" },
  { id: "get-started", label: "Get Started" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState("hero");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      {
        rootMargin: "-30% 0px -50% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    NAV_LINKS.forEach((link) => {
      const el = document.getElementById(link.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLinkClick = (id: string) => {
    setIsOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLogoClick = () => {
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <header className={isScrolled ? styles.headerScrolled : styles.header}>
        <div className={styles.container}>
          <button
            type="button"
            className={styles.logo}
            onClick={handleLogoClick}
            aria-label="Go to top"
          >
            <span className={styles.logoMark}>◆</span>
            <span className={styles.logoText}>OngoWeightLoss</span>
          </button>

          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
            aria-expanded={isOpen}
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>
        </div>
      </header>

      <div
        className={isOpen ? styles.backdropOpen : styles.backdrop}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={isOpen ? styles.drawerOpen : styles.drawer}
        aria-label="Site navigation"
        aria-hidden={!isOpen}
      >
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>Menu</span>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className={styles.drawerNav}>
          {NAV_LINKS.map((link, index) => (
            <button
              key={link.id}
              type="button"
              className={
                activeId === link.id
                  ? styles.drawerLinkActive
                  : styles.drawerLink
              }
              onClick={() => handleLinkClick(link.id)}
            >
              <span className={styles.drawerNumber}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={styles.drawerLabel}>{link.label}</span>
              <span className={styles.drawerArrow} aria-hidden="true">→</span>
            </button>
          ))}
        </nav>

        <div className={styles.drawerFooter}>
          <button
            type="button"
            className={styles.drawerCta}
            onClick={() => handleLinkClick("get-started")}
          >
            Book Now
          </button>
        </div>
      </aside>
    </>
  );
}