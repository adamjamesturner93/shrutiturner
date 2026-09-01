"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AcceptanceRequirementState } from "@/lib/legal/acceptance-service";

const ACCEPTANCE_DETAILS: Record<string, { label: string; href: string | null; copy: string }> = {
  terms: {
    label: "Terms & Conditions",
    href: "/terms",
    copy: "I have read and agree to the current Terms & Conditions.",
  },
  health_waiver: {
    label: "Health & Liability Waiver",
    href: "/health-declaration",
    copy: "I have read and agree to the current Health & Liability Waiver.",
  },
  health_data: {
    label: "Health Data Consent",
    href: "/privacy",
    copy: "I explicitly consent to the health information I provide being processed to deliver this service safely.",
  },
  coaching_agreement: {
    label: "Coaching Agreement",
    href: "/coaching-agreement",
    copy: "I have read and agree to the current Coaching Agreement.",
  },
};

export function LegalAcceptanceChecklist({
  acceptances,
  surface,
  busy = false,
  disabled = false,
  onAccepted,
  actionLabel = "Accept agreements and continue",
}: {
  acceptances: AcceptanceRequirementState[];
  surface: string;
  busy?: boolean;
  disabled?: boolean;
  onAccepted: () => void | Promise<void>;
  actionLabel?: string;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const firstCheckboxRef = useRef<HTMLInputElement>(null);
  const keys = useMemo(
    () => acceptances.map((item) => `${item.type}:${item.policyVersionId}`),
    [acceptances]
  );
  const keysSignature = keys.join("|");
  const allChecked = keys.length > 0 && keys.every((key) => checked[key]);

  useEffect(() => {
    setChecked({});
    firstCheckboxRef.current?.focus();
  }, [keysSignature]);

  const submit = async () => {
    if (!allChecked) {
      setError("Acknowledge every required agreement before continuing.");
      firstCheckboxRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/me/acceptances/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surface,
          acceptances: acceptances.map((item) => ({
            type: item.type,
            policyVersionId: item.policyVersionId,
            version: item.currentVersion,
            acknowledged: true,
          })),
        }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) throw new Error(payload?.message || "Failed to record agreements.");
      await onAccepted();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to record agreements.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Required legal agreements</legend>
      {acceptances.map((acceptance, index) => {
        const key = `${acceptance.type}:${acceptance.policyVersionId}`;
        const detail = ACCEPTANCE_DETAILS[acceptance.type] || {
          label: acceptance.type.replaceAll("_", " "),
          href: null,
          copy: `I accept ${acceptance.type.replaceAll("_", " ")}.`,
        };
        return (
          <label
            key={key}
            className="flex items-start gap-3 rounded-lg border bg-white p-3 text-sm"
          >
            <input
              ref={index === 0 ? firstCheckboxRef : undefined}
              type="checkbox"
              checked={Boolean(checked[key])}
              onChange={(event) =>
                setChecked((current) => ({ ...current, [key]: event.target.checked }))
              }
              className="accent-brand-accent mt-0.5 h-4 w-4 shrink-0"
            />
            <span className="leading-relaxed">
              {detail.copy}{" "}
              {detail.href ? (
                <Link href={detail.href} target="_blank" className="text-primary underline">
                  Review {detail.label}
                </Link>
              ) : null}{" "}
              <span className="text-muted-foreground">(version {acceptance.currentVersion})</span>
            </span>
          </label>
        );
      })}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <Button
        disabled={disabled || busy || submitting || !allChecked}
        onClick={() => void submit()}
      >
        {busy || submitting ? "Recording agreements…" : actionLabel}
      </Button>
    </fieldset>
  );
}
