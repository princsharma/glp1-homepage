"use client";

import { ReactNode } from "react";
import { useScrollReveal } from "./useScrollReveal";
import styles from "./Cascade.module.css";

type Props = {
  children: ReactNode;
  delay?: number;
  /** Kept for backwards compatibility — currently no internal stagger */
  stagger?: number;
  from?: "up" | "down" | "left" | "right";
  className?: string;
};

export default function Cascade({
  children,
  delay = 0.2 * 1000,
  stagger,  // accepted but unused
  from = "up",
  className = "",
}: Props) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`${styles.wrapper} ${
        isVisible ? styles.visible : ""
      } ${styles[`from_${from}`]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}