import { PUBLIC_CONTENT_MODELS } from "../migrations/001-public-content-models.ts";
import { createClient } from "contentful-management";
import { getContentfulScriptEnv } from "./env.ts";

const { spaceId, environmentId, managementToken } = getContentfulScriptEnv();

const client = createClient(
  { accessToken: managementToken },
  { type: "plain", defaults: { spaceId, environmentId } }
);

type ContentTypeLike = {
  name?: string;
  description?: string;
  displayField?: string;
  fields: Array<Record<string, unknown>>;
};

function toPayload(model: (typeof PUBLIC_CONTENT_MODELS)[number]) {
  return {
    name: model.name,
    description: model.description || "",
    displayField: model.displayField,
    fields: model.fields as Array<Record<string, unknown>>,
  };
}

async function upsertAndPublishContentType(model: (typeof PUBLIC_CONTENT_MODELS)[number]) {
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
    contentType = (await client.contentType.get({
      contentTypeId: model.id,
    })) as unknown as ContentTypeLike;

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
        contentType = (await client.contentType.update(
          { contentTypeId: model.id },
          contentType as never
        )) as unknown as ContentTypeLike;
        contentType = (await client.contentType.publish(
          { contentTypeId: model.id },
          contentType as never
        )) as unknown as ContentTypeLike;
        console.log(`Omitted removed fields for content type: ${model.id}`);
      }
    }

    contentType.name = model.name;
    contentType.description = model.description || "";
    contentType.displayField = model.displayField;
    contentType.fields = model.fields;
    contentType = (await client.contentType.update(
      { contentTypeId: model.id },
      contentType as never
    )) as unknown as ContentTypeLike;
    console.log(`Updated content type: ${model.id}`);
  } catch (error: unknown) {
    const err = error as { name?: string; status?: number } | undefined;
    if (err?.name !== "NotFound" && err?.status !== 404) {
      throw error;
    }

    contentType = (await client.contentType.createWithId(
      { contentTypeId: model.id },
      toPayload(model) as never
    )) as unknown as ContentTypeLike;
    console.log(`Created content type: ${model.id}`);
  }

  contentType = (await client.contentType.publish(
    { contentTypeId: model.id },
    contentType as never
  )) as unknown as ContentTypeLike;
  console.log(`Published content type: ${model.id}`);
}

async function configureSlugEditor(contentTypeId: string, trackingFieldId: string) {
  const editorInterface = (await client.editorInterface.get({
    contentTypeId,
  })) as unknown as {
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

  await client.editorInterface.update({ contentTypeId }, {
    ...editorInterface,
    ...payload,
  } as never);

  console.log(`Configured slug editor for ${contentTypeId} (source: ${trackingFieldId})`);
}

async function run() {
  for (const model of PUBLIC_CONTENT_MODELS) {
    await upsertAndPublishContentType(model);
  }

  // Auto-generate slugs in the Contentful UI while still allowing manual edits.
  await configureSlugEditor("authorProfile", "name");
  await configureSlugEditor("blogPost", "title");
  await configureSlugEditor("instructorProfile", "name");
  await configureSlugEditor("leadMagnet", "title");
  await configureSlugEditor("newsletterTemplate", "title");
}

run().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string } | undefined)?.code;
  console.error(`Migration failed${code ? ` (${code})` : ""}: ${message}`);
  process.exitCode = 1;
});
