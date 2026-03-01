"use client";

import { DashboardLayout } from "../../components/dashboard-layout";
import { useAuth } from "../../context/auth-context";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useState } from "react";
import { Gift, Copy, Check, Users, CreditCard, ArrowRight, Wallet } from "lucide-react";
import Link from "next/link";

export function DashboardReferrals() {
  const { referralCode, referralCount, referralEarned, referralBalance, referralAppliesTo, membership } = useAuth();
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
      <h1 className="text-3xl mb-2">Refer a Friend</h1>
      <p className="text-muted-foreground mb-8">
        Share the love. When a friend joins and makes their first purchase,
        you both receive £10 toward your next payment.
      </p>

      {/* How it works */}
      <div className="bg-[#4B5B32]/5 border border-[#4B5B32]/20 rounded-lg p-6 md:p-8 mb-8">
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-[#4B5B32]/10 rounded-full flex items-center justify-center mx-auto">
              <Gift className="w-6 h-6 text-[#4B5B32]" />
            </div>
            <h3 className="text-lg">You Give</h3>
            <p className="text-2xl text-[#4B5B32]">£10 off</p>
            <p className="text-sm text-muted-foreground">
              Your friend receives £10 off their first purchase
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-[#4B5B32]/10 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-6 h-6 text-[#4B5B32]" />
            </div>
            <h3 className="text-lg">They Join</h3>
            <p className="text-sm text-muted-foreground mt-4">
              Your friend signs up and makes their first purchase — a
              membership or class pack
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-[#4B5B32]/10 rounded-full flex items-center justify-center mx-auto">
              <Wallet className="w-6 h-6 text-[#4B5B32]" />
            </div>
            <h3 className="text-lg">You Get</h3>
            <p className="text-2xl text-[#4B5B32]">£10 off</p>
            <p className="text-sm text-muted-foreground">
              Applied to your next {membership ? "renewal" : "purchase"} automatically
            </p>
          </div>
        </div>
      </div>

      {/* Referral link */}
      <div className="bg-background border rounded-lg p-6 mb-8">
        <h2 className="text-xl mb-4">Your Referral Link</h2>
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
        <p className="text-xs text-muted-foreground mt-3">
          Share this link with friends. When they sign up and purchase through
          it, you'll both receive £10 off.
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-background border rounded-lg p-5 text-center">
          <p className="text-3xl">{referralCount}</p>
          <p className="text-sm text-muted-foreground">Friends Joined</p>
        </div>
        <div className="bg-background border rounded-lg p-5 text-center">
          <p className="text-3xl">£{referralEarned}</p>
          <p className="text-sm text-muted-foreground">Total Earned</p>
        </div>
        <div className="bg-background border rounded-lg p-5 text-center">
          <p className="text-3xl text-[#4B5B32]">£{referralBalance}</p>
          <p className="text-sm text-muted-foreground">Current Balance</p>
        </div>
      </div>

      {/* Where balance will be applied */}
      {referralBalance > 0 && (
        <div className="bg-[#4B5B32]/5 border border-[#4B5B32]/20 rounded-lg p-5 mb-8">
          <div className="flex items-start gap-3">
            <Gift className="w-5 h-5 text-[#4B5B32] flex-shrink-0 mt-0.5" />
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
      <div className="bg-background border rounded-lg p-6">
        <h2 className="text-xl mb-4">Referral History</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b">
            <div>
              <p>Emma T.</p>
              <p className="text-xs text-muted-foreground">Joined 14 Feb 2026</p>
            </div>
            <div className="text-right">
              <span className="text-[#4B5B32]">+£10</span>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <div>
              <p>Marcus L.</p>
              <p className="text-xs text-muted-foreground">Joined 3 Jan 2026</p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">+£10</span>
              <p className="text-xs text-muted-foreground">Applied to Jan renewal</p>
            </div>
          </div>
          <div className="flex justify-between items-center py-2">
            <div>
              <p>Priya K.</p>
              <p className="text-xs text-muted-foreground">Joined 12 Dec 2025</p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">+£10</span>
              <p className="text-xs text-muted-foreground">Applied to Dec renewal</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 italic">
          [Placeholder data — Supabase integration required]
        </p>
      </div>
    </DashboardLayout>
  );
}