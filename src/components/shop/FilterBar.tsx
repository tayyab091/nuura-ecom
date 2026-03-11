'use client'

import { PRODUCT_CATEGORIES } from '@/lib/constants'

interface FilterBarProps {
  activeCategory: string | null
  activeFilter: string | null
  onCategoryChange: (category: string | null) => void
  onFilterChange: (filter: string | null) => void
}

const FILTERS = [
  { label: 'All', value: null },
  { label: 'New Drops', value: 'new' },
  { label: 'Bestsellers', value: 'bestseller' },
  { label: 'On Sale', value: 'sale' },
]

export default function FilterBar({
  activeCategory,
  activeFilter,
  onCategoryChange,
  onFilterChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-6 mb-10">
      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange(null)}
          className={`px-4 py-2 font-sans text-xs tracking-wide uppercase border transition-colors duration-200 ${
            activeCategory === null
              ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]'
              : 'bg-transparent text-[#8A7F7A] border-[#EDE0D4] hover:border-[#2C2C2C] hover:text-[#2C2C2C]'
          }`}
        >
          All
        </button>
        {PRODUCT_CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => onCategoryChange(cat.slug)}
            className={`px-4 py-2 font-sans text-xs tracking-wide uppercase border transition-colors duration-200 ${
              activeCategory === cat.slug
                ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]'
                : 'bg-transparent text-[#8A7F7A] border-[#EDE0D4] hover:border-[#2C2C2C] hover:text-[#2C2C2C]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Additional Filters */}
      <div className="flex flex-wrap gap-2 sm:ml-auto">
        {FILTERS.map((filter) => (
          <button
            key={String(filter.value)}
            onClick={() => onFilterChange(filter.value)}
            className={`px-4 py-2 font-sans text-xs tracking-wide uppercase border transition-colors duration-200 ${
              activeFilter === filter.value
                ? 'bg-[#F5F0E6] text-[#2C2C2C] border-[#8A7F7A]'
                : 'bg-transparent text-[#8A7F7A] border-[#EDE0D4] hover:border-[#8A7F7A]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  )
}
