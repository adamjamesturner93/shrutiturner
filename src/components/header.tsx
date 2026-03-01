import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import {
  Menu,
  X,
  ChevronDown,
  Heart,
  Dumbbell,
  Users,
  CalendarDays,
  User,
  Mountain,
  MessageCircle,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/auth-context";

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const servicesDropdownRef = useRef<HTMLDivElement>(null);
  const servicesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        setServicesDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setServicesDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleServicesMouseEnter = () => {
    if (servicesTimeoutRef.current) clearTimeout(servicesTimeoutRef.current);
    setServicesDropdownOpen(true);
  };

  const handleServicesMouseLeave = () => {
    servicesTimeoutRef.current = setTimeout(() => {
      setServicesDropdownOpen(false);
    }, 150);
  };

  const servicesLinks = [
    {
      path: "/classes/yoga",
      label: "Yoga Classes",
      description: "Rehabilitation-informed yoga",
      icon: Heart,
    },
    {
      path: "/classes/strength",
      label: "Strength Classes",
      description: "Evidence-based resistance training",
      icon: Dumbbell,
    },
    {
      path: "/classes/small-groups",
      label: "Small Group Programs",
      description: "Focused cohorts, max 6 people",
      icon: Users,
    },
    {
      path: "/pt",
      label: "1:1 Training",
      description: "Personalised coaching sessions",
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl tracking-tight">Shruti Turner</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-6">
          {/* Services Dropdown */}
          <div
            ref={servicesDropdownRef}
            className="relative"
            onMouseEnter={handleServicesMouseEnter}
            onMouseLeave={handleServicesMouseLeave}
          >
            <button
              onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
              className={`flex items-center gap-1 transition-colors hover:text-primary ${
                isActive("/classes") || isActive("/schedule") || isActive("/pt") || isActive("/retreats")
                  ? "text-primary"
                  : "text-foreground"
              }`}
            >
              Services
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  servicesDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {servicesDropdownOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-80">
                <div className="bg-background border rounded-lg shadow-lg p-2 space-y-1">
                  {/* All Classes link */}
                  <Link href="/classes"
                    className="block px-3 py-2 rounded-md text-sm hover:bg-secondary transition-colors"
                  >
                    <span className="text-foreground">All Classes</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Overview of all class types
                    </p>
                  </Link>

                  <div className="h-px bg-border mx-2" />

                  {servicesLinks.map((link) => (
                    <Link
                      key={link.path}
                      href={link.path}
                      className="flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-secondary transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                        <link.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm text-foreground">
                          {link.label}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {link.description}
                        </p>
                      </div>
                    </Link>
                  ))}

                  <div className="h-px bg-border mx-2" />

                  <Link href="/schedule"
                    className="flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-secondary transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                      <CalendarDays className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm text-foreground">
                        Schedule
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
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
              className={`transition-colors hover:text-primary ${
                isActive(link.path) ? "text-primary" : "text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center space-x-3">
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button>
                <span className="mr-2">{user?.avatarInitials || "?"}</span>
                My Studio
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/contact">
                <Button>
                  <MessageCircle className="w-4 h-4 mr-1.5" />
                  Get in Touch
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <nav className="container mx-auto px-4 py-4 flex flex-col space-y-1">
            {/* Services section */}
            <div className="space-y-1">
              <Link href="/classes"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md transition-colors hover:bg-secondary ${
                  pathname === "/classes"
                    ? "text-primary bg-secondary"
                    : "text-foreground"
                }`}
              >
                Services
              </Link>
              <div className="pl-4 space-y-1">
                {servicesLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors hover:bg-secondary ${
                      isActive(link.path)
                        ? "text-primary bg-secondary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                ))}
                <Link href="/schedule"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors hover:bg-secondary ${
                    isActive("/schedule")
                      ? "text-primary bg-secondary"
                      : "text-muted-foreground"
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Schedule
                </Link>
              </div>
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md transition-colors hover:bg-secondary ${
                  isActive(link.path)
                    ? "text-primary bg-secondary"
                    : "text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-4 border-t flex flex-col space-y-2">
              {isAuthenticated ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">My Studio</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">
                      <MessageCircle className="w-4 h-4 mr-1.5" />
                      Get in Touch
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
