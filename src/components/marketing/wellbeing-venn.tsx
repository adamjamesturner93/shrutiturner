"use client";

import { useState } from "react";
import { IconOnly } from "@/components/icon";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type VennAreaId = "rehabilitation" | "fitness" | "wellbeing" | "intersection";

type VennArea = {
  id: VennAreaId;
  label: string;
  heading: string;
  image: string;
  imageAlt: string;
  paragraphs: readonly string[];
  buttonClassName: string;
};

const vennAreas: readonly VennArea[] = [
  {
    id: "rehabilitation",
    label: "Rehabilitation",
    heading: "Understanding what your body needs.",
    image: "/images/shruti-banded-chest-dip.jpeg",
    imageAlt: "Shruti Turner performing a band-assisted chest dip",
    paragraphs: [
      "Rehabilitation is about understanding where you are now, what might need adapting and how we can build from there.",
      "That might mean returning after injury, rebuilding capacity after a period of illness or pain, working with hypermobility or simply finding confidence in movement again.",
      "I use rehabilitation principles to help you move forward, not to keep you feeling fragile.",
      "The aim: understand your starting point, adapt where needed and build from it.",
    ],
    buttonClassName:
      "top-[19%] left-1/2 -translate-x-1/2 hover:bg-brand-accent-muted/20 focus-visible:bg-brand-accent-muted/20",
  },
  {
    id: "fitness",
    label: "Fitness",
    heading: "Building strength, capacity and confidence.",
    image: "/images/shruti-deadlift.jpeg",
    imageAlt: "Shruti Turner deadlifting a barbell in a gym",
    paragraphs: [
      "Fitness is about helping your body become more capable of doing the things that matter to you.",
      "That could mean getting stronger, improving mobility, returning to running, feeling more confident in the gym or simply making everyday movement feel easier.",
      "Training can be progressive and challenging while still adapting to your individual needs.",
      "The aim: build what your body can do, rather than chasing someone else’s idea of fitness.",
    ],
    buttonClassName:
      "top-[65%] left-[27%] -translate-x-1/2 hover:bg-bronze/20 focus-visible:bg-bronze/20",
  },
  {
    id: "wellbeing",
    label: "Wellbeing",
    heading: "Making movement work in real life.",
    image: "/images/shruti-yoga-warrior.jpeg",
    imageAlt: "Shruti Turner practising Warrior I with her dog nearby",
    paragraphs: [
      "Your body doesn’t exist separately from the rest of your life.",
      "Sleep, stress, fatigue, pain, work, caring responsibilities and everything else competing for your energy can all affect how movement feels on any given day.",
      "Wellbeing means recognising that context and creating an approach flexible enough to work alongside it.",
      "The aim: make movement something that supports your life, rather than another thing you have to fit yourself around.",
    ],
    buttonClassName:
      "top-[65%] left-[73%] -translate-x-1/2 hover:bg-brand-plum/15 focus-visible:bg-brand-plum/15",
  },
  {
    id: "intersection",
    label: "Where it comes together",
    heading: "Where it comes together:",
    image: "/images/shruti-hiking-selfie.jpeg",
    imageAlt: "Shruti Turner smiling while hiking in the hills",
    paragraphs: [
      "You don’t have to choose between understanding your body, progressing your fitness and looking after your wellbeing.",
      "My approach brings all three together, so we can adapt when we need to, challenge you when we can and keep your goals and real life at the centre.",
    ],
    buttonClassName: "top-[51%] left-1/2 -translate-x-1/2 -translate-y-1/2",
  },
] as const;

const circleGeometry = [
  { id: "rehabilitation", cx: 400, cy: 220, color: "#849b5c" },
  { id: "fitness", cx: 275, cy: 425, color: "#bb7345" },
  { id: "wellbeing", cx: 525, cy: 425, color: "#56344a" },
] as const;

