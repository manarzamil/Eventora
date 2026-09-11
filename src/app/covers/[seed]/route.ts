import { isMotif, renderCover } from '@/lib/covers';

/**
 * Serves the procedurally generated cover artwork described in `lib/covers.ts`.
 *
 * Output is a pure function of the seed, so it is immutable and cached
 * aggressively. `seed` is split on `__` and the motif half is checked against a
 * closed set — nothing from the URL reaches the SVG body.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ seed: string }> },
): Promise<Response> {
  const { seed } = await context.params;
  const cleaned = seed.replace(/\.svg$/i, '');
  const [motifPart, ...rest] = cleaned.split('__');
  const motif = motifPart && isMotif(motifPart) ? motifPart : 'local';
  const key = rest.join('__') || cleaned;

  return new Response(renderCover(motif, key), {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
