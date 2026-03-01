import { PUBLIC_CONTENT_MODELS } from "../migrations/001-public-content-models.ts";

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const ENVIRONMENT = process.env.CONTENTFUL_ENVIRONMENT || "master";
const MANAGEMENT_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN;

if (!SPACE_ID || !MANAGEMENT_TOKEN) {
  throw new Error("Missing CONTENTFUL_SPACE_ID or CONTENTFUL_MANAGEMENT_TOKEN");
}

const baseUrl = `https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENVIRONMENT}`;

async function cma(path: string, init?: RequestInit) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${MANAGEMENT_TOKEN}`,
      "Content-Type": "application/vnd.contentful.management.v1+json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`CMA request failed (${res.status}): ${text}`);
  }

  return res;
}

async function upsertContentType(model: (typeof PUBLIC_CONTENT_MODELS)[number]) {
  const getRes = await cma(`/content_types/${model.id}`);

  if (getRes.status === 404) {
    const createRes = await cma(`/content_types/${model.id}`, {
      method: "PUT",
      body: JSON.stringify(model),
      headers: { "X-Contentful-Version": "0" },
    });

    if (!createRes.ok) {
      throw new Error(`Failed to create content type ${model.id}`);
    }

    console.log(`Created content type: ${model.id}`);
  } else {
    const current = await getRes.json();
    const version = current.sys?.version;

    const updateRes = await cma(`/content_types/${model.id}`, {
      method: "PUT",
      body: JSON.stringify(model),
      headers: { "X-Contentful-Version": String(version) },
    });

    if (!updateRes.ok) {
      throw new Error(`Failed to update content type ${model.id}`);
    }

    console.log(`Updated content type: ${model.id}`);
  }

  const postPublishGet = await cma(`/content_types/${model.id}`);
  const latest = await postPublishGet.json();
  const publishRes = await cma(`/content_types/${model.id}/published`, {
    method: "PUT",
    headers: { "X-Contentful-Version": String(latest.sys?.version) },
  });

  if (!publishRes.ok) {
    throw new Error(`Failed to publish content type ${model.id}`);
  }

  console.log(`Published content type: ${model.id}`);
}

async function run() {
  for (const model of PUBLIC_CONTENT_MODELS) {
    await upsertContentType(model);
  }
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
