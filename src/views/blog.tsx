"use client";

import { Layout } from "../components/layout";
import type { BlogPostContent } from "@/lib/content";
import { useI18n } from "../lib/use-i18n";
import Link from "next/link";
import { useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { NewsletterInline } from "../components/newsletter";
import { MarketingSection, SectionHeading } from "@/components/marketing/sections";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { getAuthorLabel, getPostAuthors } from "@/lib/blog/view-model";
import { filterAndSortPosts, resolveSelectedTag } from "@/lib/blog/listing";

interface BlogPageProps {
  posts?: BlogPostContent[];
}

export function BlogPage({ posts }: BlogPageProps) {
  const blogData = useMemo(() => posts ?? [], [posts]);
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

  const selectedTag = useMemo(() => {
    return resolveSelectedTag(searchParams.get("tag"), allTags);
  }, [searchParams, allTags]);

  const handleSetTag = (tag: string) => {
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
    return filterAndSortPosts(blogData, selectedTag, sortBy as "newest" | "oldest" | "a-z");
  }, [selectedTag, sortBy, blogData]);

  const { fmtDate } = useI18n();

  const formatDate = (dateString: string) => {
    return fmtDate(dateString);
  };

  return (
    <Layout>
      <section className="marketing-grid text-brand-white overflow-hidden px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-6xl">
          <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-brand-accent-light text-xs tracking-[0.3em] uppercase">
                Blog & Resources
              </p>
              <h1 className="mt-4 text-4xl leading-[1.08] tracking-[-0.03em] md:text-5xl">
                Evidence-based writing for people training with more context.
              </h1>
              <p className="text-brand-white/80 mt-5 max-w-2xl text-lg leading-relaxed md:text-[1.35rem]">
                Strength training, yoga, pain, hypermobility, pacing, and chronic-illness-aware
                decision-making without generic wellness language.
              </p>
            </div>

            <div className="marketing-panel rounded-[2rem] p-6 md:p-7">
              <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">
                What you&apos;ll find here
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  "Training decisions for fluctuating bodies",
                  "Adaptation-first strength and yoga guidance",
                  "Practical breakdowns of pain, pacing, and progression",
                  "Clearer thinking for people tired of oversimplified advice",
                ].map((item) => (
                  <div
                    key={item}
                    className="border-brand-dark/10 bg-background text-muted-foreground rounded-[1.35rem] border px-4 py-4 text-sm leading-relaxed"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-wash py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="marketing-panel mb-10 rounded-[1.75rem] p-5 md:p-6">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
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
                  <SelectTrigger
                    id="blog-sort"
                    aria-label="Sort blog posts by"
                    className="w-[150px]"
                  >
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
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedPosts.map((post) => (
              <article
                key={post.id}
                className="bg-card group border-brand-dark/10 overflow-hidden rounded-[1.75rem] border shadow-[0_20px_50px_rgba(46,31,51,0.06)] transition-shadow hover:shadow-lg"
              >
                <Link href={`/blog/${post.id}`} className="block overflow-hidden">
                  <ImageWithFallback
                    src={post.coverImage}
                    alt={post.coverAlt}
                    className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>

                <div className="space-y-4 p-6">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[11px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <h3 className="text-2xl leading-tight">
                    <Link
                      href={`/blog/${post.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {post.title}
                    </Link>
                  </h3>

                  <p className="text-muted-foreground text-sm leading-relaxed">{post.excerpt}</p>

                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {getPostAuthors(post)
                        .slice(0, 3)
                        .map((author) => (
                          <div
                            key={author.slug}
                            className="border-background bg-brand-warm h-9 w-9 overflow-hidden rounded-full border"
                          >
                            {author.avatarImageUrl ? (
                              <ImageWithFallback
                                src={author.avatarImageUrl}
                                alt={author.avatarAlt || `${author.name} avatar`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="text-brand-dark flex h-full w-full items-center justify-center text-xs font-medium">
                                {author.name
                                  .split(" ")
                                  .map((part) => part[0])
                                  .join("")
                                  .slice(0, 2)}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                    <div className="min-w-0">
                      <p className="text-brand-dark truncate text-sm font-medium">
                        {getAuthorLabel(post)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {getPostAuthors(post).length > 1 ? "Contributors" : "Author"}
                      </p>
                    </div>
                  </div>

                  <div className="text-muted-foreground flex items-center justify-between border-t pt-2 text-sm">
                    <span>{formatDate(post.date)}</span>
                    <span>{post.readTime}</span>
                  </div>

                  <Link href={`/blog/${post.id}`}>
                    <Button variant="ghost" className="w-full justify-between">
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

      <MarketingSection className="section-divider" compact contentClassName="max-w-4xl">
        <div className="marketing-panel rounded-[2rem] p-8 text-center md:p-10">
          <SectionHeading
            eyebrow="Newsletter"
            title="Get new articles in your inbox."
            description="Get new articles, class updates, and practical training insights for chronic illness support."
            align="center"
          />
          <div className="mt-8">
            <NewsletterInline />
          </div>
        </div>
      </MarketingSection>
    </Layout>
  );
}
