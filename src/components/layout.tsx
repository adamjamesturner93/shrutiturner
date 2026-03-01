import { Header } from "./header";
import { Footer } from "./footer";
import { ScrollToTop } from "./scroll-to-top";
import { NewsletterPopup } from "./newsletter";
import { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface LayoutProps {
  children: ReactNode;
}

const NO_POPUP_PATHS = ["/login", "/signup", "/dashboard", "/unsubscribe"];

export function Layout({ children }: LayoutProps) {
  const [showPopup, setShowPopup] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Don't show on auth/dashboard pages
    if (NO_POPUP_PATHS.some((p) => pathname.startsWith(p))) return;

    // Only show once per session
    if (sessionStorage.getItem("newsletter_shown")) return;

    const handleScroll = () => {
      const scrollPercent =
        window.scrollY /
        (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPercent > 0.4) {
        setShowPopup(true);
        sessionStorage.setItem("newsletter_shown", "true");
        window.removeEventListener("scroll", handleScroll);
      }
    };

    // Also trigger after 45 seconds
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem("newsletter_shown")) {
        setShowPopup(true);
        sessionStorage.setItem("newsletter_shown", "true");
      }
    }, 45000);

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md"
      >
        Skip to main content
      </a>
      <ScrollToTop />
      <Header />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
      <NewsletterPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
      />
    </div>
  );
}
