import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

const SOCIAL_CARDS = {
  active: {
    eyebrow: "PERSONAL TRAINING · MOVEMENT COACHING",
    title: "Movement built around real life",
    photo: "/images/shruti-coaching.jpeg",
    position: "center 38%",
  },
  about: {
    eyebrow: "RESEARCH · COACHING · LIVED EXPERIENCE",
    title: "Meet Shruti Turner",
    photo: "/images/shruti.jpeg",
    position: "center 35%",
  },
  blog: {
    eyebrow: "MOVEMENT · STRENGTH · REHABILITATION",
    title: "Evidence-informed resources",
    photo: "/images/shruti-deadlift.jpeg",
    position: "center 48%",
  },
} as const;

type SocialCardVariant = keyof typeof SOCIAL_CARDS;

function isSocialCardVariant(value: string): value is SocialCardVariant {
  return value in SOCIAL_CARDS;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ variant: string }> }
) {
  const { variant } = await params;

  if (!isSocialCardVariant(variant)) {
    return new Response("Not found", { status: 404 });
  }

  const card = SOCIAL_CARDS[variant];
  const photoUrl = new URL(card.photo, request.url).toString();

  return new ImageResponse(
    <div
      style={{
        background: "#211728",
        color: "#fffaf7",
        display: "flex",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      <img
        alt=""
        src={photoUrl}
        style={{
          height: "100%",
          objectFit: "cover",
          objectPosition: card.position,
          position: "absolute",
          width: "100%",
        }}
      />
      <div
        style={{
          background:
            "linear-gradient(90deg, rgba(33,23,40,0.98) 0%, rgba(33,23,40,0.91) 40%, rgba(33,23,40,0.28) 72%, rgba(33,23,40,0.05) 100%)",
          display: "flex",
          height: "100%",
          position: "absolute",
          width: "100%",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "70px 72px 64px",
          position: "relative",
          width: "760px",
        }}
      >
        <div
          style={{
            color: "#f1c49b",
            display: "flex",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "0.11em",
          }}
        >
          SHRUTI TURNER
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              color: "#f1c49b",
              display: "flex",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.09em",
            }}
          >
            {card.eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.04,
            }}
          >
            {card.title}
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }
  );
}
