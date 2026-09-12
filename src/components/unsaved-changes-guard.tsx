"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

/** Keep drafts in memory only. Native unload and in-app link navigation are guarded. */
export function UnsavedChangesGuard({ dirty, onDiscard }: { dirty: boolean; onDiscard: () => void }) {
  const router = useRouter();
  const [destination, setDestination] = useState<string | null>(null);
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      event.preventDefault(); event.stopPropagation(); setDestination(url.pathname + url.search + url.hash);
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", navigate, true); };
  }, [dirty]);
  return <Dialog open={Boolean(destination)} onOpenChange={(open) => { if (!open) setDestination(null); }}>
    <DialogContent><DialogTitle>Leave without saving?</DialogTitle>
      <DialogDescription>Your unsaved changes will be discarded. Keep editing to save them first.</DialogDescription>
      <DialogFooter><Button variant="outline" onClick={() => setDestination(null)}>Keep editing</Button>
        <Button onClick={() => { const href = destination; onDiscard(); setDestination(null); if (href) router.push(href); }}>Discard and leave</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
