"use client";

import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, ArrowRight, Mail, MessageCircle } from "lucide-react";

const INTEREST_OPTIONS = [
  { value: "group-classes", label: "Group classes (yoga, strength, HIIT)" },
  { value: "1-1-training", label: "1:1 personal training" },
  { value: "small-group", label: "Small group programmes" },
  { value: "retreat", label: "Retreats" },
  { value: "general", label: "General question" },
  { value: "sliding-scale", label: "Sliding scale enquiry" },
  { value: "other", label: "Other" },
];

const HOW_FOUND_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "google", label: "Google search" },
  { value: "instagram", label: "Instagram" },
  { value: "referral", label: "Referred by a friend or professional" },
  { value: "blog", label: "Blog article" },
  { value: "other", label: "Other" },
];

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    interest: "",
    conditions: "",
    howFound: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Contact form submitted:", formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Layout>
        <SEO
          title="Enquiry Sent - Shruti Turner"
          description="Your enquiry has been submitted."
          noIndex
        />
        <section className="py-20 md:py-28 min-h-[70vh] flex items-center">
          <div className="container mx-auto px-4 max-w-lg text-center space-y-6">
            <div className="w-16 h-16 bg-[#4B5B32]/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-[#4B5B32]" />
            </div>
            <h1 className="text-3xl">Thank you for your enquiry.</h1>
            <p className="text-muted-foreground leading-relaxed">
              I'll get back to you within 2 working days. If your enquiry is
              about 1:1 training, I may ask a few follow-up questions about your
              conditions and goals before suggesting next steps.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/classes">
                <Button variant="outline">
                  Explore Classes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/blog">
                <Button variant="outline">Read the Blog</Button>
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title="Contact & Enquiry - Shruti Turner"
        description="Get in touch to discuss 1:1 coaching, group classes, retreat information, or general questions. No hard sell, just honest conversation."
        keywords="contact Shruti Turner, fitness enquiry, coaching consultation, strength training enquiry"
        canonicalUrl="https://shrutiturner.com/contact"
      />

      {/* Hero */}
      <section className="bg-[#2E1F33] text-[#FAFAF8] py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl mb-4">Get in Touch</h1>
          <p className="text-xl text-[#B5C49B] leading-relaxed">
            Whether you have a specific question or want to explore how I can
            help, I'd love to hear from you. No pressure, no hard sell.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-5 gap-12">
            {/* Form */}
            <div className="md:col-span-3">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest">What are you interested in? *</Label>
                  <Select
                    value={formData.interest}
                    onValueChange={(v) =>
                      setFormData({ ...formData, interest: v })
                    }
                  >
                    <SelectTrigger id="interest">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTEREST_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conditions">
                    Any conditions or context you'd like to share?
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Optional. This helps me understand your situation before we
                    chat. E.g. "I have RA" or "recovering from knee surgery".
                  </p>
                  <Input
                    id="conditions"
                    placeholder="e.g. Psoriatic arthritis, chronic fatigue"
                    value={formData.conditions}
                    onChange={(e) =>
                      setFormData({ ...formData, conditions: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="howFound">How did you find me?</Label>
                  <Select
                    value={formData.howFound}
                    onValueChange={(v) =>
                      setFormData({ ...formData, howFound: v })
                    }
                  >
                    <SelectTrigger id="howFound">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {HOW_FOUND_OPTIONS.filter((o) => o.value).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Your message *</Label>
                  <Textarea
                    id="message"
                    rows={5}
                    placeholder="Tell me a bit about what you're looking for..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={!formData.interest}
                >
                  Send Enquiry
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Your information is kept private and never shared. I typically
                  reply within 2 working days.
                </p>
              </form>
            </div>

            {/* Sidebar */}
            <div className="md:col-span-2 space-y-8">
              <div className="bg-secondary/30 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <h3 className="text-lg">What to expect</h3>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>I'll reply within 2 working days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>
                      For 1:1 enquiries, I may ask follow-up questions about your
                      conditions before recommending a plan
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>No obligation, no sales pitch</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>
                      If I'm not the right fit, I'll try to point you in the
                      right direction
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-secondary/30 rounded-lg p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <h3 className="text-lg">Prefer email?</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  You can also email me directly at{" "}
                  <a
                    href="mailto:hello@shrutiturner.com"
                    className="text-primary hover:underline"
                  >
                    hello@shrutiturner.com
                  </a>
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg mb-3">Not sure what you need?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  These pages might help you decide:
                </p>
                <div className="space-y-2">
                  <Link href="/classes"
                    className="block text-sm text-primary hover:underline"
                  >
                    Explore class types &rarr;
                  </Link>
                  <Link href="/pricing"
                    className="block text-sm text-primary hover:underline"
                  >
                    View full pricing &rarr;
                  </Link>
                  <Link href="/about"
                    className="block text-sm text-primary hover:underline"
                  >
                    About my approach &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
