import { Header } from "./header";
import { Footer } from "./footer";
import { ScrollToTop } from "./scroll-to-top";
import { NewsletterPopup } from "./newsletter";
import { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface LayoutProps {
  children: ReactNode;
}

const NO_POPUP_PATHS = ["/login", "/dashboard", "/unsubscribe", "/subscribe"];

export function Layout({ children }: LayoutProps) {
  const [showPopup, setShowPopup] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Don't show on auth/dashboard pages
    if (NO_POPUP_PATHS.some((p) => pathname.startsWith(p))) return;

    // Only show once per session
    if (sessionStorage.getItem("newsletter_shown")) return;

    let scrollThreshold = 0;
    let resizeObserver: ResizeObserver | null = null;

    const updateScrollThreshold = () => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      scrollThreshold = maxScroll * 0.4;
    };

    const handleScroll = () => {
      if (window.scrollY > scrollThreshold) {
        setShowPopup(true);
        sessionStorage.setItem("newsletter_shown", "true");
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", updateScrollThreshold);
        resizeObserver?.disconnect();
      }
    };

    // Also trigger after 45 seconds
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem("newsletter_shown")) {
        setShowPopup(true);
        sessionStorage.setItem("newsletter_shown", "true");
      }
    }, 45000);

    updateScrollThreshold();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateScrollThreshold, { passive: true });

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateScrollThreshold);
      resizeObserver.observe(document.body);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateScrollThreshold);
      resizeObserver?.disconnect();
      clearTimeout(timer);
    };
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:px-4 focus:py-2"
      >
        Skip to main content
      </a>
      <ScrollToTop />
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
      <NewsletterPopup isOpen={showPopup} onClose={() => setShowPopup(false)} />
    </div>
  );
}
