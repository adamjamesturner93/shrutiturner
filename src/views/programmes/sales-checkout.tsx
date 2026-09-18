"use client";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { programmeRequest, panelClass } from "./shared";
export function ProgrammePurchase({
  id,
  version,
  title,
}: {
  id: string;
  version: string;
  title: string;
}) {
  const { user, isAuthenticated } = useAuth();
  const accountKey = isAuthenticated && user ? user.id : "guest";
  const accountName =
    isAuthenticated && user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "";
  const accountEmail = isAuthenticated && user ? user.email : "";
  const [details, setDetails] = useState<{ account: string; name?: string; email?: string } | null>(
    null
  );
  const [editing, setEditing] = useState(false);
  const name = (details?.account === accountKey ? details.name : undefined) ?? accountName;
  const email = (details?.account === accountKey ? details.email : undefined) ?? accountEmail;
  const knownPurchaser = Boolean(accountName && accountEmail);
  const change = (field: "name" | "email", value: string) =>
    setDetails((current) => ({
      ...(current?.account === accountKey ? current : {}),
      account: accountKey,
      [field]: value,
    }));
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
        const purchaser = { name, email };
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
      <h3 className="text-xl">Book your place in {title}</h3>
      {error && <p role="alert">{error}</p>}
      {knownPurchaser && !editing ? (
        <div className="bg-secondary rounded-xl p-4" aria-label="Your booking details">
          <p className="text-muted-foreground text-sm">Booking with your account</p>
          <p className="mt-2 font-medium">{name}</p>
          <p className="text-sm break-all">{email}</p>
          <Button
            type="button"
            variant="link"
            className="mt-2 px-0"
            onClick={() => setEditing(true)}
          >
            Change booking details
          </Button>
        </div>
      ) : (
        <>
          <label className="block">
            Your name
            <input
              name="name"
              value={name}
              onChange={(e) => change("name", e.target.value)}
              required
              autoComplete="name"
              className="mt-1 block w-full rounded border p-2"
            />
          </label>
          <label className="block">
            Your email
            <input
              name="email"
              value={email}
              onChange={(e) => change("email", e.target.value)}
              type="email"
              required
              autoComplete="email"
              className="mt-1 block w-full rounded border p-2"
            />
          </label>
        </>
      )}
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
