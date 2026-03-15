"use client";

import { Layout } from "../components/layout";
import { useI18n } from "../lib/use-i18n";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { SEO } from "../components/seo";
import { ArrowLeft, ArrowRight, Globe, Instagram } from "lucide-react";
import Link from "next/link";
import { BlogReactions } from "@/components/blog-reactions";
import { BlogComments } from "@/components/blog-comments";
import type { BlogPostContent } from "@/lib/content";
import { BlogShare } from "../components/blog-share";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

interface BlogPostPageProps {
  post: BlogPostContent | null;
  posts: BlogPostContent[];
}

function getPostAuthors(post: BlogPostContent) {
  if (post.authors.length > 0) return post.authors;
  if (post.author) {
    return [
      {
        id: post.author,
        slug: post.author.toLowerCase().replace(/\s+/g, "-"),
        name: post.author,
        bio: "",
      },
    ];
  }
  return [];
}

function formatAuthorList(post: BlogPostContent) {
  const authors = getPostAuthors(post).map((author) => author.name);
  if (authors.length <= 1) return authors[0] || "Shruti Turner";
  if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
  return `${authors.slice(0, -1).join(", ")}, and ${authors[authors.length - 1]}`;
}

export function BlogPostPage({ post, posts }: BlogPostPageProps) {
  const { fmtDate } = useI18n();

  if (!post) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="mb-4 text-4xl">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The blog post you&apos;re looking for doesn&apos;t exist.
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

  const relatedPosts = posts
    .filter((p) => p.id !== post.id && p.tags.some((tag) => post.tags.includes(tag)))
    .slice(0, 3);
  const authors = getPostAuthors(post);
  const authorHeading = authors.length > 1 ? "About the Authors" : "About the Author";
  const articleSchemaAuthors = authors.map((author) => ({
    "@type": "Person",
    name: author.name,
    url: author.websiteUrl || "https://shrutiturner.com/about",
    jobTitle: author.role || "Contributor",
  }));

  return (
    <Layout>
      <SEO
        title={`${post.title} - Shruti Turner`}
        description={post.excerpt}
        keywords={post.tags.join(", ")}
        ogType="article"
        canonicalUrl={`https://shrutiturner.com/blog/${post.id}`}
      />

      <article className="py-16 md:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <Link
            href="/blog"
            className="text-muted-foreground hover:text-primary mb-8 inline-flex items-center text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>

          <div className="mb-12 space-y-6">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                  <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>

            <h1 className="text-4xl leading-tight md:text-5xl">{post.title}</h1>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {authors.slice(0, 4).map((author) => (
                    <div
                      key={author.slug}
                      className="border-background bg-brand-warm h-11 w-11 overflow-hidden rounded-full border"
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
                  <p className="text-brand-dark text-sm font-medium">By {formatAuthorList(post)}</p>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                    <span>{fmtDate(post.date)}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </div>
              {authors.some((author) => author.isGuestContributor) ? (
                <Badge variant="outline">Guest Contributor</Badge>
              ) : null}
            </div>

            <BlogShare
              title={post.title}
              excerpt={post.excerpt}
              url={`https://shrutiturner.com/blog/${post.id}`}
            />
          </div>

          <div className="mb-12 overflow-hidden rounded-lg">
            <ImageWithFallback
              src={post.coverImage}
              alt={post.coverAlt}
              className="h-64 w-full object-cover md:h-96"
            />
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="space-y-6 leading-relaxed" style={{ whiteSpace: "pre-line" }}>
              {post.content.split("\n## ").map((section, index) => {
                if (index === 0) {
                  const lines = section.split("\n").filter((line) => line.trim());
                  return (
                    <div key={index} className="space-y-4">
                      {lines.slice(1).map((line, lineIndex) => {
                        if (line.startsWith("### ")) {
                          return (
                            <h3 key={lineIndex} className="mt-8 mb-4 text-2xl">
                              {line.replace("### ", "")}
                            </h3>
                          );
                        }
                        if (line.match(/^\d+\.\s/)) {
                          return (
                            <p key={lineIndex} className="ml-4">
                              {line}
                            </p>
                          );
                        }
                        if (line.startsWith("- ")) {
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

                const [heading, ...content] = section.split("\n").filter((line) => line.trim());
                return (
                  <div key={index} className="space-y-4">
                    <h2 className="mt-12 mb-6 text-3xl">{heading}</h2>
                    {content.map((line, lineIndex) => {
                      if (line.startsWith("### ")) {
                        return (
                          <h3 key={lineIndex} className="mt-8 mb-4 text-2xl">
                            {line.replace("### ", "")}
                          </h3>
                        );
                      }
                      if (line.match(/^\d+\.\s/)) {
                        return (
                          <p key={lineIndex} className="ml-4">
                            {line}
                          </p>
                        );
                      }
                      if (line.startsWith("- ")) {
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

          {authors.length > 0 ? (
            <section className="mt-14 border-t pt-10">
              <div className="mb-6 flex items-center justify-between gap-3">
                <h2 className="text-2xl md:text-3xl">{authorHeading}</h2>
                {authors.length > 1 ? (
                  <Badge variant="secondary">{authors.length} contributors</Badge>
                ) : null}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {authors.map((author) => (
                  <div key={author.slug} className="bg-card rounded-2xl border p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-brand-warm h-16 w-16 overflow-hidden rounded-full">
                        {author.avatarImageUrl ? (
                          <ImageWithFallback
                            src={author.avatarImageUrl}
                            alt={author.avatarAlt || `${author.name} avatar`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="text-brand-dark flex h-full w-full items-center justify-center text-sm font-semibold">
                            {author.name
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl">{author.name}</h3>
                          {author.isGuestContributor ? (
                            <Badge variant="outline">Guest Contributor</Badge>
                          ) : null}
                        </div>
                        {author.role ? (
                          <p className="text-muted-foreground text-sm">{author.role}</p>
                        ) : null}
                        {author.bio ? (
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {author.bio}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap gap-3 pt-2 text-sm">
                          {author.websiteUrl ? (
                            <Link
                              href={author.websiteUrl}
                              className="text-brand-accent inline-flex items-center gap-1 hover:underline"
                            >
                              <Globe className="h-4 w-4" />
                              Website
                            </Link>
                          ) : null}
                          {author.instagramHandle ? (
                            <Link
                              href={
                                author.instagramHandle.startsWith("http")
                                  ? author.instagramHandle
                                  : `https://instagram.com/${author.instagramHandle.replace(/^@/, "")}`
                              }
                              className="text-brand-accent inline-flex items-center gap-1 hover:underline"
                            >
                              <Instagram className="h-4 w-4" />
                              {author.instagramHandle}
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </article>

      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-4xl space-y-10 px-4">
          <div className="flex flex-col items-start justify-between gap-4 border-y py-6 sm:flex-row sm:items-center">
            <p className="text-muted-foreground">
              Found this useful? Share it with someone who might benefit.
            </p>
            <BlogShare
              title={post.title}
              excerpt={post.excerpt}
              url={`https://shrutiturner.com/blog/${post.id}`}
            />
          </div>

          <BlogReactions postId={post.id} />
          <BlogComments postId={post.id} />
        </div>
      </section>

      <section className="bg-secondary/20 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="bg-brand-accent text-brand-white space-y-6 rounded-lg p-8 text-center md:p-12">
            <h3 className="text-2xl md:text-3xl">
              Ready to Build Strength That Works for Your Body?
            </h3>
            <p className="text-lg leading-relaxed opacity-90">
              Whether you&apos;re interested in group classes, 1:1 coaching, or just have a question
              I&apos;d love to hear from you.
            </p>
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90"
              >
                Get in Touch
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {relatedPosts.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container mx-auto max-w-6xl px-4">
            <h3 className="mb-8 text-3xl">Related Articles</h3>
            <div className="grid gap-8 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <article
                  key={relatedPost.id}
                  className="bg-card group overflow-hidden rounded-lg border transition-shadow hover:shadow-lg"
                >
                  <Link href={`/blog/${relatedPost.id}`} className="block overflow-hidden">
                    <ImageWithFallback
                      src={relatedPost.coverImage}
                      alt={relatedPost.coverAlt}
                      className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </Link>
                  <div className="space-y-4 p-6">
                    <div className="flex flex-wrap gap-2">
                      {relatedPost.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <h4 className="leading-tight">
                      <Link
                        href={`/blog/${relatedPost.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {relatedPost.title}
                      </Link>
                    </h4>

                    <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            image: post.coverImage,
            author:
              articleSchemaAuthors.length === 1 ? articleSchemaAuthors[0] : articleSchemaAuthors,
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
