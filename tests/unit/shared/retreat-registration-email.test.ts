import { createElement } from "react";
import { render } from "@react-email/render";
import { expect, it } from "vitest";
import RetreatRegistrationEmail from "@/emails/retreat-registration";
it("uses the branded layout and a private attendee setup action", async () => {
  const html = await render(
    createElement(RetreatRegistrationEmail, {
      name: "Alex",
      title: "Test workshop",
      url: "https://example.test/setup",
    })
  );
  expect(html).toContain("Your place at Test workshop");
  expect(html).toContain("Complete my attendee setup");
  expect(html).toContain('href="https://example.test/setup"');
  expect(html).toContain("not your private answers");
  expect(html.toLowerCase()).toContain("#4b5b32");
});
