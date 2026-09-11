/**
 * Procedural cover artwork.
 *
 * Eventora ships no binary image assets. Every cover in the demo dataset is a
 * deterministic SVG generated from a seed string, so the repository stays small,
 * works offline, and never depends on a third-party image host that might change
 * or rate-limit. Swapping in real photography means nothing more than storing a
 * different URL in `events.hero_image_url` — the schema already accepts any URL.
 *
 * Seed format: `<motif>__<slug>.svg`, e.g. `marine__kuwait-bay-dhow-cruise.svg`.
 */

export type Motif =
  | 'entertainment'
  | 'concerts'
  | 'outdoor'
  | 'marine'
  | 'cultural'
  | 'sports'
  | 'experiences'
  | 'workshops'
  | 'family'
  | 'local'
  | 'city'
  | 'country';

const MOTIFS = new Set<Motif>([
  'entertainment',
  'concerts',
  'outdoor',
  'marine',
  'cultural',
  'sports',
  'experiences',
  'workshops',
  'family',
  'local',
  'city',
  'country',
]);

export function isMotif(value: string): value is Motif {
  return MOTIFS.has(value as Motif);
}

/**
 * Every palette is anchored in the product's blue identity; the accent shifts
 * per motif so a discovery grid reads as one system while categories stay
 * visually distinguishable.
 */
const PALETTES: Record<Motif, [string, string, string]> = {
  entertainment: ['#131C4A', '#3B3AA8', '#8B7BF0'],
  concerts: ['#101A45', '#4C2FA8', '#A855F7'],
  outdoor: ['#0B2540', '#12639B', '#38BDF8'],
  marine: ['#04283F', '#0E7490', '#22D3EE'],
  cultural: ['#141C3F', '#2B4EA8', '#7DA6F5'],
  sports: ['#0A2B49', '#1360C4', '#4ADE80'],
  experiences: ['#132445', '#2352B8', '#F0A64B'],
  workshops: ['#152039', '#2F5AA6', '#94C4F5'],
  family: ['#0F2350', '#2E5CD6', '#67C7F5'],
  local: ['#101F3D', '#27509E', '#8FB4EE'],
  city: ['#071A38', '#123C86', '#4C8FE8'],
  country: ['#061428', '#0E3570', '#3B82F6'],
};

/** FNV-1a. Small, fast, and stable across Node versions. */
function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic pseudo-random sequence seeded by `hash`. */
function rng(seed: number) {
  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0xffffffff;
  };
}

const W = 1200;
const H = 800;

