"use client";

import { DashboardLayout } from "../../components/dashboard-layout";
import { useAuth } from "../../context/auth-context";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useState } from "react";
import { Gift, Copy, Check, Users, CreditCard, ArrowRight, Wallet } from "lucide-react";
import Link from "next/link";

export function DashboardReferrals() {
  const {
    referralCode,
    referralCount,
    referralEarned,
    referralBalance,
    referralAppliesTo,
    membership,
  } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralLink = `https://shrutiturner.com/r/${referralCode}`;

  const handleCopy = () => {
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
      <h1 className="mb-2 text-3xl">Refer a Friend</h1>
      <p className="text-muted-foreground mb-8">
        Share the love. When a friend joins and makes their first purchase, you both receive £10
        toward your next payment.
      </p>

      {/* How it works */}
      <div className="mb-8 rounded-lg border border-[#4B5B32]/20 bg-[#4B5B32]/5 p-6 md:p-8">
        <div className="grid gap-6 text-center md:grid-cols-3">
          <div className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#4B5B32]/10">
              <Gift className="h-6 w-6 text-[#4B5B32]" />
            </div>
            <h3 className="text-lg">You Give</h3>
            <p className="text-2xl text-[#4B5B32]">£10 off</p>
            <p className="text-muted-foreground text-sm">
              Your friend receives £10 off their first purchase
            </p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#4B5B32]/10">
              <Users className="h-6 w-6 text-[#4B5B32]" />
            </div>
            <h3 className="text-lg">They Join</h3>
            <p className="text-muted-foreground mt-4 text-sm">
              Your friend signs up and makes their first purchase — a membership or class pack
            </p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#4B5B32]/10">
              <Wallet className="h-6 w-6 text-[#4B5B32]" />
            </div>
            <h3 className="text-lg">You Get</h3>
            <p className="text-2xl text-[#4B5B32]">£10 off</p>
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
          Share this link with friends. When they sign up and purchase through it, you'll both
          receive £10 off.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="bg-background rounded-lg border p-5 text-center">
          <p className="text-3xl">{referralCount}</p>
          <p className="text-muted-foreground text-sm">Friends Joined</p>
        </div>
        <div className="bg-background rounded-lg border p-5 text-center">
          <p className="text-3xl">£{referralEarned}</p>
          <p className="text-muted-foreground text-sm">Total Earned</p>
        </div>
        <div className="bg-background rounded-lg border p-5 text-center">
          <p className="text-3xl text-[#4B5B32]">£{referralBalance}</p>
          <p className="text-muted-foreground text-sm">Current Balance</p>
        </div>
      </div>

      {/* Where balance will be applied */}
      {referralBalance > 0 && (
        <div className="mb-8 rounded-lg border border-[#4B5B32]/20 bg-[#4B5B32]/5 p-5">
          <div className="flex items-start gap-3">
            <Gift className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#4B5B32]" />
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
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between border-b py-2">
            <div>
              <p>Emma T.</p>
              <p className="text-muted-foreground text-xs">Joined 14 Feb 2026</p>
            </div>
            <div className="text-right">
              <span className="text-[#4B5B32]">+£10</span>
              <p className="text-muted-foreground text-xs">Available</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-b py-2">
            <div>
              <p>Marcus L.</p>
              <p className="text-muted-foreground text-xs">Joined 3 Jan 2026</p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">+£10</span>
              <p className="text-muted-foreground text-xs">Applied to Jan renewal</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p>Priya K.</p>
              <p className="text-muted-foreground text-xs">Joined 12 Dec 2025</p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">+£10</span>
              <p className="text-muted-foreground text-xs">Applied to Dec renewal</p>
            </div>
          </div>
        </div>
        <p className="text-muted-foreground mt-4 text-xs italic">
          [Placeholder data — Supabase integration required]
        </p>
      </div>
    </DashboardLayout>
  );
}
