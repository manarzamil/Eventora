import {
  Compass,
  Landmark,
  MapPin,
  Mountain,
  Music,
  Palette,
  Sparkles,
  Trophy,
  Users,
  Waves,
  type LucideIcon,
} from 'lucide-react';

/**
 * Category rows store an icon *name*, not a component, so an administrator can
 * add a category through the dashboard without a deploy. This map is the closed
 * set of names the interface knows how to draw; anything unrecognised falls back
 * to a pin rather than rendering nothing.
 */
const ICONS: Record<string, LucideIcon> = {
  Sparkles,
  Music,
  Mountain,
  Waves,
  Landmark,
  Trophy,
  Compass,
  Palette,
  Users,
  MapPin,
};

export function CategoryIcon({
  name,
  className = 'h-4 w-4',
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? MapPin;
  return <Icon className={className} strokeWidth={1.9} aria-hidden />;
}

export const CATEGORY_ICON_NAMES = Object.keys(ICONS);
