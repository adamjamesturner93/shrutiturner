"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";

const LAST_UPDATED_LABEL = "6 April 2026";

export function PrivacyPage() {
  return (
    <Layout>
      <SEO
        title="Privacy Policy - Shruti Turner"
        description="Privacy policy explaining how Shruti Turner collects, uses, and protects your personal information."
        canonicalUrl="https://shrutiturner.com/privacy"
      />

      <div className="container mx-auto max-w-4xl px-4 py-16">
        <h1 className="mb-8 text-4xl md:text-5xl">Privacy Policy</h1>

        <div className="prose prose-lg text-muted-foreground max-w-none space-y-8">
          <p className="text-sm italic">Last updated: {LAST_UPDATED_LABEL}</p>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">1. Introduction</h2>
            <p>
              Shruti Turner (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) provides strength,
              yoga, retreat, and coaching services. This policy explains what personal information
              we collect, why we use it, who can access it, and how long we keep it.
            </p>
            <p>
              We are the data controller for the personal information processed through this
              platform. We work to the UK GDPR, the Data Protection Act 2018, and related UK privacy
              and electronic marketing rules.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">2. Information We Collect</h2>

            <h3 className="text-foreground mb-3 text-xl">2.1 Information You Provide</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Contact information:</strong> Name, email address, phone number
              </li>
              <li>
                <strong>Newsletter signup information:</strong> First name, email address, consent
                wording, consent timestamp, verification status, unsubscribe status, and related
                delivery metadata when you join the mailing list or request a lead magnet
              </li>
              <li>
                <strong>Health and participation information:</strong> Context you choose to share
                so we can adapt movement, class, retreat, and coaching delivery more safely
              </li>
              <li>
                <strong>Emergency contact details:</strong> For retreat bookings and other in-person
                services where needed for participant safety
              </li>
              <li>
                <strong>Payment information:</strong> Processed securely through Stripe (we do not
                store card details)
              </li>
              <li>
                <strong>Dietary requirements:</strong> Food allergies and related retreat/event
                information
              </li>
            </ul>

            <h3 className="text-foreground mt-6 mb-3 text-xl">
              2.2 Information Collected Automatically
            </h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Website usage:</strong> Pages visited, time spent, browser type, device
                information
              </li>
              <li>
                <strong>Cookies:</strong> See our{" "}
                <a href="/cookies" className="text-primary underline">
                  Cookie Policy
                </a>{" "}
                for details
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Provide services:</strong> Deliver coaching, classes, retreats, and other
                services you've purchased
              </li>
              <li>
                <strong>Adapt delivery safely:</strong> Adjust classes, programmes, retreats, and
                coaching based on the minimum relevant information you share with us
              </li>
              <li>
                <strong>Process payments:</strong> Handle billing and transactions
              </li>
              <li>
                <strong>Communicate:</strong> Send booking confirmations, program details, and
                service updates
              </li>
              <li>
                <strong>Newsletter and updates:</strong> Send marketing emails only where you have
                opted in, requested launch updates, or confirmed a double opt-in email
              </li>
              <li>
                <strong>Safety:</strong> Support safer participation during physical activities
              </li>
              <li>
                <strong>Improve services:</strong> Analyze usage to enhance our offerings
              </li>
              <li>
                <strong>Legal compliance:</strong> Meet regulatory and legal obligations
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">4. Legal Basis for Processing</h2>
            <p>We process your data on the following legal bases:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Contract:</strong> To set up and deliver the memberships, bookings,
                retreats, programmes, gifts, and coaching services you request
              </li>
              <li>
                <strong>Consent:</strong> For marketing emails and, where relied upon, for
                special-category health information used to support safer participation. You can
                withdraw consent at any time, although we may then be unable to continue a service
                that depends on that information.
              </li>
              <li>
                <strong>Legitimate interests:</strong> To run and improve the platform, prevent
                misuse, and keep appropriate operational records
              </li>
              <li>
                <strong>Legal obligation:</strong> To comply with legal requirements
              </li>
            </ul>
            <p>
              Where health information is processed, our Article 6 basis is usually contract,
              legitimate interests, or legal obligation depending on the service context. Our
              Article 9 condition is explicit consent where we rely on the health information you
              provide for safe participation and programme adaptation.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">5. Sharing Your Information</h2>
            <p>We do not sell your personal information. We may share it with:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Service providers:</strong> Stripe (payment processing), email service
                providers including Postmark, website hosting, and Contentful for controlled content
                and newsletter campaign operations
              </li>
              <li>
                <strong>Emergency contacts:</strong> In case of medical emergencies during services
              </li>
              <li>
                <strong>Medical professionals:</strong> Only with your explicit consent
              </li>
              <li>
                <strong>Legal authorities:</strong> If required by law
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">6. Sensitive Personal Data</h2>
            <p>
              We only ask for health information that is relevant to safer participation,
              adaptation, safeguarding, and operational support. We do not collect health
              information to diagnose, monitor, or treat you as a patient.
            </p>
            <p>
              Full health detail is restricted to the minimum number of authorised staff who need it
              for service delivery, safeguarding, privacy handling, or dispute resolution. In
              instructor-facing operational views we aim to show only the minimum derived safety
              context needed for the assigned session, run, or retreat date.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">7. Data Security</h2>
            <p>We protect your information through:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Encrypted data transmission (SSL/TLS)</li>
              <li>Secure password-protected systems</li>
              <li>Limited access to personal information</li>
              <li>Regular security assessments</li>
              <li>Secure payment processing through Stripe</li>
            </ul>
            <p>
              While we implement strong security measures, no system is 100% secure. We cannot
              guarantee absolute security of your data.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">8. Data Retention</h2>
            <p>We retain your information:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Health and special-category service information:</strong> Health profiles,
                retreat health details, and coaching check-in answers are retained for up to 24
                months after they are last needed operationally, then deleted or cleared from the
                live service
              </li>
              <li>
                <strong>Billing, account, and legal records:</strong> Core account, booking,
                transaction, and compliance records may be kept for longer where needed for tax,
                accounting, dispute handling, fraud prevention, or legal obligations
              </li>
              <li>
                <strong>Newsletter subscribers:</strong> Active subscriber records are kept until
                you unsubscribe. Pending verification records and related tokens are routinely
                cleared when they expire or are no longer needed for launch communications
              </li>
              <li>
                <strong>Website visitors:</strong> Analytics data aggregated and anonymized after 26
                months
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">9. Your Rights</h2>
            <p>Under GDPR, you have the right to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Rectification:</strong> Correct inaccurate information
              </li>
              <li>
                <strong>Erasure:</strong> Request deletion of your data (subject to legal
                obligations)
              </li>
              <li>
                <strong>Restriction:</strong> Limit how we process your data
              </li>
              <li>
                <strong>Portability:</strong> Receive your data in a portable format
              </li>
              <li>
                <strong>Object:</strong> Object to processing based on legitimate interests
              </li>
              <li>
                <strong>Withdraw consent:</strong> For processing based on consent
              </li>
            </ul>
            <p>
              To exercise these rights, contact us at{" "}
              <a href="mailto:privacy@shrutiturner.com" className="text-primary underline">
                privacy@shrutiturner.com
              </a>
              . Privacy requests are fulfilled by an owner-admin workflow in the platform and may be
              limited where we must retain records for legal, tax, accounting, fraud, audit, or
              active dispute reasons.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">10. Marketing Emails</h2>
            <p>
              We send newsletters, launch updates, lead magnet delivery emails, and occasional
              promotional emails only where you have actively opted in or completed a double opt-in
              confirmation step under UK marketing rules.
            </p>
            <p>
              For the holding-page launch, we collect your first name, email address, consent
              wording, consent timestamp, verification status, and unsubscribe status so we can send
              the requested guide, keep an audit trail of permission, and suppress future marketing
              emails if you opt out.
            </p>
            <p>
              You can unsubscribe at any time using the link in the email or by contacting us
              directly. Verification links expire after a limited period and no launch marketing
              emails are sent before confirmation. Transactional emails such as sign-in codes,
              booking confirmations, payment notices, and operational service messages are sent
              separately from marketing emails.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">11. Cookies & Tracking</h2>
            <p>
              We use cookies and similar technologies to improve your experience. See our{" "}
              <a href="/cookies" className="text-primary underline">
                Cookie Policy
              </a>{" "}
              for detailed information.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">11. Third-Party Links</h2>
            <p>
              Our website may contain links to third-party sites. We are not responsible for their
              privacy practices. Please review their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">12. Children's Privacy</h2>
            <p>
              Our services are not directed to individuals under 18. We do not knowingly collect
              information from children.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">13. International Transfers</h2>
            <p>
              Your data is primarily stored in the UK/EU. Some service providers may process data
              outside the EEA. We ensure appropriate safeguards are in place for international
              transfers.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">14. Changes to This Policy</h2>
            <p>
              We may update this policy periodically. Changes will be posted on this page with an
              updated date. Significant changes will be communicated via email to active clients.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">15. Contact & Complaints</h2>
            <p>
              For privacy questions or to exercise your rights, contact:
              <br />
              Email:{" "}
              <a href="mailto:privacy@shrutiturner.com" className="text-primary underline">
                privacy@shrutiturner.com
              </a>
            </p>
            <p className="mt-4">
              If you're unhappy with how we handle your data, you can complain to the Information
              Commissioner's Office (ICO):
              <br />
              Website:{" "}
              <a
                href="https://ico.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                ico.org.uk
              </a>
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
