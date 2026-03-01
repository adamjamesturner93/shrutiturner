"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Layout } from "../components/layout";
import { blogPosts } from "../data/blog-data";
import { useI18n } from "../lib/use-i18n";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { BlogPostContent } from "@/lib/content";

interface BlogPostPageProps {
  post?: BlogPostContent | null;
  posts?: BlogPostContent[];
}

export function BlogPostPage({ post: postProp, posts }: BlogPostPageProps) {
  const { id } = useParams<{ id: string }>();
  const postList = posts ?? blogPosts;
  const post = postProp ?? postList.find((p) => p.id === id);
  const { fmtDate } = useI18n();

  if (!post) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The blog post you're looking for doesn't exist.
          </p>
          <Link href="/blog">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString: string) => {
    return fmtDate(dateString);
  };

  // Get related posts (same tags, excluding current post)
  const relatedPosts = postList
    .filter((p) => p.id !== post.id && p.tags.some((tag) => post.tags.includes(tag)))
    .slice(0, 3);

  return (
    <Layout>
      {/* Article Header */}
      <article className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>

          <div className="space-y-6 mb-12">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            <h1 className="text-4xl md:text-5xl leading-tight">{post.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <span>By {post.author}</span>
              <span>•</span>
              <span>{formatDate(post.date)}</span>
              <span>•</span>
              <span>{post.readTime}</span>
            </div>
          </div>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            <div
              className="space-y-6 leading-relaxed"
              style={{
                whiteSpace: "pre-line",
              }}
            >
              {post.content.split("\n## ").map((section, index) => {
                if (index === 0) {
                  // First section with h1
                  const lines = section.split("\n").filter((line) => line.trim());
                  return (
                    <div key={index} className="space-y-4">
                      {lines.slice(1).map((line, lineIndex) => {
                        if (line.startsWith("### ")) {
                          return (
                            <h3 key={lineIndex} className="text-2xl mt-8 mb-4">
                              {line.replace("### ", "")}
                            </h3>
                          );
                        } else if (line.match(/^\d+\.\s/)) {
                          return (
                            <p key={lineIndex} className="ml-4">
                              {line}
                            </p>
                          );
                        } else if (line.startsWith("- ")) {
                          return (
                            <p key={lineIndex} className="ml-4">
                              {line}
                            </p>
                          );
                        }
                        return <p key={lineIndex}>{line}</p>;
                      })}
                    </div>
                  );
                }

                // Subsequent sections with h2
                const [heading, ...content] = section.split("\n").filter((line) => line.trim());
                return (
                  <div key={index} className="space-y-4">
                    <h2 className="text-3xl mt-12 mb-6">{heading}</h2>
                    {content.map((line, lineIndex) => {
                      if (line.startsWith("### ")) {
                        return (
                          <h3 key={lineIndex} className="text-2xl mt-8 mb-4">
                            {line.replace("### ", "")}
                          </h3>
                        );
                      } else if (line.match(/^\d+\.\s/)) {
                        return (
                          <p key={lineIndex} className="ml-4">
                            {line}
                          </p>
                        );
                      } else if (line.startsWith("- ")) {
                        return (
                          <p key={lineIndex} className="ml-4">
                            {line}
                          </p>
                        );
                      }
                      return <p key={lineIndex}>{line}</p>;
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </article>

      {/* CTA Sidebar/Bottom */}
      <section className="bg-secondary/20 py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-[#4B5B32] text-[#FAFAF8] rounded-lg p-8 md:p-12 text-center space-y-6">
            <h3 className="text-2xl md:text-3xl">
              Ready to Build Strength That Works for Your Body?
            </h3>
            <p className="text-lg opacity-90 leading-relaxed">
              Whether you're interested in group classes, 1:1 coaching, or just
              have a question — I'd love to hear from you.
            </p>
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-[#B5C49B] text-[#2E1F33] hover:bg-[#a5b48b]"
              >
                Get in Touch
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <h3 className="text-3xl mb-8">Related Articles</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <article
                  key={relatedPost.id}
                  className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-card"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {relatedPost.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <h4 className="leading-tight">
                      <Link href={`/blog/${relatedPost.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {relatedPost.title}
                      </Link>
                    </h4>

                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                      {relatedPost.excerpt}
                    </p>

                    <Link href={`/blog/${relatedPost.id}`}>
                      <Button variant="ghost" size="sm" className="w-full">
                        Read Article
                      </Button>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Article Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            author: {
              "@type": "Person",
              name: post.author,
              url: "https://shrutiturner.com/about",
              jobTitle: "Strength & Yoga Coach",
              knowsAbout: ["Biomechanics", "Rehabilitation", "Chronic Illness", "Yoga", "Strength Training"],
            },
            datePublished: post.date,
            publisher: {
              "@type": "Organization",
              name: "Shruti Turner",
              url: "https://shrutiturner.com",
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://shrutiturner.com/blog/${post.id}`,
            },
          }),
        }}
      />
    </Layout>
  );
}
