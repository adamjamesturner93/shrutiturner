import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { PoundSterling, Info, Link2, CheckCircle } from "lucide-react";

interface CreateRetreatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate?: (data: CreateRetreatData) => void;
}

export interface CreateRetreatData {
  contentfulEntryId: string;
  contentfulTitle: string;
  startDate: string;
  endDate: string;
  totalSpaces: number;
  earlyBirdPrice: number;
  earlyBirdDeadline: string;
  normalPrice: number;
  internalNotes: string;
}

// Mock Contentful retreat entries — in production these would be fetched via the Contentful API
const CONTENTFUL_RETREAT_TEMPLATES = [
  {
    entryId: "ctfl_sankalpa",
    title: "Sankalpa",
    subtitle: "A Yoga Retreat for Bodies That Require Nuance",
    location: "Portuguese Countryside",
    description: "5 days of rehabilitation-informed yoga, strength work, and community.",
  },
  {
    entryId: "ctfl_strength_stillness",
    title: "Strength & Stillness",
    subtitle: "Winter Retreat for Complex Bodies",
    location: "Scottish Highlands",
    description: "4 days of strength training, restorative yoga, and community.",
  },
  {
    entryId: "ctfl_virtual_immersion",
    title: "Virtual Immersion Weekend",
    subtitle: "An Online Retreat for Bodies That Can't Travel",
    location: "Online (Live via Video)",
    description: "2-day live online retreat bringing the retreat experience home.",
  },
];

export function CreateRetreatModal({ open, onOpenChange, onCreate }: CreateRetreatModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalSpaces, setTotalSpaces] = useState<number>(12);
  const [earlyBirdPrice, setEarlyBirdPrice] = useState<number>(0);
  const [earlyBirdDeadline, setEarlyBirdDeadline] = useState("");
  const [normalPrice, setNormalPrice] = useState<number>(0);
  const [internalNotes, setInternalNotes] = useState("");

  const template = CONTENTFUL_RETREAT_TEMPLATES.find((t) => t.entryId === selectedTemplate);

  const handleCreate = () => {
    if (!template || !startDate || !endDate || !normalPrice) return;
    onCreate?.({
      contentfulEntryId: template.entryId,
      contentfulTitle: template.title,
      startDate,
      endDate,
      totalSpaces,
      earlyBirdPrice,
      earlyBirdDeadline,
      normalPrice,
      internalNotes,
    });
    handleClose();
  };

  const handleClose = () => {
    setSelectedTemplate("");
    setStartDate("");
    setEndDate("");
    setTotalSpaces(12);
    setEarlyBirdPrice(0);
    setEarlyBirdDeadline("");
    setNormalPrice(0);
    setInternalNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Retreat Instance</DialogTitle>
          <DialogDescription>
            Select a retreat template from Contentful, then set dates, capacity, and pricing for
            this instance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Contentful info */}
          <div className="text-muted-foreground bg-secondary/50 flex items-start gap-2 rounded-md p-3 text-xs">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>
              Retreat descriptions, photos, accommodation details, schedule, and location info are
              managed in Contentful. Here you set the operational details for a specific instance
              (dates, spaces, pricing).
            </span>
          </div>

          {/* Template selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Contentful retreat template
            </Label>
            <div className="space-y-2">
              {CONTENTFUL_RETREAT_TEMPLATES.map((t) => (
                <button
                  key={t.entryId}
                  onClick={() => setSelectedTemplate(t.entryId)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedTemplate === t.entryId
                      ? "border-brand-accent bg-brand-accent/5"
                      : "border-border hover:bg-secondary/30"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm">{t.title}</p>
                      <p className="text-muted-foreground text-xs">{t.subtitle}</p>
                      <p className="text-muted-foreground mt-1 text-xs">{t.location}</p>
                    </div>
                    {selectedTemplate === t.entryId && (
                      <CheckCircle className="text-brand-accent h-4 w-4 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {template && (
            <>
              {/* Date range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retreat-start">Start date</Label>
                  <input
                    id="retreat-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-input bg-input-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border px-3 py-1 text-sm transition-colors outline-none focus-visible:ring-[3px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retreat-end">End date</Label>
                  <input
                    id="retreat-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-input bg-input-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border px-3 py-1 text-sm transition-colors outline-none focus-visible:ring-[3px]"
                  />
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label htmlFor="retreat-capacity">Total spaces</Label>
                <Input
                  id="retreat-capacity"
                  type="number"
                  min={2}
                  max={30}
                  value={totalSpaces}
                  onChange={(e) => setTotalSpaces(parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-sm">
                  <PoundSterling className="h-4 w-4" />
                  Pricing
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="retreat-early-price">Early bird price (£)</Label>
                    <Input
                      id="retreat-early-price"
                      type="number"
                      min={0}
                      step={50}
                      value={earlyBirdPrice}
                      onChange={(e) => setEarlyBirdPrice(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="retreat-early-deadline">Early bird deadline</Label>
                    <input
                      id="retreat-early-deadline"
                      type="date"
                      value={earlyBirdDeadline}
                      onChange={(e) => setEarlyBirdDeadline(e.target.value)}
                      className="border-input bg-input-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border px-3 py-1 text-sm transition-colors outline-none focus-visible:ring-[3px]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retreat-normal-price">Normal price (£)</Label>
                  <Input
                    id="retreat-normal-price"
                    type="number"
                    min={0}
                    step={50}
                    value={normalPrice}
                    onChange={(e) => setNormalPrice(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Internal notes */}
              <div className="space-y-2">
                <Label htmlFor="retreat-notes">Internal notes</Label>
                <Textarea
                  id="retreat-notes"
                  placeholder="Any notes about this specific instance (e.g. venue changes, co-facilitator)..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!template || !startDate || !endDate || !normalPrice}
            className="bg-brand-accent hover:bg-brand-accent/90"
          >
            Create Retreat Instance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
