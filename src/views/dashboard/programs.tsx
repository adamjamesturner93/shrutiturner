"use client";

import { DashboardLayout } from "../../components/dashboard-layout";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useI18n } from "../../lib/use-i18n";
import Link from "next/link";
import { ArrowRight, Check, Sparkles, Users, Calendar } from "lucide-react";

const PROGRAMS = [
  {
    id: "press-up-progression",
    title: "Press-Up Progression",
    duration: "4 weeks",
    startDate: "2026-03-10",
    spots: 6,
    spotsRemaining: 3,
    price: "£120",
    level: "All levels",
    description: "Build your first full press-up with intelligent, adaptive progression.",
    enrolled: false,
  },
  {
    id: "shoulder-resilience",
    title: "Shoulder Resilience & Mobility",
    duration: "6 weeks",
    startDate: "2026-03-17",
    spots: 6,
    spotsRemaining: 2,
    price: "£165",
    level: "All levels",
    description: "Build durable, pain-free shoulders through targeted strength and mobility.",
    enrolled: true,
  },
];

export function ProgramsPage() {
  const { fmtDate } = useI18n();
  return (
    <DashboardLayout title="Programs - Private Studio">
      <h1 className="mb-2 text-3xl">Small Group Programs</h1>
      <p className="text-muted-foreground mb-8">
        4-6 week focused cohorts with specific skill outcomes. Max 6 people per group.
      </p>

      <div className="space-y-6">
        {PROGRAMS.map((program) => (
          <div
            key={program.id}
            className={`bg-background rounded-lg border p-6 ${
              program.enrolled ? "border-brand-accent bg-brand-accent/5" : ""
            }`}
          >
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl">{program.title}</h3>
                  {program.enrolled && (
                    <Badge className="bg-brand-accent text-brand-white gap-1">
                      <Check className="h-3 w-3" />
                      Enrolled
                    </Badge>
                  )}
                  {program.spotsRemaining <= 2 && !program.enrolled && (
                    <Badge variant="outline" className="gap-1 border-orange-200 text-orange-600">
                      <Sparkles className="h-3 w-3" />
                      {program.spotsRemaining} spots left
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">{program.description}</p>
                <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {program.duration} · Starts{" "}
                    {fmtDate(program.startDate, { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {program.spots - program.spotsRemaining}/{program.spots} filled
                  </span>
                  <span>{program.price}</span>
                </div>
              </div>
              <div>
                {program.enrolled ? (
                  <Link href={`/dashboard/programs/${program.id}`}>
                    <Button>
                      View Program
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline">Register · {program.price}</Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-secondary/20 mt-8 rounded-lg border p-6 text-center">
        <p className="text-muted-foreground mb-2">New programs announced monthly.</p>
        <p className="text-muted-foreground text-sm italic">
          [Placeholder — program data will come from Supabase]
        </p>
      </div>
    </DashboardLayout>
  );
}
