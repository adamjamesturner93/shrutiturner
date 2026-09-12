export const DEFAULT_BLOG_EMAIL_INTRODUCTION =
  "I've just published a new post on my blog I thought you'd be interested in.";

export function getBlogEmailCopy(input: {
  title: string;
  firstName: string;
  subject?: string;
  introduction?: string;
}) {
  const personalize = (value: string) =>
    value.replace(/\{\{\s*firstName\s*\}\}|\{name\}/gi, () => input.firstName || "there");
  return {
    subject: personalize(input.subject?.trim() || `New blog post: ${input.title}`).replace(
      /[\r\n]+/g,
      " "
    ),
    introduction: personalize(input.introduction?.trim() || DEFAULT_BLOG_EMAIL_INTRODUCTION),
  };
}
