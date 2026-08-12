"use client";

import { IconOnly } from "@/components/icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const vennAreas = [
  {
    id: "wellbeing",
    title: "Wellbeing",
    circleClassName:
      "top-[35.7%] left-[41.875%] hover:bg-brand-gold/15 focus-visible:bg-brand-gold/15",
    labelClassName: "top-[59%] left-1/2 -translate-x-1/2",
    summary:
      "Support energy, confidence and a sustainable relationship with movement as part of everyday life.",
    details: [
      "Explore what helps you feel more capable in day-to-day life.",
      "Build routines that can flex with energy, stress and changing circumstances.",
      "Use movement as one part of a broader, realistic approach to wellbeing.",
    ],
  },
  {
    id: "fitness",
    title: "Fitness",
    circleClassName: "top-[35.7%] left-[6.875%] hover:bg-bronze/15 focus-visible:bg-bronze/15",
    labelClassName: "top-[59%] left-1/2 -translate-x-1/2",
    summary:
      "Develop fitness, useful capacity and confidence through training that is personalised to you.",
    details: [
      "Train towards goals that matter to you rather than generic benchmarks.",
      "Develop strength, stamina and movement options at an appropriate pace.",
      "Make progression fit the equipment, time and support you actually have.",
    ],
  },
  {
    id: "rehabilitation",
    title: "Rehabilitation",
    circleClassName:
      "top-[4.3%] left-[24.375%] hover:bg-brand-accent-muted/18 focus-visible:bg-brand-accent-muted/18",
    labelClassName: "top-[31%] left-1/2 -translate-x-1/2",
    summary:
      "Apply rehabilitation-informed thinking to movement, loading, recovery and the activities that matter to you.",
    details: [
      "Understand what your body is communicating as you move and train.",
      "Rebuild capacity with thoughtful adaptations and gradual progression.",
      "Connect rehabilitation principles with the activities you want to return to.",
    ],
  },
] as const;

export function WellbeingVenn() {
  return (
    <div>
      <p id="venn-instructions" className="text-muted-foreground text-center text-sm">
        Select a circle to learn more. Each circle opens in an accessible dialog and can be reached
        by keyboard.
      </p>

      <div
        className="text-brand-plum relative mx-auto mt-8 aspect-[8/7] w-full max-w-3xl"
        role="group"
        aria-label="Rehabilitation, fitness and wellbeing explorer"
        aria-describedby="venn-instructions"
      >
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-30 w-[12%] -translate-x-1/2 -translate-y-1/2">
          <IconOnly alt="" className="h-auto w-full" />
        </div>

        {vennAreas.map((area) => (
          <Dialog key={area.id}>
            <DialogTrigger asChild>
              <button
                type="button"
                className={`border-brand-plum focus-visible:ring-brand-accent absolute z-10 aspect-square w-[51.25%] rounded-full border-[3px] bg-transparent text-left transition-[background-color,color,box-shadow] duration-200 hover:z-20 focus-visible:z-20 focus-visible:ring-4 focus-visible:ring-offset-4 focus-visible:outline-none sm:border-[5px] ${area.circleClassName}`}
                aria-label={`Explore ${area.title}`}
              >
                <span
                  className={`text-brand-olive absolute text-base font-semibold whitespace-nowrap sm:text-3xl lg:text-4xl ${area.labelClassName}`}
                >
                  {area.title}
                </span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-3xl">{area.title}</DialogTitle>
                <DialogDescription className="pt-2 text-base leading-relaxed">
                  {area.summary}
                </DialogDescription>
              </DialogHeader>
              <ul className="text-muted-foreground mt-2 space-y-3 text-sm leading-relaxed">
                {area.details.map((detail) => (
                  <li key={detail} className="flex gap-3">
                    <span className="text-brand-accent" aria-hidden="true">
                      •
                    </span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
}
