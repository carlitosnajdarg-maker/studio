
"use client"

import { cn } from "@/lib/utils"

interface CategoryNavProps {
  categories: string[]
  activeCategory: string
  onCategoryChange: (category: string) => void
}

export function CategoryNav({ categories, activeCategory, onCategoryChange }: CategoryNavProps) {
  return (
    <div className="sticky top-0 z-30 w-full bg-[#120108]/90 backdrop-blur-md py-4 px-5">
      <div className="flex gap-3 overflow-x-auto no-scrollbar custom-scrollbar pb-2 -mx-5 px-5 scroll-smooth">
        {categories.map((category) => {
          const isActive = activeCategory === category
          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={cn(
                "whitespace-nowrap px-6 py-2.5 rounded-[50px] font-bold text-sm transition-all duration-300",
                isActive
                  ? "bg-[#FF008A] text-white neon-glow-magenta"
                  : "bg-white/5 text-[#B0B0B0] hover:bg-white/10"
              )}
            >
              {category}
            </button>
          )
        })}
      </div>
    </div>
  )
}
