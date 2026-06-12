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
import { Badge } from "../ui/badge";
import { Calendar, Clock, Users, Info } from "lucide-react";
import { getTypeColor } from "@/lib/classes/type-color";

interface ScheduleClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: ClassTemplateOption[];
  instructors?: InstructorOption[];
  instructorProfiles?: InstructorProfileOption[];
  onSchedule?: (data: ScheduleClassData) => Promise<void>;
}

export interface ScheduleClassData {
  classTemplateSlug: string;
  date: string;
  time: string;
  maxSpaces: number;
  notes: string;
  instructorUserId?: string;
  instructorProfileEntryId?: string;
  repeatWeeks?: number;
  weekdays?: number[];
}

export type ClassTemplateOption = {
  slug: string;
  name: string;
  type: string;
  defaultDay?: string;
  defaultTime: string;
  duration: string;
  level: string;
  maxSpaces: number;
};

export type InstructorOption = {
  id: string;
  name: string;
  instructorProfileEntryId?: string | null;
};

export type InstructorProfileOption = {
  id: string;
  name: string;
  headline?: string;
  bio?: string;
};

export function ScheduleClassModal({
  open,
  onOpenChange,
  onSchedule,
  templates,
  instructors = [],
  instructorProfiles = [],
}: ScheduleClassModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [maxSpaces, setMaxSpaces] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [instructorUserId, setInstructorUserId] = useState("");
  const [instructorProfileEntryId, setInstructorProfileEntryId] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const template = templates.find((c) => c.slug === selectedTemplate);
  const selectedProfile = instructorProfiles.find((p) => p.id === instructorProfileEntryId);

  const resetForm = () => {
    setStep(1);
    setSelectedTemplate("");
    setDate("");
    setTime("");
    setMaxSpaces(0);
    setNotes("");
    setInstructorUserId("");
    setInstructorProfileEntryId("");
    setSubmitError("");
    setIsSubmitting(false);
  };

  const handleSelectTemplate = (slug: string) => {
    const tmpl = templates.find((c) => c.slug === slug);
    setSelectedTemplate(slug);
    setSubmitError("");
    if (tmpl) {
      setTime(tmpl.defaultTime);
      setMaxSpaces(tmpl.maxSpaces);
    }
    setStep(2);
  };

  const handleSchedule = async () => {
    if (!selectedTemplate || !date || !time) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await onSchedule?.({
        classTemplateSlug: selectedTemplate,
        date,
        time,
        maxSpaces,
        notes,
        instructorUserId: instructorUserId || undefined,
        instructorProfileEntryId: instructorProfileEntryId || undefined,
        weekdays: [new Date(`${date}T00:00:00`).getDay()],
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save this timetable slot right now."
      );
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (isSubmitting) return;
    setStep(1);
    setSelectedTemplate("");
    setSubmitError("");
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onOpenChange(false);
  };

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleClose();
      return;
    }
    onOpenChange(true);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Add Weekly Timetable Slot" : `Weekly Slot: ${template?.name}`}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Select a class template from Contentful, then define the weekly slot that should repeat."
              : "Set the first date, weekly time and capacity for this recurring class slot. Saving creates private draft weeks that can be edited before publishing."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          /* Step 1: Select template */
          <div className="space-y-2 py-2">
            <div className="text-muted-foreground bg-secondary/50 mb-3 flex items-center gap-2 rounded-md p-2 text-xs">
              <Info className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                Class descriptions, equipment lists and SEO content are managed in Contentful. Here
                you create the weekly timetable slot and the next 8 weeks of draft sessions for
                admin review.
              </span>
            </div>
            {templates.map((cls) => (
              <button
                type="button"
                key={cls.slug}
                onClick={() => handleSelectTemplate(cls.slug)}
                disabled={isSubmitting}
                className="border-border hover:bg-secondary/30 hover:border-brand-accent/30 w-full rounded-lg border p-3 text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{cls.name}</span>
                      <Badge className={`${getTypeColor(cls.type)} text-xs`}>{cls.type}</Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {cls.duration} · {cls.level} · Max {cls.maxSpaces}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    Default: {cls.defaultDay || "Day"} {cls.defaultTime}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Step 2: Configure instance */
          <div className="space-y-4 py-2">
            {/* Template summary */}
            {template && (
              <div className="bg-secondary/50 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Badge className={getTypeColor(template.type)}>{template.type}</Badge>
                  <span className="text-sm">{template.name}</span>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {template.duration} · {template.level}
                </p>
              </div>
            )}

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="class-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                First class date
              </Label>
              <Input
                id="class-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label htmlFor="class-time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Weekly time
              </Label>
              <Input
                id="class-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <Label htmlFor="class-capacity" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Max spaces
              </Label>
              <Input
                id="class-capacity"
                type="number"
                min={1}
                max={30}
                value={maxSpaces}
                onChange={(e) => setMaxSpaces(parseInt(e.target.value) || 0)}
              />
              {template && maxSpaces !== template.maxSpaces && (
                <p className="text-muted-foreground text-xs">
                  Default for this class is {template.maxSpaces}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="class-notes">Notes (optional)</Label>
              <Input
                id="class-notes"
                placeholder="e.g. Guest instructor, special theme..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-instructor">Instructor</Label>
              <select
                id="class-instructor"
                value={instructorUserId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setInstructorUserId(nextId);
                  const found = instructors.find((i) => i.id === nextId);
                  if (found?.instructorProfileEntryId) {
                    setInstructorProfileEntryId(found.instructorProfileEntryId);
                  }
                }}
                className="border-border bg-background w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">Default (current instructor)</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-instructor-profile">Instructor profile override</Label>
              <select
                id="class-instructor-profile"
                value={instructorProfileEntryId}
                onChange={(e) => setInstructorProfileEntryId(e.target.value)}
                className="border-border bg-background w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">Use instructor/class default</option>
                {instructorProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
              {selectedProfile ? (
                <p className="text-muted-foreground text-xs">
                  {selectedProfile.headline ||
                    selectedProfile.bio ||
                    "Profile selected for this session."}
                </p>
              ) : null}
            </div>

            <p className="text-muted-foreground text-xs">
              Saving creates a repeating weekly timetable slot and the next 8 weeks of draft
              sessions. Admin can edit those drafts before publishing them to the public schedule.
            </p>
            {submitError ? (
              <div
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {submitError}
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter>
          {step === 2 && (
            <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>
              Back
            </Button>
          )}
          {step === 2 && (
            <Button
              onClick={() => void handleSchedule()}
              disabled={!date || !time || !maxSpaces || isSubmitting}
              className="bg-brand-accent hover:bg-brand-accent/90"
            >
              {isSubmitting ? "Saving Draft Weeks..." : "Save Timetable Slot"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
