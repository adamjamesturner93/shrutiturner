import { useState } from "react";
import { X, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

/* ──────────── Types ──────────── */

export type SubscriptionType = "newsletter" | "blog" | "both";

/* ──────────── Popup (scroll / timer triggered) ──────────── */

interface NewsletterPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewsletterPopup({ isOpen, onClose }: NewsletterPopupProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true);
  const [subscribeBlog, setSubscribeBlog] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lists: string[] = [];
    if (subscribeNewsletter) lists.push("newsletter");
    if (subscribeBlog) lists.push("blog");
    console.log("Signup:", { email, firstName, lists });
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setEmail("");
      setFirstName("");
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-background border rounded-lg shadow-lg max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {!submitted ? (
          <>
            <div className="mb-6">
              <h3 className="text-2xl mb-2">Get Evidence-Based Insights</h3>
              <p className="text-muted-foreground">
                Join the mailing list for research-backed articles on strength,
                movement, and chronic illness management. No spam, unsubscribe
                anytime.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newsletter-name">First Name</Label>
                <Input
                  id="newsletter-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newsletter-email">Email Address *</Label>
                <Input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              {/* Subscription preferences */}
              <div className="space-y-3 bg-secondary/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  I'd like to receive:
                </p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subscribeNewsletter}
                    onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                    className="accent-[#4B5B32] w-4 h-4"
                  />
                  <div>
                    <span className="text-sm">Newsletter</span>
                    <p className="text-xs text-muted-foreground">
                      Monthly insights, training tips, and the lead magnet
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subscribeBlog}
                    onChange={(e) => setSubscribeBlog(e.target.checked)}
                    className="accent-[#4B5B32] w-4 h-4"
                  />
                  <div>
                    <span className="text-sm">Blog updates</span>
                    <p className="text-xs text-muted-foreground">
                      New article notifications (1-2 per month)
                    </p>
                  </div>
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!subscribeNewsletter && !subscribeBlog}
              >
                Subscribe
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                We respect your privacy. Your data is kept confidential and
                never shared with third parties.
              </p>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl mb-2">You're subscribed!</h3>
            <p className="text-muted-foreground">
              Check your inbox for a confirmation email.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────── Inline (used on blog page) ──────────── */

interface NewsletterInlineProps {
  /** Which list to subscribe to. Defaults to "both". */
  defaultList?: SubscriptionType;
  /** Show checkboxes for choosing lists */
  showListOptions?: boolean;
}

export function NewsletterInline({
  defaultList = "both",
  showListOptions = false,
}: NewsletterInlineProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(
    defaultList === "newsletter" || defaultList === "both"
  );
  const [subscribeBlog, setSubscribeBlog] = useState(
    defaultList === "blog" || defaultList === "both"
  );
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lists: string[] = [];
    if (subscribeNewsletter) lists.push("newsletter");
    if (subscribeBlog) lists.push("blog");
    console.log("Inline signup:", { email, firstName, lists });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail("");
      setFirstName("");
    }, 3000);
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl mb-2">You're subscribed!</h3>
        <p className="text-muted-foreground">
          Check your inbox for a confirmation email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
      <div className="grid sm:grid-cols-2 gap-3">
        <Input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
        />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          required
        />
      </div>

      {showListOptions && (
        <div className="flex flex-wrap gap-4 justify-center">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={subscribeNewsletter}
              onChange={(e) => setSubscribeNewsletter(e.target.checked)}
              className="accent-[#4B5B32] w-4 h-4"
            />
            Newsletter
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={subscribeBlog}
              onChange={(e) => setSubscribeBlog(e.target.checked)}
              className="accent-[#4B5B32] w-4 h-4"
            />
            Blog updates
          </label>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!subscribeNewsletter && !subscribeBlog}
      >
        {defaultList === "blog"
          ? "Subscribe to Blog Updates"
          : defaultList === "newsletter"
          ? "Subscribe to Newsletter"
          : "Subscribe"}
      </Button>
      <p className="text-sm text-muted-foreground text-center">
        No spam. Unsubscribe anytime. Your data is private.
      </p>
    </form>
  );
}
