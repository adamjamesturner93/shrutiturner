import { getContentfulScriptEnv } from "./env.ts";
const { spaceId, environmentId, managementToken } = getContentfulScriptEnv();
const apply = process.argv.includes("--apply");
const base = `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}/content_types/blogPost`;
async function request(url: string, method = "GET", body?: unknown, version?: number) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${managementToken}`,
      "Content-Type": "application/vnd.contentful.management.v1+json",
      ...(version === undefined ? {} : { "X-Contentful-Version": String(version) }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Contentful ${method}: ${response.status}`);
  return response.json();
}
const model = await request(base);
const fields = model.fields as Array<{ id: string; type: string; required?: boolean }>;
const additions = [
  {
    id: "emailSubject",
    name: "Publication email subject (optional)",
    type: "Symbol",
    required: false,
  },
  {
    id: "emailHeading",
    name: "Publication email heading (optional)",
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
  const existing = fields.find((item) => item.id === field.id);
  if (existing && (existing.type !== field.type || existing.required))
    throw new Error(`Incompatible field: ${field.id}`);
}
const missing = additions.filter((field) => !fields.some((item) => item.id === field.id));
console.log(
  `${environmentId}: ${missing.length} optional blog email fields to add (${apply ? "apply" : "dry run"}).`
);
if (missing.length && apply) {
  if (model.sys.version !== model.sys.publishedVersion + 1)
    throw new Error("Review unpublished schema changes first.");
  const updated = await request(
    base,
    "PUT",
    {
      name: model.name,
      description: model.description,
      displayField: model.displayField,
      fields: [...fields, ...missing],
    },
    model.sys.version
  );
  await request(`${base}/published`, "PUT", undefined, updated.sys.version);
}
