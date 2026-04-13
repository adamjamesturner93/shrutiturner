"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";

const LAST_UPDATED_LABEL = "12 March 2026";

export function HealthDeclarationPage() {
  return (
    <Layout>
      <SEO
        title="Health Declaration - Shruti Turner"
        description="Health declaration and informed consent for participation in strength training, yoga, and physical activities with Shruti Turner."
        canonicalUrl="https://shrutiturner.com/health-declaration"
      />

      <div className="container mx-auto max-w-4xl px-4 py-16">
        <h1 className="mb-8 text-4xl md:text-5xl">Health Declaration & Informed Consent</h1>

        <div className="prose prose-lg text-muted-foreground max-w-none space-y-8">
          <p className="text-sm italic">Last updated: {LAST_UPDATED_LABEL}</p>

          <p className="text-lg">
            <em>
              Note: This page will be managed through the CMS. The following is placeholder content
              that should be reviewed by a legal professional and insurance provider.
            </em>
          </p>

          <div className="border-brand-accent/30 bg-brand-accent/10 my-8 rounded-lg border p-6">
            <p className="text-foreground">
              <strong>Important:</strong> Please read this document carefully. It contains important
              information about your health, safety, and participation in physical activities. By
              participating in any service, you acknowledge that you have read, understood, and
              agreed to this declaration.
            </p>
          </div>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">
              1. Understanding the Nature of Services
            </h2>
            <p>I understand that:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                Services provided by Shruti Turner include physical activities such as strength
                training, yoga, and movement practices
              </li>
              <li>
                While services are informed by rehabilitation principles and adapted for chronic
                conditions, they carry inherent physical risks
              </li>
              <li>
                Shruti Turner is not a medical professional and does not provide medical advice,
                diagnosis, or treatment
              </li>
              <li>
                I am responsible for consulting with my healthcare provider before beginning any new
                exercise program
              </li>
              <li>Services are educational and wellness-focused, not medical interventions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">2. Medical Consultation Requirement</h2>
            <p>I confirm that:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                I have consulted with my GP or relevant healthcare provider about participating in
                physical exercise
              </li>
              <li>
                My healthcare provider is aware of my intention to participate in strength training
                and/or yoga
              </li>
              <li>
                I have been cleared by my healthcare provider to participate, OR I am choosing to
                participate against medical advice and accept full responsibility for this decision
              </li>
              <li>
                I will inform my coach of any changes to my medical status, medications, or
                treatment plan
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">3. Health Disclosure</h2>
            <p>
              I agree to disclose honestly and completely all relevant health information including:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Chronic conditions and autoimmune diseases</li>
              <li>Current medications and supplements</li>
              <li>Previous injuries and surgeries</li>
              <li>Pain patterns and limitations</li>
              <li>Recent flares or acute symptoms</li>
              <li>Pregnancy or potential pregnancy</li>
              <li>Any cardiovascular, respiratory, or neurological conditions</li>
              <li>Mental health conditions that may affect participation</li>
              <li>Any other relevant medical information</li>
            </ul>
            <p className="mt-4">
              I understand that withholding or providing inaccurate health information may put me at
              risk and affect the safety and appropriateness of the program.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">4. Assumption of Risk</h2>
            <p>
              I acknowledge and accept that participation in physical activities involves risks,
              including but not limited to:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Muscle soreness, strains, or sprains</li>
              <li>Joint pain or inflammation</li>
              <li>Fatigue or post-exertional malaise</li>
              <li>Symptom flares of chronic conditions</li>
              <li>Falls or loss of balance</li>
              <li>Cardiovascular events (rare but possible)</li>
              <li>Aggravation of pre-existing conditions</li>
              <li>Other injuries or health complications</li>
            </ul>
            <p className="mt-4">
              I understand these risks and voluntarily choose to participate, accepting full
              responsibility for any consequences.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">5. Personal Responsibility</h2>
            <p>I agree that:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>I am responsible for monitoring my own body and symptoms during activities</li>
              <li>
                I will immediately stop any activity that causes pain, dizziness, shortness of
                breath, or other concerning symptoms
              </li>
              <li>I will communicate honestly about my experience, symptoms, and limitations</li>
              <li>I will not push beyond my current capacity in a way that feels unsafe</li>
              <li>I will follow safety guidelines and modifications provided by my coach</li>
              <li>I will seek immediate medical attention if I experience any serious symptoms</li>
              <li>
                I understand that I have the right to refuse any exercise or modification at any
                time
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">6. Chronic Illness Considerations</h2>
            <p>
              I understand that living with chronic illness means my capacity fluctuates. I
              acknowledge that:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>What feels appropriate one day may not be appropriate the next day</li>
              <li>Flares, fatigue, and symptom variations are normal and expected</li>
              <li>Resting or modifying activities is a valid and important choice</li>
              <li>I will communicate with my coach about changes in my symptoms or capacity</li>
              <li>Programming may need to be adjusted based on my current state</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">7. Emergency Procedures</h2>
            <p>I understand that:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                In case of medical emergency, 999 will be called and my emergency contact will be
                notified
              </li>
              <li>For retreat bookings, I have provided accurate emergency contact information</li>
              <li>
                I authorize emergency medical treatment if I am unable to consent due to incapacity
              </li>
              <li>I am responsible for any costs associated with emergency medical care</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">
              8. Confidentiality of Health Information
            </h2>
            <p>
              I understand that health information I provide will be kept confidential and used only
              to:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Adapt programming to my needs</li>
              <li>Ensure safety during activities</li>
              <li>Respond to emergencies</li>
            </ul>
            <p className="mt-4">
              Health information will not be shared without my consent except in case of emergency
              or legal requirement. See our{" "}
              <a href="/privacy" className="text-primary underline">
                Privacy Policy
              </a>{" "}
              for details.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">9. Limitation of Liability</h2>
            <p>
              I agree that Shruti Turner, her employees, contractors, and affiliates shall not be
              held liable for:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Any injuries, illness, or health complications arising from participation</li>
              <li>Aggravation or flaring of pre-existing conditions</li>
              <li>Outcomes of exercise programming (positive or negative)</li>
              <li>Medical emergencies or health events during activities</li>
            </ul>
            <p className="mt-4">
              This waiver applies to the fullest extent permitted by law. It does not exclude
              liability for death or personal injury caused by negligence, fraud, or anything else
              that cannot be lawfully excluded.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">10. Insurance Recommendation</h2>
            <p>I understand that I am strongly advised to maintain:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Personal health insurance or travel insurance (for retreats)</li>
              <li>Coverage for exercise-related injuries (if not covered by NHS)</li>
            </ul>
            <p className="mt-4">
              For retreat bookings: Travel insurance with medical coverage and cancellation
              protection is mandatory.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">11. Photography & Media</h2>
            <p>
              I understand that photos or videos may be taken during group classes, retreats, or
              workshops. I can opt out at any time by informing the instructor. See separate media
              consent form for details on use of images.
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">12. Cancellation for Health Reasons</h2>
            <p>I understand that:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                My coach may recommend stopping or modifying activities if safety concerns arise
              </li>
              <li>
                I may be asked to obtain medical clearance before continuing if concerning symptoms
                develop
              </li>
              <li>
                Services may be terminated if I am unable to safely participate (with refund as per
                cancellation policy)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">13. Updates to Health Status</h2>
            <p>I agree to inform my coach immediately of:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>New diagnoses or medical conditions</li>
              <li>Changes to medications or treatment</li>
              <li>New injuries or surgeries</li>
              <li>Pregnancy</li>
              <li>Significant changes in symptoms or health status</li>
              <li>Advice from healthcare providers that affects participation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">14. Acknowledgment & Consent</h2>
            <p>By participating in services, I confirm that:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>I have read and understood this entire document</li>
              <li>I have had the opportunity to ask questions</li>
              <li>I am participating voluntarily</li>
              <li>I am mentally competent to provide this consent</li>
              <li>
                I am not under the influence of alcohol or drugs that would impair my judgment
              </li>
              <li>The information I have provided is true and complete</li>
              <li>I accept the risks and responsibilities outlined above</li>
            </ul>

            <div className="border-brand-accent/30 bg-brand-accent/10 mt-8 rounded-lg border p-6">
              <p className="text-foreground">
                <strong>For Booking Purposes:</strong>
                <br />
                This health declaration is incorporated into the booking process. By checking the "I
                agree to the Health Declaration" box during booking, you are providing your
                electronic signature and consent to the terms above.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">15. Contact</h2>
            <p>
              Questions about this health declaration? Contact:
              <br />
              Email:{" "}
              <a href="mailto:tech@thechronicyogini.com" className="text-primary underline">
                tech@thechronicyogini.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-foreground mb-4 text-2xl">16. Governing Law</h2>
            <p>This health declaration is governed by the laws of England and Wales.</p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
