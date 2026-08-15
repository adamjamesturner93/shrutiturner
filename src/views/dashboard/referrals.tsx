"use client";

import { DashboardLayout } from "../../components/dashboard-layout";
import { useAuth } from "../../context/auth-context";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useEffect, useState } from "react";
import { Gift, Copy, Check, Users, ArrowRight, Wallet } from "lucide-react";
import Link from "next/link";
import type { ReferralSummaryDto } from "@/lib/api/types";
import { AppMetricCard, AppMetricGrid, AppPageHeader } from "@/components/app-surface";

export function DashboardReferrals() {
  const { referralAppliesTo, membership } = useAuth();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<ReferralSummaryDto | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/me/referrals", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load referral data.");
        }
        const data = (await res.json()) as ReferralSummaryDto;
        if (active) setSummary(data);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load referral data.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const referralCode = summary?.referralCode || "";
  const referralLink = summary?.referralLink || "";
  const referralCount = summary?.referralCount || 0;
  const referralEarned = Math.floor((summary?.referralEarnedPence || 0) / 100);
  const referralBalance = Math.floor((summary?.referralBalancePence || 0) / 100);

  const handleCopy = () => {
    if (!referralLink) return;
    try {
      // Fallback: use a temporary textarea + execCommand
      const textarea = document.createElement("textarea");
      textarea.value = referralLink;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    } catch {
      // silently fail
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout title="Referrals - Private Studio">
      <AppPageHeader
        eyebrow="Member referrals"
        title="Refer a Friend"
        description="Share your link. Your friend gets one free class giftand you receive £10 after their first paid purchase."
        className="mb-8"
      />

      {/* How it works */}
      <div className="border-brand-accent/20 bg-brand-accent/5 mb-8 rounded-lg border p-6 md:p-8">
        <div className="grid gap-6 text-center md:grid-cols-3">
          <div className="space-y-2">
            <div className="bg-brand-accent/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
              <Gift className="text-brand-accent h-6 w-6" />
            </div>
            <h3 className="text-lg">You Give</h3>
            <p className="text-brand-accent text-2xl">1 free class</p>
            <p className="text-muted-foreground text-sm">
              Your friend receives one promo class credit
            </p>
          </div>
          <div className="space-y-2">
            <div className="bg-brand-accent/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
              <Users className="text-brand-accent h-6 w-6" />
            </div>
            <h3 className="text-lg">They Join</h3>
            <p className="text-muted-foreground mt-4 text-sm">
              Your friend claims your referral and later makes their first paid purchase
            </p>
          </div>
          <div className="space-y-2">
            <div className="bg-brand-accent/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
              <Wallet className="text-brand-accent h-6 w-6" />
            </div>
            <h3 className="text-lg">You Get</h3>
            <p className="text-brand-accent text-2xl">£10 off</p>
            <p className="text-muted-foreground text-sm">
              Applied to your next {membership ? "renewal" : "purchase"} automatically
            </p>
          </div>
        </div>
      </div>

      {/* Referral link */}
      <div className="bg-background mb-8 rounded-lg border p-6">
        <h2 className="mb-4 text-xl">Your Referral Link</h2>
        <div className="flex gap-2">
          <Input value={referralLink} readOnly className="flex-1 font-mono text-sm" />
          <Button onClick={handleCopy} variant={copied ? "default" : "outline"}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
        <p className="text-muted-foreground mt-3 text-xs">
          Share this link with friends. They get a free class gift right away and you get £10 when
          they complete their first paid purchase.
        </p>
        {referralCode ? (
          <p className="text-muted-foreground mt-2 text-xs">Code: {referralCode}</p>
        ) : null}
      </div>

      {/* Stats */}
      <AppMetricGrid className="mb-8 lg:grid-cols-3">
        <AppMetricCard label="Friends joined" value={referralCount} detail="completed referrals" />
        <AppMetricCard
          label="Total earned"
          value={`£${referralEarned}`}
          detail="lifetime referral earnings"
        />
        <AppMetricCard
          label="Current balance"
          value={`£${referralBalance}`}
          detail="ready for your next purchase"
        />
      </AppMetricGrid>

      {/* Where balance will be applied */}
      {referralBalance > 0 && (
        <div className="border-brand-accent/20 bg-brand-accent/5 mb-8 rounded-lg border p-5">
          <div className="flex items-start gap-3">
            <Gift className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-sm">{referralAppliesTo}</p>
              <Link href="/dashboard/membership">
                <Button variant="ghost" size="sm" className="mt-2 -ml-3">
                  View Membership & Credits
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Referral history */}
      <div className="bg-background rounded-lg border p-6">
        <h2 className="mb-4 text-xl">Referral History</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading referral history...</p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {!loading && !error ? (
          <div className="space-y-3 text-sm">
            {summary?.history?.length ? (
              summary.history.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between py-2 ${
                    index < summary.history.length - 1 ? "border-b" : ""
                  }`}
                >
                  <div>
                    <p>{item.friend}</p>
                    <p className="text-muted-foreground text-xs">
                      Joined {new Date(item.joinedAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={
                        item.amountPence > 0 ? "text-brand-accent" : "text-muted-foreground"
                      }
                    >
                      {item.amountPence >= 0 ? "+" : "-"}£{Math.abs(item.amountPence) / 100}
                    </span>
                    <p className="text-muted-foreground text-xs">
                      {item.status.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No referrals yet.</p>
            )}
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
