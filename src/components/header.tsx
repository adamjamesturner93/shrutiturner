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
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl tracking-tight">Shruti Turner</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-6 lg:flex">
          {/* Services Dropdown */}
          <div
            ref={servicesDropdownRef}
            className="relative"
            onMouseEnter={handleServicesMouseEnter}
            onMouseLeave={handleServicesMouseLeave}
          >
            <button
              onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
              className={`hover:text-primary flex items-center gap-1 transition-colors ${
                isActive("/classes") ||
                isActive("/schedule") ||
                isActive("/pt") ||
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
                  {/* All Classes link */}
                  <Link
                    href="/classes"
                    className="hover:bg-secondary block rounded-md px-3 py-2 text-sm transition-colors"
                  >
                    <span className="text-foreground">All Classes</span>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Overview of all class types
                    </p>
                  </Link>

                  <div className="bg-border mx-2 h-px" />

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
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/contact">
                <Button>
                  <MessageCircle className="mr-1.5 h-4 w-4" />
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
        <div className="bg-background border-t lg:hidden">
          <nav className="container mx-auto flex flex-col space-y-1 px-4 py-4">
            {/* Services section */}
            <div className="space-y-1">
              <Link
                href="/classes"
                onClick={() => setMobileMenuOpen(false)}
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
                    onClick={() => setMobileMenuOpen(false)}
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
                  onClick={() => setMobileMenuOpen(false)}
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
                onClick={() => setMobileMenuOpen(false)}
                className={`hover:bg-secondary block rounded-md px-3 py-2 transition-colors ${
                  isActive(link.path) ? "text-primary bg-secondary" : "text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="flex flex-col space-y-2 border-t pt-4">
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
                      <MessageCircle className="mr-1.5 h-4 w-4" />
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
