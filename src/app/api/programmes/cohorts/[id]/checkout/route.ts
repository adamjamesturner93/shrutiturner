import { auth } from "@/lib/auth";
import { createProgrammeCheckout } from "@/lib/programmes/checkout-service";
import { programmeError } from "@/lib/programmes/http";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await auth();
    return Response.json(
      await createProgrammeCheckout(id, await request.json(), session?.user?.id)
    );
  } catch (error) {
    return programmeError(error);
  }
}
