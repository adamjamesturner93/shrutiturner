"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";

const LAST_UPDATED_LABEL = "12 March 2026";

export function CookiesPage() {
  return (
    <Layout>
      <SEO
        title="Cookie Policy - Shruti Turner"
        description="Information about how Shruti Turner uses cookies and similar tracking technologies."
        canonicalUrl="https://shrutiturner.co.uk/cookies"
      />

      <div className="container mx-auto max-w-4xl px-4 py-16">
        <h1 className="mb-8 text-4xl md:text-5xl">Cookie Policy</h1>

        <div className="prose prose-lg text-muted-foreground max-w-none space-y-8">
          <p className="text-sm italic">Last updated: {LAST_UPDATED_LABEL}</p>

          <p className="text-lg">
            <em>
              Note: This page will be managed through the CMS. The following is placeholder content
              that should be reviewed and updated based on actual cookies used on the site.
            </em>
          </p>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files placed on your device when you visit a website. They help
              websites remember your preferences and improve your experience.
            </p>
            <p>
              We use cookies and similar technologies (like local storage and pixels) on our
              website.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">2. How We Use Cookies</h2>
            <p>We use cookies to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Remember your login status</li>
              <li>Keep you signed in between sessions</li>
              <li>Remember your preferences and settings</li>
              <li>Understand how you use our website</li>
              <li>Improve website functionality and performance</li>
              <li>Deliver relevant content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">3. Types of Cookies We Use</h2>

            <h3 className="text-foreground mb-3 text-xl">3.1 Essential Cookies (Required)</h3>
            <p>
              These cookies are necessary for the website to function. They enable basic features
              like page navigation, secure areas and payment processing. The website cannot
              function properly without these cookies.
            </p>
            <div className="bg-secondary/30 my-4 rounded-lg p-4">
              <p className="text-sm">
                <strong>Examples:</strong>
                <br />• Session cookies (expire when you close your browser)
                <br />• Authentication cookies (keep you logged in)
                <br />• Security cookies (protect against fraud)
              </p>
            </div>

            <h3 className="text-foreground mt-6 mb-3 text-xl">3.2 Analytics Cookies (Optional)</h3>
            <p>
              These cookies help us understand how visitors use our website. We use this information
              to improve the website and user experience.
            </p>
            <div className="bg-secondary/30 my-4 rounded-lg p-4">
              <p className="text-sm">
                <strong>We may use:</strong>
                <br />• Google Analytics (anonymized IP addresses)
                <br />• First-party analytics
                <br />
                <strong>Purpose:</strong> Track page views, time on site, navigation patterns
                <br />
                <strong>Retention:</strong> Up to 26 months
              </p>
            </div>

            <h3 className="text-foreground mt-6 mb-3 text-xl">3.3 Functional Cookies (Optional)</h3>
            <p>
              These cookies enable enhanced functionality and personalization, like remembering your
              preferences.
            </p>
            <div className="bg-secondary/30 my-4 rounded-lg p-4">
              <p className="text-sm">
                <strong>Examples:</strong>
                <br />• Language preferences
                <br />• Region selection
                <br />• User interface preferences
              </p>
            </div>

            <h3 className="text-foreground mt-6 mb-3 text-xl">3.4 Marketing Cookies (Optional)</h3>
            <p>
              These cookies track your activity across websites to deliver relevant advertising. We
              only use marketing cookies with your consent.
            </p>
            <div className="bg-secondary/30 my-4 rounded-lg p-4">
              <p className="text-sm">
                <strong>We may use:</strong>
                <br />• Social media pixels (Facebook, Instagram)
                <br />• Advertising platforms (Google Ads)
                <br />
                <strong>Purpose:</strong> Show relevant ads, measure campaign effectiveness
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">4. Third-Party Cookies</h2>
            <p>Some cookies are set by third-party services that appear on our pages:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Stripe:</strong> Payment processing (essential for transactions)
              </li>
              <li>
                <strong>Google Analytics:</strong> Website analytics (if you consent)
              </li>
              <li>
                <strong>Social media platforms:</strong> If you interact with embedded content
              </li>
              <li>
                <strong>Email service provider:</strong> To track newsletter engagement
              </li>
            </ul>
            <p className="mt-4">
              These third parties have their own privacy policies. We don't control these cookies.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">5. Managing Your Cookie Preferences</h2>

            <h3 className="text-foreground mb-3 text-xl">5.1 Cookie Banner</h3>
            <p>
              When you first visit our website, you'll see a cookie banner where you can accept or
              decline optional cookies. You can change your preferences at any time.
            </p>

            <h3 className="text-foreground mt-6 mb-3 text-xl">5.2 Browser Settings</h3>
            <p>
              You can control cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>See what cookies are stored</li>
              <li>Delete cookies</li>
              <li>Block cookies from specific sites</li>
              <li>Block all cookies</li>
            </ul>
            <div className="bg-secondary/30 my-4 rounded-lg p-4">
              <p className="text-sm">
                <strong>Browser help pages:</strong>
                <br />
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Chrome
                </a>{" "}
                |{" "}
                <a
                  href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Firefox
                </a>{" "}
                |{" "}
                <a
                  href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Safari
                </a>{" "}
                |{" "}
                <a
                  href="https://support.microsoft.com/en-us/windows/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Edge
                </a>
              </p>
            </div>
            <p className="mt-4">
              Note: Blocking all cookies may affect website functionality. Some features may not
              work properly.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">6. Do Not Track Signals</h2>
            <p>
              Some browsers have "Do Not Track" features. Currently, there is no universal standard
              for how websites should respond to these signals. We do not currently respond to Do
              Not Track signals, but you can manage cookies through the methods described above.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">7. Cookie List & Details</h2>
            <p className="text-sm italic">
              Below is a detailed list of cookies we use (this would be auto-generated in
              production):
            </p>

            <div className="my-6 overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="p-3 text-left font-medium">Cookie Name</th>
                    <th className="p-3 text-left font-medium">Purpose</th>
                    <th className="p-3 text-left font-medium">Type</th>
                    <th className="p-3 text-left font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3">session_id</td>
                    <td className="p-3">User session management</td>
                    <td className="p-3">Essential</td>
                    <td className="p-3">Session</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-3">auth_token</td>
                    <td className="p-3">Keep user logged in</td>
                    <td className="p-3">Essential</td>
                    <td className="p-3">30 days</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-3">_ga</td>
                    <td className="p-3">Google Analytics - visitor tracking</td>
                    <td className="p-3">Analytics</td>
                    <td className="p-3">2 years</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-3">cookie_consent</td>
                    <td className="p-3">Remember cookie preferences</td>
                    <td className="p-3">Essential</td>
                    <td className="p-3">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">8. Changes to This Policy</h2>
            <p>
              We may update this cookie policy periodically. Changes will be posted on this page
              with an updated date.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">9. More Information</h2>
            <p>
              For more information about how we use your data, see our{" "}
              <a href="/privacy" className="text-primary underline">
                Privacy Policy
              </a>
              .
            </p>
            <p className="mt-4">
              If you have questions about cookies, contact us at:{" "}
              <a href="mailto:privacy@shrutiturner.com" className="text-primary underline">
                privacy@shrutiturner.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
