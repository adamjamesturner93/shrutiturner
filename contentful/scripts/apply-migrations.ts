import { PUBLIC_CONTENT_MODELS } from "../migrations/001-public-content-models.ts";
import { createClient } from "contentful-management";
import { getContentfulScriptEnv } from "./env.ts";

const { spaceId, environmentId, managementToken } = getContentfulScriptEnv();

const client = createClient({ accessToken: managementToken }, { type: "legacy" });
const CMA_BASE_URL = `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}`;

type ContentTypeLike = {
  name?: string;
  description?: string;
  displayField?: string;
  fields: Array<Record<string, unknown>>;
  update: () => Promise<ContentTypeLike>;
  publish: () => Promise<ContentTypeLike>;
};

type ContentfulEnvironmentLike = {
  getContentType: (id: string) => Promise<ContentTypeLike>;
  createContentTypeWithId: (
    id: string,
    payload: ReturnType<typeof toPayload>
  ) => Promise<ContentTypeLike>;
};

function toPayload(model: (typeof PUBLIC_CONTENT_MODELS)[number]) {
  return {
    name: model.name,
    description: model.description || "",
    displayField: model.displayField,
    fields: model.fields as Array<Record<string, unknown>>,
  };
}

async function upsertAndPublishContentType(
  environment: ContentfulEnvironmentLike,
  model: (typeof PUBLIC_CONTENT_MODELS)[number]
) {
  let contentType: ContentTypeLike;

  const getFieldKey = (field: Record<string, unknown>) => String(field.apiName || field.id || "");

  const toOmittedField = (field: Record<string, unknown>) => ({
    id: String(field.apiName || field.id),
    name: String(field.name || field.apiName || field.id),
    type: String(field.type),
    required: false,
    localized: Boolean(field.localized),
    validations: Array.isArray(field.validations) ? field.validations : [],
    items: field.items as Record<string, unknown> | undefined,
    linkType: field.linkType as string | undefined,
    disabled: true,
    omitted: true,
  });

  try {
    contentType = await environment.getContentType(model.id);

    const incomingFieldKeys = new Set(
      model.fields.map((f) => getFieldKey(f as Record<string, unknown>))
    );
    const removedFields = (contentType.fields as Array<Record<string, unknown>>).filter((field) => {
      const key = getFieldKey(field);
      return key && !incomingFieldKeys.has(key);
    });

    if (removedFields.length > 0) {
      const alreadyOmitted = removedFields.every((field) => Boolean(field.omitted));
      if (!alreadyOmitted) {
        contentType.name = model.name;
        contentType.description = model.description || "";
        contentType.displayField = model.displayField;
        contentType.fields = [...model.fields, ...removedFields.map(toOmittedField)];
        contentType = await contentType.update();
        contentType = await contentType.publish();
        console.log(`Omitted removed fields for content type: ${model.id}`);
      }
    }

    contentType.name = model.name;
    contentType.description = model.description || "";
    contentType.displayField = model.displayField;
    contentType.fields = model.fields;
    contentType = await contentType.update();
    console.log(`Updated content type: ${model.id}`);
  } catch (error: unknown) {
    const err = error as { name?: string; status?: number } | undefined;
    if (err?.name !== "NotFound" && err?.status !== 404) {
      throw error;
    }

    contentType = await environment.createContentTypeWithId(model.id, toPayload(model));
    console.log(`Created content type: ${model.id}`);
  }

  contentType = await contentType.publish();
  console.log(`Published content type: ${model.id}`);
}

async function configureSlugEditor(contentTypeId: string, trackingFieldId: string) {
  const getRes = await fetch(`${CMA_BASE_URL}/content_types/${contentTypeId}/editor_interface`, {
    headers: {
      Authorization: `Bearer ${managementToken}`,
      "Content-Type": "application/vnd.contentful.management.v1+json",
    },
  });

  if (!getRes.ok) {
    const body = await getRes.text();
    throw new Error(
      `Failed to fetch editor interface for ${contentTypeId}: ${getRes.status} ${body}`
    );
  }

  const editorInterface = (await getRes.json()) as {
    sys: { version: number };
    controls?: Array<{
      fieldId: string;
      widgetId: string;
      widgetNamespace?: string;
      settings?: Record<string, unknown>;
    }>;
    editorLayout?: unknown[];
    groupControls?: unknown[];
    sidebar?: unknown[];
    editors?: unknown[];
  };

  const controls = Array.isArray(editorInterface.controls) ? [...editorInterface.controls] : [];
  const idx = controls.findIndex((c) => c.fieldId === "slug");
  const slugControl = {
    fieldId: "slug",
    widgetId: "slugEditor",
    widgetNamespace: "builtin",
    settings: {
      trackingFieldId,
    },
  };

  if (idx >= 0) {
    controls[idx] = {
      ...controls[idx],
      ...slugControl,
      settings: {
        ...(controls[idx].settings || {}),
        ...(slugControl.settings || {}),
      },
    };
  } else {
    controls.push(slugControl);
  }

  const payload: Record<string, unknown> = {
    controls,
  };

  if (editorInterface.editorLayout !== undefined) {
    payload.editorLayout = editorInterface.editorLayout;
  }
  if (editorInterface.groupControls !== undefined && editorInterface.groupControls.length > 0) {
    payload.groupControls = editorInterface.groupControls;
  }
  if (editorInterface.sidebar !== undefined) {
    payload.sidebar = editorInterface.sidebar;
  }
  if (editorInterface.editors !== undefined && editorInterface.editors.length > 0) {
    payload.editors = editorInterface.editors;
  }

  const putRes = await fetch(`${CMA_BASE_URL}/content_types/${contentTypeId}/editor_interface`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${managementToken}`,
      "Content-Type": "application/vnd.contentful.management.v1+json",
      "X-Contentful-Version": String(editorInterface.sys.version),
    },
    body: JSON.stringify(payload),
  });

  if (!putRes.ok) {
    const body = await putRes.text();
    throw new Error(
      `Failed to update editor interface for ${contentTypeId}: ${putRes.status} ${body}`
    );
  }

  console.log(`Configured slug editor for ${contentTypeId} (source: ${trackingFieldId})`);
}

async function run() {
  const space = await client.getSpace(spaceId);
  const environment = (await space.getEnvironment(
    environmentId
  )) as unknown as ContentfulEnvironmentLike;

  for (const model of PUBLIC_CONTENT_MODELS) {
    await upsertAndPublishContentType(environment, model);
  }

  // Auto-generate slugs in the Contentful UI while still allowing manual edits.
  await configureSlugEditor("authorProfile", "name");
  await configureSlugEditor("blogPost", "title");
  await configureSlugEditor("instructorProfile", "name");
  await configureSlugEditor("leadMagnet", "title");
  await configureSlugEditor("newsletterTemplate", "title");
  await configureSlugEditor("retreatScheduleDay", "title");
  await configureSlugEditor("retreatScheduleItem", "title");
}

run().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string } | undefined)?.code;
  console.error(`Migration failed${code ? ` (${code})` : ""}: ${message}`);
  process.exitCode = 1;
});
