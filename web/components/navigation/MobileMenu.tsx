"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  links: { label: string; href: string }[];
}

export default function MobileMenu({ isOpen, onClose, links }: MobileMenuProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap: focus the close button when opened
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: "rgba(17, 17, 17, 0.4)" }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 z-[70] w-[280px] overflow-y-auto"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              borderLeft: "1px solid var(--color-border)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <span
                className="text-sm font-semibold tracking-tight"
                style={{ color: "var(--color-text-primary)" }}
              >
                Travel AI
              </span>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="flex items-center justify-center rounded-md p-1 transition-colors"
                style={{ color: "var(--color-text-muted)" }}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Links */}
            <nav className="px-6 py-6">
              <ul className="space-y-1">
                {links.map((link, i) => (
                  <motion.li
                    key={link.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                  >
                    <a
                      href={link.href}
                      onClick={onClose}
                      className="block rounded-md px-3 py-3 text-base font-medium transition-colors"
                      style={{
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {link.label}
                    </a>
                  </motion.li>
                ))}
              </ul>

              <div
                className="my-6"
                style={{ borderTop: "1px solid var(--color-border)" }}
              />

              <ul className="space-y-1">
                <motion.li
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <a
                    href="https://github.com/25Pradnyesh/Travel-AI-"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className="block rounded-md px-3 py-3 text-base transition-colors"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    GitHub
                  </a>
                </motion.li>
              </ul>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                className="mt-6"
              >
                <a
                  href="#hero"
                  onClick={onClose}
                  className="block w-full rounded-md py-3 text-center text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--color-dark)",
                    color: "var(--color-bg-primary)",
                  }}
                >
                  Get Started
                </a>
              </motion.div>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
