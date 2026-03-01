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
import { classDetails, getTypeColor } from "../../data/schedule-data";

interface ScheduleClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule?: (data: ScheduleClassData) => void;
}

export interface ScheduleClassData {
  classTemplateId: string;
  date: string;
  time: string;
  maxSpaces: number;
  notes: string;
}

export function ScheduleClassModal({
  open,
  onOpenChange,
  onSchedule,
}: ScheduleClassModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [maxSpaces, setMaxSpaces] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  const template = classDetails.find((c) => c.id === selectedTemplate);

  const handleSelectTemplate = (id: string) => {
    const tmpl = classDetails.find((c) => c.id === id);
    setSelectedTemplate(id);
    if (tmpl) {
      setTime(tmpl.time);
      setMaxSpaces(tmpl.maxSpaces);
    }
    setStep(2);
  };

  const handleSchedule = () => {
    if (!selectedTemplate || !date || !time) return;
    onSchedule?.({
      classTemplateId: selectedTemplate,
      date,
      time,
      maxSpaces,
      notes,
    });
    // Reset
    setSelectedTemplate("");
    setDate("");
    setTime("");
    setMaxSpaces(0);
    setNotes("");
    setStep(1);
    onOpenChange(false);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedTemplate("");
  };

  const handleClose = () => {
    setStep(1);
    setSelectedTemplate("");
    setDate("");
    setTime("");
    setMaxSpaces(0);
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Schedule a Class" : `Schedule: ${template?.name}`}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Select a class template from Contentful, then set the date and time."
              : "Set the date, time, and capacity for this class instance."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          /* Step 1: Select template */
          <div className="space-y-2 py-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 p-2 rounded-md bg-secondary/50">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                Class descriptions, equipment lists, and SEO content are managed
                in Contentful. Here you schedule when a class runs.
              </span>
            </div>
            {classDetails.map((cls) => (
              <button
                key={cls.id}
                onClick={() => handleSelectTemplate(cls.id)}
                className="w-full text-left p-3 rounded-lg border border-border hover:border-[#4B5B32]/30 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{cls.name}</span>
                      <Badge className={`${getTypeColor(cls.type)} text-xs`}>
                        {cls.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {cls.duration} · {cls.level} · Max {cls.maxSpaces}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Default: {cls.day} {cls.time}
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
              <div className="p-3 rounded-lg bg-secondary/50 border">
                <div className="flex items-center gap-2">
                  <Badge className={getTypeColor(template.type)}>
                    {template.type}
                  </Badge>
                  <span className="text-sm">{template.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {template.duration} · {template.level}
                </p>
              </div>
            )}

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="class-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date
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
                <Clock className="w-4 h-4" />
                Time
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
              <Label
                htmlFor="class-capacity"
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
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
                <p className="text-xs text-muted-foreground">
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
          </div>
        )}

        <DialogFooter>
          {step === 2 && (
            <Button variant="ghost" onClick={handleBack}>
              Back
            </Button>
          )}
          {step === 2 && (
            <Button
              onClick={handleSchedule}
              disabled={!date || !time || !maxSpaces}
              className="bg-[#4B5B32] hover:bg-[#4B5B32]/90"
            >
              Schedule Class
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
