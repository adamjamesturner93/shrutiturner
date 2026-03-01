import { useState, useEffect } from "react";
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
import { Users, PoundSterling, Clock } from "lucide-react";

interface CreateProgrammeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate?: (data: CreateProgrammeData) => void;
}

export interface SessionPlan {
  number: number;
  title: string;
  description: string;
}

export interface CreateProgrammeData {
  name: string;
  description: string;
  durationWeeks: number;
  sessionsPerWeek: number;
  maxParticipants: number;
  dayAndTime: string;
  startDate: string;
  endDate: string;
  price: number;
  sessions: SessionPlan[];
}

function calculateEndDate(startDate: string, durationWeeks: number): string {
  if (!startDate || !durationWeeks) return "";
  const start = new Date(startDate);
  start.setDate(start.getDate() + durationWeeks * 7);
  return start.toISOString().split("T")[0];
}

export function CreateProgrammeModal({
  open,
  onOpenChange,
  onCreate,
}: CreateProgrammeModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationWeeks, setDurationWeeks] = useState<number>(6);
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(2);
  const [maxParticipants, setMaxParticipants] = useState<number>(6);
  const [dayAndTime, setDayAndTime] = useState("");
  const [startDate, setStartDate] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [sessions, setSessions] = useState<SessionPlan[]>([]);

  // Auto-calculate end date
  const endDate = calculateEndDate(startDate, durationWeeks);

  // Auto-generate session slots when duration or sessions/week change
  useEffect(() => {
    const totalSessions = durationWeeks * sessionsPerWeek;
    setSessions((prev) => {
      if (prev.length === totalSessions) return prev;
      const next: SessionPlan[] = [];
      for (let i = 0; i < totalSessions; i++) {
        const week = Math.floor(i / sessionsPerWeek) + 1;
        const sessionInWeek = (i % sessionsPerWeek) + 1;
        next.push(
          prev[i] || {
            number: i + 1,
            title: `Week ${week}, Session ${sessionInWeek}`,
            description: "",
          }
        );
      }
      return next;
    });
  }, [durationWeeks, sessionsPerWeek]);

  const handleCreate = () => {
    if (!name || !startDate || !price) return;
    onCreate?.({
      name,
      description,
      durationWeeks,
      sessionsPerWeek,
      maxParticipants,
      dayAndTime,
      startDate,
      endDate,
      price,
      sessions,
    });
    handleClose();
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setDurationWeeks(6);
    setSessionsPerWeek(2);
    setMaxParticipants(6);
    setDayAndTime("");
    setStartDate("");
    setPrice(0);
    setSessions([]);
    onOpenChange(false);
  };

  const updateSession = (index: number, field: "title" | "description", value: string) => {
    setSessions((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Programme</DialogTitle>
          <DialogDescription>
            Set up a new small group programme with sessions, capacity, and
            pricing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="prog-name">Programme name</Label>
            <Input
              id="prog-name"
              placeholder="e.g. Foundations to Confidence"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="prog-desc">Description</Label>
            <Textarea
              id="prog-desc"
              placeholder="Brief description of the programme, who it's for, and what participants will gain..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Duration + sessions per week */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prog-duration" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration (weeks)
              </Label>
              <Input
                id="prog-duration"
                type="number"
                min={1}
                max={52}
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prog-sessions-week">Sessions per week</Label>
              <Input
                id="prog-sessions-week"
                type="number"
                min={1}
                max={7}
                value={sessionsPerWeek}
                onChange={(e) => setSessionsPerWeek(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-2">
            <Label htmlFor="prog-schedule">Day & time</Label>
            <Input
              id="prog-schedule"
              placeholder="e.g. Monday & Thursday, 11:00 - 11:45"
              value={dayAndTime}
              onChange={(e) => setDayAndTime(e.target.value)}
            />
          </div>

          {/* Start date + auto end date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prog-start">Start date</Label>
              <input
                id="prog-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <div className="flex h-9 items-center rounded-md border bg-secondary/30 px-3 text-sm text-muted-foreground">
                {endDate
                  ? new Date(endDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Set start date & duration"}
              </div>
              <p className="text-xs text-muted-foreground">Auto-calculated from start date + duration</p>
            </div>
          </div>

          {/* Capacity + Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prog-capacity" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Max participants
              </Label>
              <Input
                id="prog-capacity"
                type="number"
                min={2}
                max={12}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prog-price" className="flex items-center gap-2">
                <PoundSterling className="w-4 h-4" />
                Price (£)
              </Label>
              <Input
                id="prog-price"
                type="number"
                min={0}
                step={10}
                value={price}
                onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Session planner */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label>Session plan ({sessions.length} sessions)</Label>
              <p className="text-xs text-muted-foreground">
                {durationWeeks} weeks × {sessionsPerWeek}/week
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Give each session a title and optional description. Participants see these on their programme page.
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {sessions.map((session, i) => (
                <div
                  key={i}
                  className="flex gap-2 items-start p-2 rounded-md bg-secondary/30"
                >
                  <span className="text-xs text-muted-foreground pt-2 w-6 flex-shrink-0 text-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 space-y-1">
                    <Input
                      value={session.title}
                      onChange={(e) => updateSession(i, "title", e.target.value)}
                      placeholder={`Session ${i + 1} title`}
                      className="h-8 text-sm"
                    />
                    <Input
                      value={session.description}
                      onChange={(e) => updateSession(i, "description", e.target.value)}
                      placeholder="Brief description (optional)"
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name || !startDate || !price}
            className="bg-[#4B5B32] hover:bg-[#4B5B32]/90"
          >
            Create Programme
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}