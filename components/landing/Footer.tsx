export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        backgroundColor: "var(--color-dark)",
        color: "var(--color-bg-primary)",
      }}
    >
      <div className="mx-auto max-w-[var(--max-width)] px-[var(--container-padding)] py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <p className="text-sm font-semibold tracking-tight">Travel AI</p>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: "rgba(247, 247, 245, 0.5)" }}
            >
              Turn travel inspiration into places worth exploring.
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Footer navigation">
            <ul className="flex gap-8">
              {[
                { label: "Analyze", href: "#hero" },
                { label: "About", href: "#about" },
                {
                  label: "GitHub",
                  href: "https://github.com/25Pradnyesh/Travel-AI-",
                  external: true,
                },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    {...(link.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="text-sm transition-colors"
                    style={{
                      color: "rgba(247, 247, 245, 0.5)",
                      transitionDuration: "var(--duration-fast)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color =
                        "rgba(247, 247, 245, 0.9)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color =
                        "rgba(247, 247, 245, 0.5)")
                    }
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom */}
        <div
          className="mt-12 pt-6"
          style={{ borderTop: "1px solid rgba(247, 247, 245, 0.1)" }}
        >
          <p
            className="text-xs"
            style={{ color: "rgba(247, 247, 245, 0.3)" }}
          >
            © {year} Travel AI
          </p>
        </div>
      </div>
    </footer>
  );
}
