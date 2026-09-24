import { getCaptureService } from "@/services/attempt-service";
import { NotFoundError, ValidationError } from "@/services/errors/service-errors";

export async function GET(_request: Request, ctx: { params: Promise<{ model: string; run: string; test: string; attempt: string }> }) {
  const { model, run, test, attempt } = await ctx.params;
  try {
    const image = await getCaptureService({ model, run, test, number: Number(attempt) });
    return new Response(new Uint8Array(image), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=60" } });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) return new Response(null, { status: 404 });
    throw error;
  }
}
