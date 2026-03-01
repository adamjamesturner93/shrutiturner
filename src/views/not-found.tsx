"use client";

import Link from "next/link";
import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { ArrowLeft, Search } from "lucide-react";

export function NotFoundPage() {
  return (
    <Layout>
      <SEO
        title="Page Not Found - Shruti Turner"
        description="The page you're looking for doesn't exist. Find your way back to Shruti Turner's strength and yoga coaching."
      />

      <div className="container mx-auto px-4 py-16 max-w-2xl min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>

        <h1 className="text-5xl md:text-6xl mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-2">Page Not Found</p>
        <p className="text-muted-foreground max-w-md mb-8">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Homepage
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/classes">Browse Classes</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/schedule">View Schedule</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
