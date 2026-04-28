"use client";

import { useEffect, useState } from "react";
import styles from "./ScrollProgress.module.css";

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      // Avoid division by zero on short pages
      const percentage = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(percentage);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div className={styles.track} aria-hidden="true">
      <div
        className={styles.bar}
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}