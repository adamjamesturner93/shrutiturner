import { processThreeHourClassCutoff } from "../../src/lib/classes/booking-service";

async function main() {
  const result = await processThreeHourClassCutoff();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
