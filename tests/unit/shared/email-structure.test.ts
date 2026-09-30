import { describe, expect, it } from "vitest";
import { render } from "@react-email/render";
import { readdirSync, writeFileSync } from "node:fs";
import { emailFixtures, emailVariants } from "./email-fixtures";

describe("all email templates", () => {
  it("keeps the rendering inventory complete", () => {
    const files = readdirSync("src/emails")
      .filter((file) => file.endsWith(".tsx"))
      .map((file) => file.replace(/\.tsx$/, ""))
      .sort();
    expect(emailFixtures.map((fixture) => fixture.name).sort()).toEqual(files);
  });

  for (const { name, element } of [...emailFixtures, ...emailVariants]) {
    it(`${name} has branded structure, accessible headings and a plain-text alternative`, async () => {
      const html = await render(element);
      const text = await render(element, { plainText: true });
      if (process.env.EMAIL_PREVIEW_DIR)
        writeFileSync(`${process.env.EMAIL_PREVIEW_DIR}/${name}.html`, html);
      expect(html).toContain('lang="en"');
      expect(html).toContain("/logos/logo-white-horizontal-email.png");
      expect(html).toContain('alt="Shruti Turner"');
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      expect(html).toContain("email-content");
      expect(html).toContain("email-footer");
      expect(html).toContain("@media only screen and (max-width: 480px)");
      expect(html).not.toMatch(/(?:href|src)="(?:undefined|null|#|)"/);
      expect(html).not.toContain("Private Studio");
      expect(text).toContain("Shruti Turner");
      expect(text.length).toBeGreaterThan(100);
      expect(html).not.toContain("#a0a098");
    });
  }
});