export function WellbeingVenn() {
  const [activeArea, setActiveArea] = useState<VennAreaId | null>(null);

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
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 800 700"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {circleGeometry.map((circle) => (
              <clipPath
                id={`venn-clip-${circle.id}`}
                key={circle.id}
                clipPathUnits="userSpaceOnUse"
              >
                <circle cx={circle.cx} cy={circle.cy} r="205" />
              </clipPath>
            ))}
          </defs>

          {circleGeometry.map((circle) => {
            const highlighted = activeArea === circle.id || activeArea === "intersection";
            return (
              <circle
                key={circle.id}
                data-venn-circle={circle.id}
                data-highlighted={highlighted}
                cx={circle.cx}
                cy={circle.cy}
                r="205"
                fill={circle.color}
                fillOpacity={highlighted ? 0.2 : 0.06}
                stroke={circle.color}
                strokeWidth={highlighted ? 8 : 5}
                className="transition-[fill-opacity,stroke-width] duration-200 motion-reduce:transition-none"
              />
            );
          })}

          <g clipPath="url(#venn-clip-rehabilitation)">
            <g clipPath="url(#venn-clip-fitness)">
              <rect
                data-venn-intersection
                data-highlighted={activeArea === "intersection"}
                width="800"
                height="700"
                fill="#2e1f33"
                fillOpacity={activeArea === "intersection" ? 0.42 : 0.12}
                clipPath="url(#venn-clip-wellbeing)"
                className="transition-[fill-opacity] duration-200 motion-reduce:transition-none"
              />
            </g>
          </g>
        </svg>

        {vennAreas.map((area) => (
          <Dialog key={area.id}>
            <DialogTrigger asChild>
              <button
                type="button"
                className={`focus-visible:ring-brand-accent absolute z-10 rounded-full border border-transparent text-center font-semibold whitespace-nowrap transition-[background-color,color,box-shadow] duration-200 focus-visible:ring-4 focus-visible:ring-offset-4 focus-visible:outline-none motion-reduce:transition-none ${area.buttonClassName} ${
                  area.id === "intersection"
                    ? "bg-background/95 hover:bg-brand-plum/15 focus-visible:bg-brand-plum/15 flex aspect-square w-[14%] min-w-12 items-center justify-center p-0.5 shadow-sm"
                    : "text-brand-olive bg-transparent px-3 py-2 text-sm sm:px-5 sm:py-3 sm:text-2xl lg:text-3xl"
                }`}
                aria-label={`Explore ${area.label}`}
                onMouseEnter={() => setActiveArea(area.id)}
                onMouseLeave={() => setActiveArea(null)}
                onFocus={() => setActiveArea(area.id)}
                onBlur={() => setActiveArea(null)}
              >
                {area.id === "intersection" ? (
                  <>
                    <IconOnly alt="" className="h-auto w-full" />
                    <span className="sr-only">{area.label}</span>
                  </>
                ) : (
                  area.label
                )}
              </button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
              <div className="grid items-start gap-6 md:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] md:gap-8">
                <div className="bg-muted overflow-hidden rounded-[1.25rem]">
                  <ImageWithFallback
                    src={area.image}
                    alt={area.imageAlt}
                    className={`aspect-[4/3] h-full w-full object-cover md:aspect-[4/5] ${
                      area.id === "intersection"
                        ? "object-[center_68%]"
                        : area.id === "rehabilitation"
                          ? "object-[center_42%]"
                          : ""
                    }`}
                  />
                </div>

                <DialogHeader className="pt-1">
                  {area.id !== "intersection" ? (
                    <p className="text-brand-accent text-xs tracking-[0.22em] uppercase">
                      {area.label}
                    </p>
                  ) : null}
                  <DialogTitle className="pr-8 text-3xl leading-tight">{area.heading}</DialogTitle>
                  <DialogDescription asChild>
                    <div className="text-muted-foreground space-y-4 pt-2 text-base leading-relaxed">
                      {area.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
}
