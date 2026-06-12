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
        noIndex
      />

      <div className="container mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
        <div className="bg-secondary mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
          <Search className="text-muted-foreground h-8 w-8" />
        </div>

        <h1 className="mb-4 text-5xl md:text-6xl">404</h1>
        <p className="text-muted-foreground mb-2 text-xl">Page Not Found</p>
        <p className="text-muted-foreground mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Homepage
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/coaching">Explore Coaching</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/blog">Read the Blog</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
