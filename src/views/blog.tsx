"use client";

import { Layout } from "../components/layout";
import type { BlogPostContent } from "@/lib/content";
import { useI18n } from "../lib/use-i18n";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { NewsletterInline } from "../components/newsletter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

interface BlogPageProps {
  posts?: BlogPostContent[];
}

export function BlogPage({ posts }: BlogPageProps) {
  const blogData = posts ?? [];
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    blogData.forEach((post) => {
      post.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [blogData]);

  useEffect(() => {
    const tagParam = searchParams.get("tag");
    if (!tagParam) {
      setSelectedTag("all");
      return;
    }

    const matched = allTags.find((tag) => tag.toLowerCase() === tagParam.toLowerCase());
    setSelectedTag(matched || "all");
  }, [searchParams, allTags]);

  const handleSetTag = (tag: string) => {
    setSelectedTag(tag);

    const params = new URLSearchParams(searchParams.toString());
    if (tag === "all") {
      params.delete("tag");
    } else {
      params.set("tag", tag);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let posts = [...blogData];

    // Filter by tag
    if (selectedTag !== "all") {
      posts = posts.filter((post) => post.tags.includes(selectedTag));
    }

    // Sort
    if (sortBy === "newest") {
      posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortBy === "oldest") {
      posts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (sortBy === "a-z") {
      posts.sort((a, b) => a.title.localeCompare(b.title));
    }

    return posts;
  }, [selectedTag, sortBy, blogData]);

  const { fmtDate } = useI18n();

  const formatDate = (dateString: string) => {
    return fmtDate(dateString);
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-[#2E1F33] py-20 text-[#FAFAF8] md:py-28">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-6 text-4xl leading-tight md:text-6xl">Blog & Resources</h1>
          <p className="text-xl leading-relaxed text-[#B5C49B] md:text-2xl">
            Evidence-based articles on strength training, yoga, and managing chronic conditions.
          </p>
        </div>
      </section>

      {/* Filters and Content */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Filter and Sort Controls */}
          <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTag === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSetTag("all")}
              >
                All Articles
              </Button>
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSetTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="a-z">A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Blog Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedPosts.map((post) => (
              <article
                key={post.id}
                className="bg-card overflow-hidden rounded-lg border transition-shadow hover:shadow-lg"
              >
                <Link href={`/blog/${post.id}`} className="block overflow-hidden">
                  <ImageWithFallback
                    src={post.coverImage}
                    alt={post.coverAlt}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>

                <div className="space-y-4 p-6">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <h3 className="text-xl leading-tight">
                    <Link
                      href={`/blog/${post.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {post.title}
                    </Link>
                  </h3>

                  <p className="text-muted-foreground text-sm leading-relaxed">{post.excerpt}</p>

                  <div className="text-muted-foreground flex items-center justify-between border-t pt-2 text-sm">
                    <span>{formatDate(post.date)}</span>
                    <span>{post.readTime}</span>
                  </div>

                  <Link href={`/blog/${post.id}`}>
                    <Button variant="ghost" className="w-full">
                      Read Article
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {filteredAndSortedPosts.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No articles found with the selected filter.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-secondary/20 py-16 md:py-20">
        <div className="container mx-auto max-w-3xl space-y-6 px-4 text-center">
          <h2 className="text-3xl md:text-4xl">Get New Articles in Your Inbox</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Get new articles, class updates, and practical training insights for chronic illness
            support.
          </p>
          <NewsletterInline />
        </div>
      </section>
    </Layout>
  );
}
