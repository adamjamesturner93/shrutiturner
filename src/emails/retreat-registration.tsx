import { Body, Container, Heading, Html, Link, Preview, Text } from "@react-email/components";

export default function RetreatRegistrationEmail({
  name,
  title,
  url,
}: {
  name: string;
  title: string;
  url: string;
}) {
  return (
    <Html>
      <Preview>Complete your own registration for {title}</Preview>
      <Body>
        <Container>
          <Heading>Your place at {title}</Heading>
          <Text>
            Hello {name}, please sign in or create your account to complete your own registration.
            If you already have a profile, we will only ask you to update or confirm what is needed.
          </Text>
          <Text>
            Your health details are private and are not shared with the person who bought your
            place.
          </Text>
          <Link href={url}>Complete my registration</Link>
        </Container>
      </Body>
    </Html>
  );
}
