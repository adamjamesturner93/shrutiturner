import type { LegalDocumentContent } from "@/lib/content/types";
export const POLICY_ADDITIONS = {
  cookies: {
    heading: "Google Analytics preferences",
    paragraphs: [
      "With your permission, we use Google Analytics to understand how people use our public website pages and measure actions such as enquiries, newsletter subscriptions and bookings.",
      "Google Analytics uses cookies and similar technologies. It remains off unless you accept analytics, and we don't use it for personalised advertising.",
      "You can change or withdraw your choice at any time using Analytics preferences in the website footer. Withdrawing consent stops future analytics collection but doesn't delete information already collected.",
    ],
  },
  privacy: {
    heading: "Optional website analytics",
    paragraphs: [
      "With your permission, we use Google Analytics to understand visits to public website pages and measure actions such as successful coaching enquiries, confirmed newsletter subscriptions and bookings.",
      "Google Analytics may receive cookie identifiers, browser and device information, the type of action taken and, for purchases, the amount paid. We do not include names, contact details, health information, free-text form responses or payment card details in our analytics events.",
      "You can change or withdraw your analytics consent through Analytics preferences in the website footer. Withdrawing consent stops future analytics collection but doesn't erase information previously collected.",
    ],
  },
};
export const ANALYTICS_STORAGE_DISCLOSURE = `### Analytics storage and durations

We use a cookie and browser storage to remember your analytics choice for up to 180 days, whether you accept or reject analytics. Other optional analytics storage is used only after you accept.

| Storage | Purpose | Duration |
|---|---|---|
| \`st_analytics\` cookie and \`st-analytics-v1\` browser storage | Remember whether you accept or reject analytics. | Your choice is valid for 180 days. |
| Google Analytics cookies, including \`_ga\` and \`_ga_PT4XP6G7CF\` | Help Google Analytics distinguish browsers and measure website visits. | The \`_ga\` cookie expires up to 180 days after creation. The \`_ga_PT4XP6G7CF\` cookie expires up to 180 days after its latest update. |
| \`st_analytics_receipt\` cookie | Confirm that a newsletter subscription was verified and whether guide delivery was initiated, for optional analytics measurement. | Up to 10 minutes; removed when used. |
| \`st-analytics-attribution-v1\` browser session storage | Remember recognised marketing campaign information or referring website domains during your visit. | Up to 30 minutes from the latest page navigation, within the browser tab session. |
| \`st-analytics-plan\` browser session storage | Remember the coaching plan category you selected. | Up to 30 minutes, within the browser tab session. |
| \`st-ga-sent\` browser storage entries | Help prevent the same conversion being counted repeatedly. | Up to 180 days from the recorded event, or sooner if analytics consent is withdrawn or browser storage is cleared. |

Browser settings may remove this information sooner. These durations describe storage in your browser, not how long Google retains analytics data.

You can change your analytics choice at any time. Withdrawing consent stops future analytics collection but does not erase information already collected.`;

export function validPolicyDate(value: string | undefined) {
  return (
    !!value &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function withAnalyticsPolicy(
  document: LegalDocumentContent,
  publicationDate: string | undefined
): LegalDocumentContent {
  if (!validPolicyDate(publicationDate) || !(document.slug in POLICY_ADDITIONS)) return document;
  const addition = POLICY_ADDITIONS[document.slug as keyof typeof POLICY_ADDITIONS];
  const hasAddition = document.body.includes(addition.heading);
  const needsStorage =
    document.slug === "cookies" && !document.body.includes("### Analytics storage and durations");
  if (hasAddition && !needsStorage) return document;
  const section = `\n\n${hasAddition ? "" : `## ${addition.heading}\n\n${addition.paragraphs.join("\n\n")}\n\n`}${needsStorage ? ANALYTICS_STORAGE_DISCLOSURE + "\n\n" : ""}`;
  // Keep all existing words; place the addition before the following numbered section.
  const anchor = document.slug === "cookies" ? /(?=^##?\s+6[.)]?\s)/m : /(?=^##?\s+7[.)]?\s)/m;
  let index = document.body.search(anchor);
  if (hasAddition && needsStorage) {
    const headingStart = document.body.indexOf(addition.heading);
    const nextHeading = document.body.slice(headingStart).search(/\n##?\s/);
    index = nextHeading < 0 ? document.body.length : headingStart + nextHeading;
  }
  const body =
    index >= 0
      ? document.body.slice(0, index) + section + document.body.slice(index)
      : document.body + section;
  return {
    ...document,
    body,
    version: document.version.endsWith(`+analytics-${publicationDate}`)
      ? document.version
      : `${document.version}+analytics-${publicationDate}`,
    effectiveDate: publicationDate,
  };
}