function motifLayer(motif: Motif, next: () => number, accent: string): string {
  const soft = `rgba(255,255,255,0.14)`;
  const softer = `rgba(255,255,255,0.08)`;

  switch (motif) {
    case 'marine': {
      // Stacked sine waves.
      let out = '';
      for (let i = 0; i < 5; i += 1) {
        const y = 380 + i * 78;
        const amp = 26 + next() * 26;
        const phase = next() * 200;
        const d = `M -60 ${y} C ${180 + phase} ${y - amp}, ${420 + phase} ${y + amp}, ${640} ${y} S ${1020} ${y - amp}, ${W + 60} ${y}`;
        out += `<path d="${d}" fill="none" stroke="${i % 2 ? softer : soft}" stroke-width="${3 + i}" stroke-linecap="round"/>`;
      }
      return out;
    }
    case 'outdoor': {
      // Layered mountain ridges.
      let out = '';
      for (let i = 0; i < 3; i += 1) {
        const base = 820 - i * 40;
        const peak = 380 + i * 90 + next() * 60;
        const mid = 300 + next() * 600;
        out += `<path d="M -40 ${base} L ${mid - 260} ${peak + 90} L ${mid} ${peak} L ${mid + 240} ${peak + 120} L ${W + 40} ${base} Z" fill="rgba(255,255,255,${0.06 + i * 0.04})"/>`;
      }
      out += `<circle cx="${880 + next() * 160}" cy="${200 + next() * 80}" r="58" fill="${accent}" opacity="0.5"/>`;
      return out;
    }
    case 'concerts': {
      // Equaliser bars.
      let out = '';
      const bars = 26;
      for (let i = 0; i < bars; i += 1) {
        const x = 60 + i * ((W - 120) / bars);
        const h = 60 + next() * 380;
        out += `<rect x="${x.toFixed(1)}" y="${(H - 90 - h).toFixed(1)}" width="18" height="${h.toFixed(1)}" rx="9" fill="rgba(255,255,255,${(0.06 + next() * 0.14).toFixed(3)})"/>`;
      }
      return out;
    }
    case 'sports': {
      // Motion arcs.
      let out = '';
      for (let i = 0; i < 6; i += 1) {
        const r = 180 + i * 90;
        out += `<circle cx="${240}" cy="${H + 80}" r="${r}" fill="none" stroke="rgba(255,255,255,${(0.16 - i * 0.02).toFixed(3)})" stroke-width="6" stroke-dasharray="${40 + next() * 200} ${60 + next() * 120}"/>`;
      }
      return out;
    }
    case 'cultural': {
      // Repeating arches — a nod to regional architecture.
      let out = '';
      for (let i = 0; i < 6; i += 1) {
        const x = 90 + i * 180;
        const h = 300 + next() * 140;
        out += `<path d="M ${x} ${H - 70} L ${x} ${H - 70 - h} A 70 70 0 0 1 ${x + 140} ${H - 70 - h} L ${x + 140} ${H - 70}" fill="none" stroke="rgba(255,255,255,${(0.08 + next() * 0.1).toFixed(3)})" stroke-width="8"/>`;
      }
      return out;
    }
    case 'workshops': {
      // Concentric squares, rotated — a maker's grid.
      let out = '';
      for (let i = 0; i < 7; i += 1) {
        const s = 120 + i * 92;
        out += `<rect x="${(W / 2 - s / 2).toFixed(0)}" y="${(H / 2 - s / 2).toFixed(0)}" width="${s}" height="${s}" rx="26" fill="none" stroke="rgba(255,255,255,${(0.15 - i * 0.016).toFixed(3)})" stroke-width="5" transform="rotate(${(i * 7 - 14).toFixed(1)} ${W / 2} ${H / 2})"/>`;
      }
      return out;
    }
    case 'family': {
      // Scattered soft dots at varying scale.
      let out = '';
      for (let i = 0; i < 34; i += 1) {
        const cx = next() * W;
        const cy = next() * H;
        const r = 8 + next() * 46;
        out += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="rgba(255,255,255,${(0.04 + next() * 0.1).toFixed(3)})"/>`;
      }
      return out;
    }
    case 'entertainment': {
      // Spotlight beams from the top edge.
      let out = '';
      for (let i = 0; i < 5; i += 1) {
        const x = 120 + i * 240 + next() * 60;
        out += `<path d="M ${x} -20 L ${x - 150} ${H + 20} L ${x + 90} ${H + 20} Z" fill="rgba(255,255,255,${(0.05 + next() * 0.07).toFixed(3)})"/>`;
      }
      return out;
    }
    case 'experiences': {
      // Interlocking rings.
      let out = '';
      for (let i = 0; i < 5; i += 1) {
        const cx = 180 + next() * (W - 360);
        const cy = 180 + next() * (H - 360);
        const r = 90 + next() * 170;
        out += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="none" stroke="rgba(255,255,255,${(0.07 + next() * 0.09).toFixed(3)})" stroke-width="7"/>`;
      }
      return out;
    }
    case 'city':
    case 'local': {
      // Skyline silhouette.
      let out = '';
      let x = -30;
      while (x < W + 30) {
        const w = 60 + next() * 90;
        const h = 150 + next() * 420;
        out += `<rect x="${x.toFixed(0)}" y="${(H - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="rgba(255,255,255,${(0.05 + next() * 0.08).toFixed(3)})" rx="6"/>`;
        x += w + 12 + next() * 20;
      }
      return out;
    }
    case 'country': {
      // Meridian grid.
      let out = '';
      for (let i = 1; i < 9; i += 1) {
        out += `<line x1="${(i * W) / 9}" y1="0" x2="${(i * W) / 9 - 120}" y2="${H}" stroke="rgba(255,255,255,0.07)" stroke-width="3"/>`;
      }
      for (let i = 1; i < 6; i += 1) {
        out += `<ellipse cx="${W / 2}" cy="${H / 2}" rx="${W / 2 - 40}" ry="${i * 70}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3"/>`;
      }
      return out;
    }
    default:
      return '';
  }
}

/** Renders a deterministic SVG cover for `seed`. */
export function renderCover(motif: Motif, seed: string): string {
  const h = hash(`${motif}:${seed}`);
  const next = rng(h);
  const [dark, mid, accent] = PALETTES[motif];

  const angle = 20 + (h % 50);
  const bx = 20 + next() * 60;
  const by = 15 + next() * 40;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${motif} cover artwork">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(${angle} 0.5 0.5)">
      <stop offset="0%" stop-color="${dark}"/>
      <stop offset="55%" stop-color="${mid}"/>
      <stop offset="100%" stop-color="${dark}"/>
    </linearGradient>
    <radialGradient id="glow" cx="${bx}%" cy="${by}%" r="70%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vig" cx="50%" cy="45%" r="75%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.42"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g>${motifLayer(motif, next, accent)}</g>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.05"/>
</svg>`;
}

/** Builds the URL stored in the database for a given motif + slug. */
export function coverUrl(motif: Motif, slug: string): string {
  return `/covers/${motif}__${slug}.svg`;
}
