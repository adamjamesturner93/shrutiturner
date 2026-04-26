import { processDueEmailDeliveries } from "@/lib/postmark/client";

export async function processTransactionalEmailRetries() {
  const result = await processDueEmailDeliveries();

  return {
    ok: true,
    ...result,
    processedAt: new Date().toISOString(),
  };
}
