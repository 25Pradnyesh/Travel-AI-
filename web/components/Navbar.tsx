"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import MobileMenu from "@/components/navigation/MobileMenu";

const NAV_LINKS = [
  { label: "Analyze", href: "#hero" },
  { label: "Explore", href: "#how-it-works" },
  { label: "About", href: "#about" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-colors ${
          scrolled
            ? "border-b bg-[rgba(247,245,240,0.85)] backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
        style={{
          borderColor: scrolled ? "var(--color-border)" : "transparent",
          transitionDuration: "var(--duration-normal)",
          transitionTimingFunction: "var(--ease-out)",
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-[var(--max-width)] items-center justify-between px-[var(--container-padding)] py-4">
          {/* Logo */}
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
            aria-label="Travel AI — Home"
          >
            Travel AI
          </Link>

          {/* Desktop Center Links */}
          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm transition-colors"
                style={{
                  color: "var(--color-text-secondary)",
                  transitionDuration: "var(--duration-fast)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--color-text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--color-text-secondary)")
                }
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Right */}
          <div className="hidden items-center gap-5 md:flex">
            <a
              href="https://github.com/25Pradnyesh/Travel-AI-"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm transition-colors"
              style={{
                color: "var(--color-text-secondary)",
                transitionDuration: "var(--duration-fast)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--color-text-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--color-text-secondary)")
              }
            >
              GitHub
            </a>
            <a
              href="#hero"
              className="rounded-md px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--color-dark)",
                color: "var(--color-bg-primary)",
                transitionDuration: "var(--duration-fast)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "var(--color-dark-secondary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--color-dark)")
              }
            >
              Get Started
            </a>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setMobileOpen(true)}
            className="flex items-center justify-center md:hidden"
            style={{ color: "var(--color-text-primary)" }}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" />
          </motion.button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={NAV_LINKS}
      />
    </>
  );
}
