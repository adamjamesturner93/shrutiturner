"use client";

import { Layout } from "../components/layout";
import { blogPosts } from "../data/blog-data";
import type { BlogPostContent } from "@/lib/content";
import { useI18n } from "../lib/use-i18n";
import Link from "next/link";
import { useState, useMemo } from "react";
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

interface BlogPageProps {
  posts?: BlogPostContent[];
}

export function BlogPage({ posts }: BlogPageProps) {
  const blogData = posts ?? blogPosts;
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    blogData.forEach((post) => {
      post.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [blogData]);

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
      <section className="bg-[#2E1F33] text-[#FAFAF8] py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl mb-6 leading-tight">
            Blog & Resources
          </h1>
          <p className="text-xl md:text-2xl text-[#B5C49B] leading-relaxed">
            Evidence-based articles on strength training, yoga, and managing
            chronic conditions.
          </p>
        </div>
      </section>

      {/* Filters and Content */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Filter and Sort Controls */}
          <div className="mb-12 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTag === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag("all")}
              >
                All Articles
              </Button>
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAndSortedPosts.map((post) => (
              <article
                key={post.id}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-card"
              >
                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <h3 className="text-xl leading-tight">
                    <Link href={`/blog/${post.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {post.title}
                    </Link>
                  </h3>

                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
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
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No articles found with the selected filter.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-6">
          <h2 className="text-3xl md:text-4xl">
            Get New Articles in Your Inbox
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Subscribe to blog updates for new research-backed articles on
            strength, movement, and chronic illness management. You can also
            join the newsletter separately for training tips and the free lead
            magnet.
          </p>
          <NewsletterInline defaultList="blog" showListOptions />
        </div>
      </section>
    </Layout>
  );
}
