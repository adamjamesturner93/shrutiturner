import { publishActiveClassTimetables } from "../../src/lib/classes/timetable-service";

async function main() {
  const results = await publishActiveClassTimetables();
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
