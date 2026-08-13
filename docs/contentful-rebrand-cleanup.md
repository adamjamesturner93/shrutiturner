# Contentful rebrand release checklist

This repository cleanup deliberately does not mutate the live Contentful space. Complete and verify the following in Contentful before the rebrand branch is released.

## Unpublish placeholder contributors

- `maya-thompson`
- `dr-hannah-lewis`

## Unpublish associated or retired articles

- `arthritis-exercise-guide`
- `pain-during-exercise-modify-or-stop`
- `breathwork-for-chronic-pain`
- `returning-after-a-flare-coach-physio`
- `good-small-group-programme`

## Update retained content

- Set the `shruti-turner` role to `Movement & Fitness Coach`.
- Set the `shruti-turner` bio to: “Shruti brings together biomechanics research, rehabilitation expertise, personal training, strength and conditioning, yoga and lived experience to help people build movement and training around their body, goals and real life.”
- Use a real Shruti portrait instead of a generated initials/Dicebear avatar.
- Correct `Strengthand`, `breathand`, `contextand`, `muchand`, and similar joined-word artefacts in retained entries and newsletter content.

## Release gate

- Confirm no published contributor uses `example.com` or a Dicebear placeholder.
- Confirm every published article has a genuine named author and suitable image rights/alt text.
- Confirm each article renders one page H1, semantic H2/H3 headings and proper lists in preview.
- Confirm the live legal effective date and re-acceptance timing with the business owner before deploying the updated Terms, Health Waiver and Coaching Agreement versions.
