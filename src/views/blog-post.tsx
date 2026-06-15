"use client";

import { Fragment } from "react";
import { Layout } from "../components/layout";
import { useI18n } from "../lib/use-i18n";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { MarketingSection } from "@/components/marketing/sections";
import { SEO } from "../components/seo";
import { ArrowLeft, ArrowRight, Globe, Instagram } from "lucide-react";
import Link from "next/link";
import { BlogReactions } from "@/components/blog-reactions";
import { BlogComments } from "@/components/blog-comments";
import { PublicBreadcrumbs } from "@/components/public-breadcrumbs";
import type { BlogPostContent } from "@/lib/content/types";
import { BlogShare } from "../components/blog-share";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  formatAuthorList,
  getBlogPostContextualCta,
  getPostAuthors,
  getRelatedPosts,
  type BlogPostContextualCta,
} from "@/lib/blog/view-model";
import { renderInlineMarkdown } from "@/lib/blog/inline-markdown";

interface BlogPostPageProps {
  post: BlogPostContent;
  posts: BlogPostContent[];
}

export function BlogPostPage({ post, posts }: BlogPostPageProps) {
  const { fmtDate } = useI18n();

  const relatedPosts = getRelatedPosts(post, posts);
  const authors = getPostAuthors(post);
  const authorHeading = authors.length > 1 ? "About the Authors" : "About the Author";
  const contextualCta = getBlogPostContextualCta(post);
  const articleSchemaAuthors = authors.map((author) => ({
    "@type": "Person",
    name: author.name,
    url: author.websiteUrl || "https://shrutiturner.co.uk/about",
    jobTitle: author.role || "Contributor",
  }));

  return (
    <Layout>
      <SEO
        title={`${post.title} - Shruti Turner`}
        description={post.excerpt}
        keywords={post.tags.join(", ")}
        ogType="article"
        canonicalUrl={`https://shrutiturner.co.uk/blog/${post.id}`}
      />

      <section className="marketing-grid text-brand-white overflow-hidden px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-6xl">
          <div className="grid items-start gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <Link
                href="/blog"
                className="text-brand-white/70 hover:text-brand-accent-light inline-flex items-center text-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>

              <PublicBreadcrumbs
                inverted
                className="mt-6"
                items={[
                  { name: "Home", href: "/" },
                  { name: "Blog", href: "/blog" },
                  { name: post.title, href: `/blog/${post.id}` },
                ]}
              />

              <div className="mt-6 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                    <Badge
                      variant="secondary"
                      className="border-brand-white/10 bg-brand-white/8 text-brand-white hover:bg-brand-white/12 cursor-pointer border"
                    >
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl leading-[1.08] tracking-[-0.03em] md:text-5xl">
                {post.title}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {authors.slice(0, 4).map((author) => (
                      <div
                        key={author.slug}
                        className="border-brand-dark bg-brand-warm h-11 w-11 overflow-hidden rounded-full border"
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
                    <p className="text-brand-white text-sm font-medium">
                      By {formatAuthorList(post)}
                    </p>
                    <div className="text-brand-white/70 flex flex-wrap items-center gap-2 text-sm">
                      <span>{fmtDate(post.date)}</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
                {authors.some((author) => author.isGuestContributor) ? (
                  <Badge variant="outline" className="border-brand-white/20 text-brand-white/80">
                    Guest Contributor
                  </Badge>
                ) : null}
              </div>

              <div className="mt-7">
                <BlogShare
                  title={post.title}
                  excerpt={post.excerpt}
                  url={`https://shrutiturner.co.uk/blog/${post.id}`}
                />
              </div>
            </div>

            <div className="border-brand-white/10 bg-brand-white/8 overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <ImageWithFallback
                src={post.coverImage}
                alt={post.coverAlt}
                className="h-full max-h-[28rem] w-full rounded-[1.45rem] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <MarketingSection className="section-wash" contentClassName="max-w-4xl">
        <article className="marketing-panel rounded-[2rem] p-6 md:p-8">
          <div className="prose prose-lg max-w-none">
            <div className="space-y-6 leading-relaxed" style={{ whiteSpace: "pre-line" }}>
              {post.content.split("\n## ").map((section, index) => {
                if (index === 0) {
                  const lines = section.split("\n").filter((line) => line.trim());
                  return (
                    <Fragment key={index}>
                      <div className="space-y-4">
                        {lines.map((line, lineIndex) => {
                          if (line.startsWith("### ")) {
                            return (
                              <h3 key={lineIndex} className="mt-8 mb-4 text-2xl">
                                {renderInlineMarkdown(line.replace("### ", ""))}
                              </h3>
                            );
                          }
                          if (line.match(/^\d+\.\s/)) {
                            return (
                              <p key={lineIndex} className="ml-4">
                                {renderInlineMarkdown(line)}
                              </p>
                            );
                          }
                          if (line.startsWith("- ")) {
                            return (
                              <p key={lineIndex} className="ml-4">
                                {renderInlineMarkdown(line)}
                              </p>
                            );
                          }
                          return <p key={lineIndex}>{renderInlineMarkdown(line)}</p>;
                        })}
                      </div>
                    </Fragment>
                  );
                }

                const [heading, ...content] = section.split("\n").filter((line) => line.trim());
                return (
                  <Fragment key={index}>
                    <div className="space-y-4">
                      <h2 className="mt-12 mb-6 text-3xl">{renderInlineMarkdown(heading)}</h2>
                      {content.map((line, lineIndex) => {
                        if (line.startsWith("### ")) {
                          return (
                            <h3 key={lineIndex} className="mt-8 mb-4 text-2xl">
                              {renderInlineMarkdown(line.replace("### ", ""))}
                            </h3>
                          );
                        }
                        if (line.match(/^\d+\.\s/)) {
                          return (
                            <p key={lineIndex} className="ml-4">
                              {renderInlineMarkdown(line)}
                            </p>
                          );
                        }
                        if (line.startsWith("- ")) {
                          return (
                            <p key={lineIndex} className="ml-4">
                              {renderInlineMarkdown(line)}
                            </p>
                          );
                        }
                        return <p key={lineIndex}>{renderInlineMarkdown(line)}</p>;
                      })}
                    </div>
                    {index === 1 ? <ContextualPostCta cta={contextualCta} /> : null}
                  </Fragment>
                );
              })}
            </div>
          </div>
        </article>

        {authors.length > 0 ? (
          <section className="mt-10">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-2xl md:text-3xl">{authorHeading}</h2>
              {authors.length > 1 ? (
                <Badge variant="secondary">{authors.length} contributors</Badge>
              ) : null}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {authors.map((author) => (
                <div
                  key={author.slug}
                  className="bg-card border-brand-dark/10 rounded-[1.6rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)]"
                >
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
      </MarketingSection>

      <MarketingSection compact contentClassName="max-w-4xl">
        <div className="space-y-8">
          <div className="marketing-panel flex flex-col items-start justify-between gap-4 rounded-[1.75rem] p-6 sm:flex-row sm:items-center">
            <p className="text-muted-foreground">
              Found this useful? Share it with someone who might benefit.
            </p>
            <BlogShare
              title={post.title}
              excerpt={post.excerpt}
              url={`https://shrutiturner.co.uk/blog/${post.id}`}
            />
          </div>

          <BlogReactions postId={post.id} />
          <BlogComments postId={post.id} />
        </div>
      </MarketingSection>

      <MarketingSection className="section-wash" compact contentClassName="max-w-4xl">
        <div className="bg-brand-accent text-brand-white space-y-6 rounded-[2rem] p-8 text-center md:p-10">
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
      </MarketingSection>

      {relatedPosts.length > 0 && (
        <MarketingSection compact contentClassName="max-w-6xl">
          <h3 className="mb-8 text-3xl">Related Articles</h3>
          <div className="grid gap-8 md:grid-cols-3">
            {relatedPosts.map((relatedPost) => (
              <article
                key={relatedPost.id}
                className="bg-card group border-brand-dark/10 overflow-hidden rounded-[1.75rem] border shadow-[0_20px_50px_rgba(46,31,51,0.06)] transition-shadow hover:shadow-lg"
              >
                <Link href={`/blog/${relatedPost.id}`} className="block overflow-hidden">
                  <ImageWithFallback
                    src={relatedPost.coverImage}
                    alt={relatedPost.coverAlt}
                    className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
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

                  <h4 className="text-xl leading-tight">
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
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      Read Article
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </MarketingSection>
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
              url: "https://shrutiturner.co.uk",
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://shrutiturner.co.uk/blog/${post.id}`,
            },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://shrutiturner.co.uk",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Blog",
                  item: "https://shrutiturner.co.uk/blog",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: post.title,
                  item: `https://shrutiturner.co.uk/blog/${post.id}`,
                },
              ],
            },
          }),
        }}
      />
    </Layout>
  );
}

function ContextualPostCta({ cta }: { cta: BlogPostContextualCta }) {
  return (
    <aside className="border-brand-accent/20 bg-brand-warm/35 not-prose my-10 rounded-2xl border p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-brand-dark text-2xl">{cta.title}</h2>
          <p className="text-muted-foreground leading-relaxed">{cta.body}</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href={cta.href}>
            {cta.label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </aside>
  );
}
