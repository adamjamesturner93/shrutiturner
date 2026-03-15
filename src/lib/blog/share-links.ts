export function buildBlogShareLinks(input: { url: string; title: string; excerpt?: string }) {
  const encodedUrl = encodeURIComponent(input.url);
  const encodedTitle = encodeURIComponent(input.title);
  const encodedExcerpt = encodeURIComponent(input.excerpt || "");

  return {
    x: `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedExcerpt}%0A%0A${encodedUrl}`,
  };
}
