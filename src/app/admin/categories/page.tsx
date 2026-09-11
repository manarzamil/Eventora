import { listCategories } from '@/server/services/event-service';
import { CreateCategoryPanel } from '@/components/admin/destination-panels';
import { ApiActionButton } from '@/components/admin/api-action-button';
import { CategoryIcon, CATEGORY_ICON_NAMES } from '@/components/category-icon';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Categories' };

export default async function AdminCategoriesPage() {
  const categories = await listCategories();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-ink-950">Categories</h2>
        <p className="mt-0.5 text-sm text-mist-600">
          Every event belongs to exactly one category. A category with events cannot be deleted.
        </p>
      </div>

      <div className="max-w-2xl">
        <CreateCategoryPanel iconNames={CATEGORY_ICON_NAMES} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex flex-col rounded-2xl border border-mist-200 bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <CategoryIcon name={category.icon} className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-mist-100 px-2.5 py-1 text-xs font-medium text-mist-600">
                {category.eventCount} events
              </span>
            </div>

            <h3 className="mt-3.5 text-base font-semibold text-ink-950">{category.name}</h3>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-mist-600">
              {category.description}
            </p>

            <div className="mt-4 flex items-center justify-between border-t border-mist-200 pt-3.5">
              <code className="text-xs text-mist-500">{category.slug}</code>
              {category.eventCount === 0 ? (
                <ApiActionButton
                  endpoint={`/api/admin/categories/${category.id}`}
                  method="DELETE"
                  label="Delete"
                  variant="ghost"
                  confirmLabel="Delete"
                  confirmMessage="Delete this category?"
                />
              ) : (
                <span className="text-xs text-mist-400">In use</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
