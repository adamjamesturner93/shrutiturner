"use client";
import { Button } from "@/components/ui/button";
import { UnsavedChangesGuard } from "@/components/unsaved-changes-guard";

export function AdminFormActions({ dirty, busy, onSave, onDiscard, label = "Save changes" }: {
  dirty: boolean; busy: boolean; onSave: () => void; onDiscard: () => void; label?: string;
}) {
  return <>
    <div className="sticky bottom-2 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-3 shadow-sm">
      <p role="status" className="text-sm">{busy ? "Saving…" : dirty ? "Unsaved changes" : "All changes saved"}</p>
      <div className="flex gap-2"><Button type="button" variant="outline" disabled={busy || !dirty} onClick={onDiscard}>Discard changes</Button><Button type="button" disabled={busy || !dirty} onClick={onSave}>{busy ? "Saving…" : label}</Button></div>
    </div>
    <UnsavedChangesGuard dirty={dirty} onDiscard={onDiscard} />
  </>;
}
