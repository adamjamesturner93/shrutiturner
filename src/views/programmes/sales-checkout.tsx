"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { programmeRequest, panelClass } from "./shared";
export function ProgrammePurchase({ id, version }: { id: string; version: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [other, setOther] = useState(false);
  return (
    <form
      className={panelClass}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const f = new FormData(e.currentTarget);
        const purchaser = { name: String(f.get("name")), email: String(f.get("email")) };
        try {
          const r = await programmeRequest<{ checkoutUrl: string }>(
            `/api/programmes/cohorts/${id}/checkout`,
            {
              purchaser,
              participant: other
                ? {
                    name: String(f.get("participantName")),
                    email: String(f.get("participantEmail")),
                  }
                : purchaser,
              agreementVersion: version,
              acceptedTerms: true,
              screeningAcknowledged: true,
            }
          );
          window.location.assign(r.checkoutUrl);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Unable to start checkout");
          setBusy(false);
        }
      }}
    >
      <h2 className="text-2xl">Join Rebuilding Your Strength</h2>
      {error && <p role="alert">{error}</p>}
      <label className="block">
        Your name
        <input
          name="name"
          required
          autoComplete="name"
          className="mt-1 block w-full rounded border p-2"
        />
      </label>
      <label className="block">
        Your email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 block w-full rounded border p-2"
        />
      </label>
      <label className="flex gap-2">
        <input type="checkbox" checked={other} onChange={(e) => setOther(e.target.checked)} />
        I'm buying a place for somebody else
      </label>
      {other && (
        <>
          <label className="block">
            Participant name
            <input name="participantName" required className="block w-full rounded border p-2" />
          </label>
          <label className="block">
            Participant email
            <input
              name="participantEmail"
              type="email"
              required
              className="block w-full rounded border p-2"
            />
          </label>
          <p>
            The participant will use their own account and complete their own health information.
          </p>
        </>
      )}
      <label className="flex gap-2">
        <input type="checkbox" required />I agree to the programme terms and refund policy shown on
        this page.
      </label>
      <label className="flex gap-2">
        <input type="checkbox" required />I understand health screening and exercise clearance are
        required before participation.
      </label>
      <Button disabled={busy} type="submit">
        {busy ? "Opening checkout…" : "Continue to secure checkout"}
      </Button>
    </form>
  );
}
