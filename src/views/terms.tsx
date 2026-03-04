"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";

export function TermsPage() {
  return (
    <Layout>
      <SEO
        title="Terms & Conditions - Shruti Turner"
        description="Terms and conditions for Shruti Turner's coaching services, retreats, and online classes."
        canonicalUrl="https://shrutiturner.com/terms"
      />

      <div className="container mx-auto max-w-4xl px-4 py-16">
        <h1 className="mb-8 text-4xl md:text-5xl">Terms & Conditions</h1>

        <div className="prose prose-lg text-muted-foreground max-w-none space-y-8">
          <p className="text-sm italic">Last updated: {new Date().toLocaleDateString("en-GB")}</p>

          <p className="text-lg">
            <em>
              Note: This page will be managed through the CMS. The following is placeholder content
              that should be reviewed and updated by a legal professional.
            </em>
          </p>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">1. Introduction</h2>
            <p>
              These Terms and Conditions govern your use of services provided by Shruti Turner,
              including but not limited to: one-to-one coaching, group classes, online courses,
              retreats, and digital content.
            </p>
            <p>
              By booking any service or using this website, you agree to be bound by these terms.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">2. Services Provided</h2>
            <p>
              Services include rehabilitation-informed strength coaching, yoga instruction, online
              classes, retreats, and educational content. All services are provided for educational
              and wellness purposes and do not constitute medical advice.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">3. Medical Disclaimer</h2>
            <p>
              Shruti Turner is not a medical professional. While services are informed by
              evidence-based practices and consideration of chronic conditions, they do not replace
              medical advice, diagnosis, or treatment.
            </p>
            <p>You agree to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                Consult with your healthcare provider before beginning any new exercise program
              </li>
              <li>Inform your coach of any changes to your health status or medical conditions</li>
              <li>Take responsibility for your own health and safety during all activities</li>
              <li>
                Stop any exercise that causes pain or discomfort and seek medical attention if
                necessary
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">4. Booking & Payment</h2>
            <h3 className="text-foreground mb-3 text-xl">4.1 Coaching & Classes</h3>
            <p>
              Payment is required in advance of services. Coaching packages must be used within the
              specified time period. Unused sessions do not rollover unless agreed in writing.
            </p>

            <h3 className="text-foreground mt-6 mb-3 text-xl">4.2 Retreats</h3>
            <p>Retreat bookings require full payment at time of booking.</p>
            <p>
              <strong>Cancellation policy:</strong>
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>More than 60 days before retreat: 100% refund</li>
              <li>30-60 days before retreat: 50% refund</li>
              <li>Less than 30 days before retreat: No refund unless space can be filled</li>
            </ul>
            <p>
              We understand chronic illness is unpredictable. If you need to cancel due to medical
              reasons, please contact us to discuss options.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">5. Cancellations & Rescheduling</h2>
            <p>
              For one-to-one coaching sessions, 24 hours notice is required for cancellations or
              rescheduling. Late cancellations or no-shows will be charged at the full session rate.
            </p>
            <p>
              We understand that chronic conditions can be unpredictable. If you need to cancel due
              to acute illness or flare, please communicate as soon as possible.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">6. Intellectual Property</h2>
            <p>
              All content, including but not limited to videos, written materials, programs, and
              educational resources, are the intellectual property of Shruti Turner and are
              protected by copyright.
            </p>
            <p>You may not:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Share, copy, or distribute materials without permission</li>
              <li>Use materials for commercial purposes</li>
              <li>Record, screenshot, or reproduce content without explicit permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">7. Liability & Assumption of Risk</h2>
            <p>
              Participation in physical activities carries inherent risks. By participating in any
              service, you acknowledge and accept these risks.
            </p>
            <p>
              Shruti Turner, her employees, and contractors shall not be liable for any injuries,
              losses, or damages arising from participation in services, except where liability
              cannot be excluded by law.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">8. Code of Conduct</h2>
            <p>We expect all clients to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Treat instructors and other participants with respect</li>
              <li>Communicate honestly about health status and limitations</li>
              <li>Follow safety guidelines provided</li>
              <li>Respect the privacy of other participants</li>
            </ul>
            <p>
              We reserve the right to terminate services for anyone who violates these standards
              without refund.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">9. Data Protection</h2>
            <p>
              Your personal information will be handled in accordance with our{" "}
              <a href="/privacy" className="text-primary underline">
                Privacy Policy
              </a>
              . We take data protection seriously and comply with GDPR requirements.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">10. Changes to Terms</h2>
            <p>
              We reserve the right to update these terms at any time. Changes will be posted on this
              page with an updated date. Continued use of services after changes constitutes
              acceptance of new terms.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">11. Contact</h2>
            <p>
              For questions about these terms, please contact:{" "}
              <a href="mailto:hello@shrutiturner.com" className="text-primary underline">
                hello@shrutiturner.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">12. Governing Law</h2>
            <p>
              These terms are governed by the laws of England and Wales. Any disputes will be
              subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
