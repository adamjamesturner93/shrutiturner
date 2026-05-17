import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Menu, X, ChevronDown, CalendarDays, User, Mountain } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/auth-context";
import { IconHorizontal } from "./icon";

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const [servicesDropdownPath, setServicesDropdownPath] = useState<string | null>(null);
  const servicesDropdownRef = useRef<HTMLDivElement>(null);
  const servicesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileMenuOpen = mobileMenuPath === pathname;
  const servicesDropdownOpen = servicesDropdownPath === pathname;

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        servicesDropdownRef.current &&
        !servicesDropdownRef.current.contains(event.target as Node)
      ) {
        setServicesDropdownPath(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setServicesDropdownPath(null);
        setMobileMenuPath(null);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const handleServicesMouseEnter = () => {
    if (servicesTimeoutRef.current) clearTimeout(servicesTimeoutRef.current);
    setServicesDropdownPath(pathname);
  };

  const handleServicesMouseLeave = () => {
    servicesTimeoutRef.current = setTimeout(() => {
      setServicesDropdownPath(null);
    }, 150);
  };

  const servicesLinks = [
    {
      path: "/classes",
      label: "Move Well Classes",
      description: "Adaptive yoga and intelligent strength",
      icon: CalendarDays,
    },
    {
      path: "/coaching",
      label: "Coaching",
      description: "Four tiers of personalised support",
      icon: User,
    },
    {
      path: "/retreats",
      label: "Retreats",
      description: "Immersive multi-day experiences",
      icon: Mountain,
    },
  ];

  const navLinks = [
    { path: "/pricing", label: "Pricing" },
    { path: "/blog", label: "Blog" },
    { path: "/about", label: "About" },
  ];

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center" aria-label="Shruti Turner - Home">
          <div className="h-12">
            <IconHorizontal className="h-full w-auto" />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-6 lg:flex" aria-label="Main navigation">
          {/* Services Dropdown */}
          <div
            ref={servicesDropdownRef}
            className="relative"
            onMouseEnter={handleServicesMouseEnter}
            onMouseLeave={handleServicesMouseLeave}
          >
            <button
              onClick={() => setServicesDropdownPath(servicesDropdownOpen ? null : pathname)}
              aria-expanded={servicesDropdownOpen}
              aria-haspopup="true"
              aria-label="Toggle services menu"
              className={`hover:text-primary flex items-center gap-1 transition-colors ${
                isActive("/classes") ||
                isActive("/schedule") ||
                isActive("/coaching") ||
                isActive("/retreats")
                  ? "text-primary"
                  : "text-foreground"
              }`}
            >
              Services
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  servicesDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {servicesDropdownOpen && (
              <div className="absolute top-full left-1/2 w-80 -translate-x-1/2 pt-2">
                <div className="bg-background space-y-1 rounded-lg border p-2 shadow-lg">
                  {servicesLinks.map((link) => (
                    <Link
                      key={link.path}
                      href={link.path}
                      className="hover:bg-secondary group flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors"
                    >
                      <div className="bg-primary/10 group-hover:bg-primary/20 mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-colors">
                        <link.icon className="text-primary h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-foreground text-sm">{link.label}</span>
                        <p className="text-muted-foreground mt-0.5 text-xs">{link.description}</p>
                      </div>
                    </Link>
                  ))}

                  <div className="bg-border mx-2 h-px" />

                  <Link
                    href="/schedule"
                    className="hover:bg-secondary group flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors"
                  >
                    <div className="bg-primary/10 group-hover:bg-primary/20 mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-colors">
                      <CalendarDays className="text-primary h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-foreground text-sm">Schedule</span>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        View the weekly timetable
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

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
              <Link href="/classes">
                <Button variant="ghost">
                  <CalendarDays className="mr-1.5 h-4 w-4" />
                  Try a Class
                </Button>
              </Link>
              <Link href="/login">
                <Button>Sign In</Button>
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
            {/* Services section */}
            <div className="space-y-1">
              <Link
                href="/classes"
                onClick={() => setMobileMenuPath(null)}
                className={`hover:bg-secondary block rounded-md px-3 py-2 transition-colors ${
                  pathname === "/classes" ? "text-primary bg-secondary" : "text-foreground"
                }`}
              >
                Services
              </Link>
              <div className="space-y-1 pl-4">
                {servicesLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setMobileMenuPath(null)}
                    className={`hover:bg-secondary flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive(link.path) ? "text-primary bg-secondary" : "text-muted-foreground"
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/schedule"
                  onClick={() => setMobileMenuPath(null)}
                  className={`hover:bg-secondary flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive("/schedule") ? "text-primary bg-secondary" : "text-muted-foreground"
                  }`}
                >
                  <CalendarDays className="h-4 w-4" />
                  Schedule
                </Link>
              </div>
            </div>

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
                  <Link href="/login" onClick={() => setMobileMenuPath(null)}>
                    <Button variant="ghost" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/classes" onClick={() => setMobileMenuPath(null)}>
                    <Button variant="outline" className="w-full">
                      <CalendarDays className="mr-1.5 h-4 w-4" />
                      Try a Class
                    </Button>
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
