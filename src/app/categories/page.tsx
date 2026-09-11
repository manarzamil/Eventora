import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { listCategories } from '@/server/services/event-service';
import { CategoryIcon } from '@/components/category-icon';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Browse everything on Eventora by the kind of thing it is.',
};

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <div className="container-page py-12">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
          Browse by category
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-mist-600">
          Ten categories cover everything on the platform. Pick one to see it across every city, or
          start from a destination if you already know where you are going.
        </p>
      </header>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="group flex flex-col rounded-2xl border border-mist-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift"
          >
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
              <CategoryIcon name={category.icon} className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-ink-950">{category.name}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-mist-600">
              {category.description}
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
              {category.eventCount} listings
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
