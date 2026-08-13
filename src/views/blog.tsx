"use client";

import { Layout } from "../components/layout";
import type { BlogPostContent } from "@/lib/content/types";
import { useI18n } from "../lib/use-i18n";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/components/ui/utils";
import { getAuthorLabel, getPostAuthors } from "@/lib/blog/view-model";
import {
  filterAndSortPosts,
  paginatePosts,
  resolveBlogPillar,
  resolveSelectedPillar,
  resolveSelectedTag,
  type BlogPillar,
} from "@/lib/blog/listing";

interface BlogPageProps {
  posts?: BlogPostContent[];
}

const BLOG_PAGE_SIZE = 6;

export function BlogPage({ posts }: BlogPageProps) {
  const blogData = useMemo(() => posts ?? [], [posts]);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
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

  const selectedPillar = useMemo(
    () => resolveSelectedPillar(searchParams.get("pillar")),
    [searchParams]
  );

  const selectedTag = useMemo(() => {
    if (selectedPillar !== "all") return "all";
    return resolveSelectedTag(searchParams.get("tag"), allTags);
  }, [searchParams, allTags, selectedPillar]);

  useEffect(() => {
    if (selectedTag !== "all") setMoreFiltersOpen(true);
  }, [selectedTag]);

  const replaceFilters = (next: { pillar?: BlogPillar; tag?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("pillar");
    params.delete("tag");
    if (next.pillar) params.set("pillar", next.pillar);
    if (next.tag) params.set("tag", next.tag);
    const query = params.toString();
    setCurrentPage(1);
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleSetTag = (tag: string) => {
    replaceFilters(tag === "all" ? {} : { tag });
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    return filterAndSortPosts(
      blogData,
      selectedTag,
      sortBy as "newest" | "oldest" | "a-z",
      debouncedSearch,
      selectedPillar
    );
  }, [selectedTag, selectedPillar, sortBy, blogData, debouncedSearch]);

  const featuredPost = filteredAndSortedPosts[0] || null;
  const recentPosts = useMemo(() => filteredAndSortedPosts.slice(1), [filteredAndSortedPosts]);
  const paginatedPosts = useMemo(
    () => paginatePosts(recentPosts, currentPage, BLOG_PAGE_SIZE),
    [recentPosts, currentPage]
  );

  const { fmtDate } = useI18n();

  const formatDate = (dateString: string) => {
    return fmtDate(dateString);
  };

  const renderPostCard = (post: BlogPostContent) => (
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
        <Badge variant="secondary" className="w-fit text-[11px]">
          {resolveBlogPillar(post)}
        </Badge>

        <h3 className="text-2xl leading-tight">
          <Link href={`/blog/${post.id}`} className="hover:text-primary transition-colors">
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
            <p className="text-brand-dark truncate text-sm font-medium">{getAuthorLabel(post)}</p>
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
  );

  return (
    <Layout showFooterNewsletter={false}>
      <section className="marketing-grid text-brand-white overflow-hidden px-4 py-8 md:py-10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid items-center gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-brand-accent-light text-xs tracking-[0.3em] uppercase">
                Blog & Resources
              </p>
              <h1 className="mt-3 text-[2.25rem] leading-[1.08] tracking-[-0.03em] sm:text-4xl md:text-[2.75rem]">
                Evidence based health and movement posts.
              </h1>
              <p className="text-brand-white/80 mt-4 max-w-2xl text-base leading-relaxed md:text-lg">
                Making science accessible without the jargon or fluff, just clear explanations to
                empower you to understand your body.
              </p>
            </div>

            <div className="marketing-panel rounded-[1.75rem] p-4 md:p-5">
              <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">
                What you&apos;ll find here
              </p>
              <div className="mt-4 grid gap-3">
                {[
                  {
                    title: "Understand your body.",
                    description: "Accessible explanations of pain, recovery and movement.",
                  },
                  {
                    title: "Train with more confidence.",
                    description: "Practical guidance for strength and fitness.",
                  },
                  {
                    title: "Make informed decisions.",
                    description: "Research translated into real-world choices.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="border-brand-dark/10 bg-background text-muted-foreground rounded-[1.2rem] border px-4 py-2.5 text-sm leading-relaxed"
                  >
                    <p className="text-foreground text-base">{item.title}</p>
                    <p className="mt-0.5">{item.description}</p>
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
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-4">
                <div className="relative max-w-xl">
                  <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search articles"
                    aria-label="Search articles"
                    className="pl-9"
                  />
                </div>
                <div className="flex flex-wrap gap-2" aria-label="Filter articles by category">
                  <Button
                    variant={
                      selectedTag === "all" && selectedPillar === "all" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => replaceFilters({})}
                  >
                    All Articles
                  </Button>
                  {(["rehabilitation", "fitness", "wellbeing"] as BlogPillar[]).map((pillar) => (
                    <Button
                      key={pillar}
                      variant={selectedPillar === pillar ? "default" : "outline"}
                      size="sm"
                      onClick={() => replaceFilters({ pillar })}
                    >
                      {pillar}
                    </Button>
                  ))}
                </div>
                <Collapsible open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" aria-label="Show more article filters">
                      More filters
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          moreFiltersOpen && "rotate-180"
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="flex flex-wrap gap-2" aria-label="Filter articles by topic">
                      {allTags.map((tag) => (
                        <Button
                          key={tag}
                          variant={selectedTag === tag ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSetTag(tag)}
                        >
                          {tag.toLocaleLowerCase("en-GB")}
                        </Button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Sort by:</span>
                <Select
                  value={sortBy}
                  onValueChange={(value) => {
                    setSortBy(value);
                    setCurrentPage(1);
                  }}
                >
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

          {featuredPost ? (
            <article className="bg-card border-brand-dark/10 mb-10 overflow-hidden rounded-[1.75rem] border shadow-[0_20px_50px_rgba(46,31,51,0.06)]">
              <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                <Link
                  href={`/blog/${featuredPost.id}`}
                  className="relative block min-h-[18rem] overflow-hidden lg:min-h-0"
                >
                  <ImageWithFallback
                    src={featuredPost.coverImage}
                    alt={featuredPost.coverAlt}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </Link>
                <div className="flex flex-col justify-center space-y-5 p-6 md:p-8">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Featured</Badge>
                    <Badge variant="outline">{resolveBlogPillar(featuredPost)}</Badge>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl leading-tight md:text-4xl">
                      <Link
                        href={`/blog/${featuredPost.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {featuredPost.title}
                      </Link>
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">{featuredPost.excerpt}</p>
                  </div>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                    <span>{getAuthorLabel(featuredPost)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDate(featuredPost.date)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{featuredPost.readTime}</span>
                  </div>
                  <Link href={`/blog/${featuredPost.id}`} className="w-fit">
                    <Button>Read featured article</Button>
                  </Link>
                </div>
              </div>
            </article>
          ) : null}

          {filteredAndSortedPosts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No articles found for the selected filter or search.
              </p>
            </div>
          ) : null}

          {paginatedPosts.items.length > 0 ? (
            <>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">
                    Recent articles
                  </p>
                  <h2 className="mt-2 text-2xl md:text-3xl">More from the blog</h2>
                </div>
                <p className="text-muted-foreground text-sm">
                  Page {paginatedPosts.currentPage} of {paginatedPosts.totalPages}
                </p>
              </div>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {paginatedPosts.items.map((post) => renderPostCard(post))}
              </div>
              {paginatedPosts.totalPages > 1 ? (
                <nav
                  className="mt-8 flex items-center justify-center gap-3"
                  aria-label="Blog pagination"
                >
                  <Button
                    variant="outline"
                    disabled={paginatedPosts.currentPage === 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={paginatedPosts.currentPage === paginatedPosts.totalPages}
                    onClick={() =>
                      setCurrentPage((page) => Math.min(paginatedPosts.totalPages, page + 1))
                    }
                  >
                    Next
                  </Button>
                </nav>
              ) : null}
            </>
          ) : null}
        </div>
      </section>

      <MarketingSection className="section-divider" compact contentClassName="max-w-4xl">
        <div className="marketing-panel rounded-[2rem] p-8 text-center md:p-10">
          <SectionHeading
            eyebrow="Newsletter"
            title="Join the newsletter."
            description="Get new articles, coaching notes and practical ideas for movement, strength and wellbeing, plus the free guide “Why Some Bodies Need Strength Before More Stretching”."
            align="center"
          />
          <div className="mt-8">
            <NewsletterInline buttonLabel="Join the newsletter" />
          </div>
        </div>
      </MarketingSection>
    </Layout>
  );
}
