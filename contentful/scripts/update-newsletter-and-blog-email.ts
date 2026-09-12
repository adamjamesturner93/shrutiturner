import { getContentfulScriptEnv } from "./env.ts";

const { spaceId, environmentId, managementToken } = getContentfulScriptEnv();
const apply = process.argv.includes("--apply");
const base = `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}`;
type CmsRecord = {
  sys: { id: string; version: number; publishedVersion?: number };
  fields: Record<string, Record<string, unknown>>;
};
async function request(path: string, method = "GET", body?: unknown, version?: number) {
  const response = await fetch(`${base}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${managementToken}`,
      "Content-Type": "application/vnd.contentful.management.v1+json",
      ...(version === undefined ? {} : { "X-Contentful-Version": String(version) }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Contentful ${method} ${path}: HTTP ${response.status} ${JSON.stringify(error.details || error.message)}`
    );
  }
  return response.json();
}

const signupList = await request(
  "entries?content_type=newsletterSignupContent&fields.slug=default"
);
if (signupList.items?.length !== 1) throw new Error("Expected one default newsletter entry");
const signup = signupList.items[0] as CmsRecord;
const locales = await request("locales");
const locale = locales.items.find((item: { default: boolean }) => item.default)?.code as string;
if (!locale) throw new Error("Missing default locale");
const link = signup.fields.activeLeadMagnet?.[locale] as { sys?: { id?: string } };
if (!link?.sys?.id) throw new Error("Missing active guide");
const guide = (await request(`entries/${link.sys.id}`)) as CmsRecord;
const headline = "Been told to be careful with exercise because of pain, injury or illness?";
const description =
  "Learn how to train intelligently, rebuild confidence and build strength in a way that works with your body.";
const title =
  "Rebuild Your Strength: How to train intelligently with chronic illness, pain or injury.";

// Preserve all other fields/locales and never publish an entry with unrelated draft edits.
async function updateDraft(entry: CmsRecord, changes: Record<string, string>) {
  const fields = { ...entry.fields };
  for (const [key, value] of Object.entries(changes))
    fields[key] = { ...fields[key], [locale]: value };
  if (apply) await request(`entries/${entry.sys.id}`, "PUT", { fields }, entry.sys.version);
  console.log(`${apply ? "Saved draft" : "Would update draft"}: ${entry.sys.id}`);
}

const blog = await request("content_types/blogPost");
const additions = [
  {
    id: "emailSubject",
    name: "Publication email subject (optional)",
    type: "Symbol",
    required: false,
  },
  {
    id: "emailIntroduction",
    name: "Publication email introduction (optional)",
    type: "Text",
    required: false,
  },
];
for (const field of additions) {
  const existing = blog.fields.find((item: { id: string }) => item.id === field.id);
  if (existing && (existing.type !== field.type || existing.required))
    throw new Error(`Incompatible existing field: ${field.id}`);
}
const missing = additions.filter(
  (field) => !blog.fields.some((item: { id: string }) => item.id === field.id)
);
if (missing.length && blog.sys.version !== blog.sys.publishedVersion + 1)
  throw new Error("Blog schema has unpublished edits; review before applying");
console.log(`Environment: ${environmentId}; optional blog fields to add: ${missing.length}`);
if (apply && missing.length) {
  const updated = await request(
    "content_types/blogPost",
    "PUT",
    {
      name: blog.name,
      description: blog.description,
      displayField: blog.displayField,
      fields: [...blog.fields, ...missing],
    },
    blog.sys.version
  );
  await request("content_types/blogPost/published", "PUT", undefined, updated.sys.version);
}
await updateDraft(guide, {
  title,
  hookText: headline,
  landingHeadline: headline,
  landingDescription: description,
  ctaLabel: "Get the free guide",
  assetUrl: "https://shrutiturner.co.uk/guides/rebuild-your-strength.pdf",
  emailSubject: "Your free guide: Rebuild Your Strength",
  emailBody: `Hi {{firstName}},\n\nThanks for joining. Here is your guide: ${title}\n\n{{leadMagnetLink}}\n\nShruti`,
});
await updateDraft(signup, {
  buttonLabel: "Get the free guide",
  popupTitle: headline,
  popupDescription: description,
});
console.log("No entries published and no publication emails triggered.");
