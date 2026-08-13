import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/auth-context";
import { IconHorizontal } from "./icon";

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const mobileMenuOpen = mobileMenuPath === pathname;

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const navLinks = [
    { path: "/about", label: "About" },
    { path: "/coaching", label: "Coaching" },
    { path: "/blog", label: "Blog" },
  ];

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
        <Link href="/" className="flex items-center" aria-label="Shruti Turner - Home">
          <div className="h-14 sm:h-16">
            <IconHorizontal className="h-full w-auto" />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-6 lg:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`hover:text-primary transition-colors ${
                isActive(link.path) ? "text-primary" : "text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center space-x-3 lg:flex">
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button>
                <span className="mr-2">{user?.avatarInitials || "?"}</span>
                My Studio
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/coaching/enquire">
                <Button>Enquire</Button>
              </Link>
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground px-2 py-2 text-sm transition-colors"
              >
                Client Login
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden"
          onClick={() => setMobileMenuPath(mobileMenuOpen ? null : pathname)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-main-menu"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div id="mobile-main-menu" className="bg-background border-t lg:hidden">
          <nav className="container mx-auto flex flex-col space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setMobileMenuPath(null)}
                className={`hover:bg-secondary block rounded-md px-3 py-2 transition-colors ${
                  isActive(link.path) ? "text-primary bg-secondary" : "text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="flex flex-col space-y-2 border-t pt-4">
              {isAuthenticated ? (
                <Link href="/dashboard" onClick={() => setMobileMenuPath(null)}>
                  <Button className="w-full">My Studio</Button>
                </Link>
              ) : (
                <>
                  <Link href="/coaching/enquire" onClick={() => setMobileMenuPath(null)}>
                    <Button className="w-full">Enquire</Button>
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuPath(null)}
                    className="text-muted-foreground hover:bg-secondary hover:text-foreground rounded-md px-3 py-2 text-center text-sm transition-colors"
                  >
                    Client Login
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
