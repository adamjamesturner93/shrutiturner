import type { RetreatVenueContent } from "@/lib/content/types";

export function RetreatVenueMap({ venue }: { venue: RetreatVenueContent }) {
  const address =
    venue.address?.trim() ||
    [
      venue.addressLine1,
      venue.addressLine2,
      venue.townOrCity,
      venue.region,
      venue.postcode,
      venue.country,
    ]
      .filter(Boolean)
      .join(", ");
  if (!address) return null;
  const query = encodeURIComponent(`${venue.name}, ${address}`);
  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl">{venue.name}</h3>
          <p className="text-muted-foreground mt-2">{address}</p>
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${query}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-accent py-2 underline"
        >
          Get directions<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
      <iframe
        title={`Map showing ${venue.name}`}
        src={`https://maps.google.com/maps?q=${query}&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-80 w-full rounded-2xl border"
      />
    </div>
  );
}
