import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, SearchX } from 'lucide-react';
import { listCategories, listEvents } from '@/server/services/event-service';
import { getFavoriteIds } from '@/server/services/favorite-service';
import { readSession } from '@/server/auth/session';
import { EventCardItem } from '@/components/event-card';
import { Pagination } from '@/components/pagination';
import { CategoryIcon } from '@/components/category-icon';
import { ButtonLink } from '@/components/ui/button';
import { eventQuerySchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = (await listCategories()).find((c) => c.slug === slug);
  return {
    title: category ? category.name : 'Category',
    description: category?.description,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const rawSearch = await searchParams;

  const categories = await listCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const parsed = eventQuerySchema.safeParse({ ...rawSearch, categories: slug });
  const query = parsed.success ? parsed.data : eventQuerySchema.parse({ categories: slug });

  const session = await readSession();
  const [results, favorites] = await Promise.all([
    listEvents({ ...query, categories: [slug] }),
    session ? getFavoriteIds(session.sub) : Promise.resolve(new Set<string>()),
  ]);

  return (
    <div className="container-page py-10">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-mist-600">
          <li>
            <Link href="/categories" className="hover:text-brand-700">
              Categories
            </Link>
          </li>
          <ChevronRight className="h-3.5 w-3.5 text-mist-400" aria-hidden />
          <li className="font-medium text-ink-900" aria-current="page">
            {category.name}
          </li>
        </ol>
      </nav>

      <header className="flex items-start gap-5">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white">
          <CategoryIcon name={category.icon} className="h-6 w-6" />
        </span>
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-ink-950">{category.name}</h1>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-mist-600">
            {category.description}
          </p>
          <p className="mt-2 text-sm text-mist-500">
            {results.total} {results.total === 1 ? 'listing' : 'listings'} across every destination
          </p>
        </div>
      </header>

      {results.items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-mist-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-mist-100 text-mist-500">
            <SearchX className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-ink-950">Nothing here right now</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-mist-600">
            No upcoming dates are listed in this category. Try another one, or browse by city.
          </p>
          <ButtonLink href="/categories" variant="secondary" className="mt-5">
            All categories
          </ButtonLink>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.items.map((event) => (
              <EventCardItem
                key={event.id}
                event={event}
                favorited={favorites.has(event.id)}
                signedIn={Boolean(session)}
              />
            ))}
          </div>

          <Pagination
            page={results.page}
            pageCount={results.pageCount}
            basePath={`/categories/${slug}`}
            searchParams={rawSearch}
          />
        </>
      )}
    </div>
  );
}
