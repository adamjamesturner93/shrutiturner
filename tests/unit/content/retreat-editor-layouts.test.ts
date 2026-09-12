import { describe, expect, it } from "vitest";
import { PUBLIC_CONTENT_MODELS } from "../../../contentful/migrations/001-public-content-models";
import { RETREAT_EDITOR_LAYOUTS } from "../../../contentful/migrations/retreat-editor-layouts";
describe("retreat editorial sections", () => {
  it.each(["retreatTemplate", "retreatVenue"])(
    "groups every visible %s field exactly once",
    (id) => {
      const model = PUBLIC_CONTENT_MODELS.find((model) => model.id === id)!;
      const visible = model.fields
        .filter((field) => !("disabled" in field && field.disabled))
        .map((field) => field.id)
        .sort();
      const grouped = RETREAT_EDITOR_LAYOUTS[id]
        .flatMap((group) => group.items.map((item) => ("fieldId" in item ? item.fieldId : "")))
        .sort();
      expect(grouped).toEqual(visible);
    }
  );
});
