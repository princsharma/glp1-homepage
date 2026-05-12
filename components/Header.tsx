"use client";

import { useEffect, useState } from "react";
import styles from "./Header.module.css";

const NAV_LINKS = [
  { id: "hero", label: "Home" },
  { id: "lose-weight", label: "Lose Weight" },
  { id: "how-it-works", label: "How It Works" },
  { id: "bmi", label: "BMI Check" },
  { id: "plans", label: "GLP-1 Plans" },
  { id: "why-us", label: "Why Us" },
  { id: "pricing", label: "Pricing" },
  { id: "reviews", label: "Reviews" },
  { id: "glpeducation", label: "About GLP-1" },
  { id: "doctors", label: "Our Doctors" },
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
    if (id === "get-started") {
      window.location.href = "/weightloss-onboard";
      return;
    }
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
        <div className={styles.drawerInner}>
          <div className={styles.drawerTop}>
            <button
              type="button"
              className={styles.drawerLogo}
              onClick={handleLogoClick}
              aria-label="Go to top"
            >
              <span className={styles.drawerLogoMark}>◆</span>
              <span className={styles.drawerLogoText}>Ongo</span>
            </button>

            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <span className={styles.closeLabel}>Close</span>
              <span className={styles.closeIcon} aria-hidden="true">
                ✕
              </span>
            </button>
          </div>

          <div className={styles.drawerBody}>
            <nav className={styles.drawerNav} aria-label="Primary">
              <span className={styles.eyebrow}>
                <span className={styles.eyebrowDash} aria-hidden="true" />
                NAVIGATE
              </span>

              <ul className={styles.navList}>
                {NAV_LINKS.map((link, index) => (
                  <li key={link.id} className={styles.navListItem}>
                    <button
                      type="button"
                      className={
                        activeId === link.id
                          ? styles.navItemActive
                          : styles.navItem
                      }
                      onClick={() => handleLinkClick(link.id)}
                      style={{ ["--i" as never]: index } as React.CSSProperties}
                    >
                      <span className={styles.navNumber}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={styles.navLabel}>{link.label}</span>
                      <span className={styles.navArrow} aria-hidden="true">
                        ↗
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <aside className={styles.drawerInfo} aria-label="Contact information">
              <span className={styles.statusPill}>
                <span className={styles.statusDot} aria-hidden="true" />
                ACCEPTING NEW PATIENTS
              </span>

              <div className={styles.infoBlock}>
                <span className={styles.eyebrow}>
                  <span className={styles.eyebrowDash} aria-hidden="true" />
                  GET IN TOUCH
                </span>

                <a
                  className={styles.infoLink}
                  href="mailto:info@ongoweightloss.com"
                >
                  <span className={styles.infoIcon} aria-hidden="true">
                    ✉
                  </span>
                  <span>info@ongoweightloss.com</span>
                </a>

                <a className={styles.infoLink} href="tel:+1 (888) 655-5267">
                  <span className={styles.infoIcon} aria-hidden="true">
                    ☎
                  </span>
                  <span>+1 (888) 655-5267</span>
                </a>
              </div>

              <div className={styles.infoBlock}>
                <span className={styles.eyebrow}>
                  <span className={styles.eyebrowDash} aria-hidden="true" />
                  FOLLOW US
                </span>

                <div className={styles.socialRow}>
                  <a
                    className={styles.socialBtn}
                    href="#"
                    aria-label="Instagram"
                  >
                    ◎
                  </a>
                  <a
                    className={styles.socialBtn}
                    href="#"
                    aria-label="YouTube"
                  >
                    ▶
                  </a>
                  <a
                    className={styles.socialBtn}
                    href="#"
                    aria-label="LinkedIn"
                  >
                    in
                  </a>
                </div>
              </div>

              <div className={styles.infoFooter}>
                <p className={styles.footerLine}>
                  © {new Date().getFullYear()} Ongo Weight Loss.
                </p>
                <p className={styles.footerTagline}>
                  Doctor-led GLP-1, made for you.
                </p>
              </div>
            </aside>
          </div>

          <button
            type="button"
            className={styles.drawerCta}
            onClick={() => handleLinkClick("get-started")}
          >
            Book Now →
          </button>
        </div>
      </aside>
    </>
  );
}