'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { getDateRange } from '@/lib/utils'
import { cn } from '@/lib/utils'

type PeriodSelectorProps = {
  value: string
  onChange: (preset: string, from: Date, to: Date) => void
}

const PRESETS = [
  'Hoje',
  'Ontem',
  'Últimos 7 dias',
  'Últimos 30 dias',
  'Este mês',
  'Mês anterior',
  'Período personalizado'
]

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const [open, setOpen] = useState(false)
  
  const handleSelect = (preset: string) => {
    if (preset !== 'Período personalizado') {
      const { from, to } = getDateRange(preset)
      onChange(preset, from, to)
      setOpen(false)
    } else {
      // Simplified fallback for custom
      const now = new Date()
      onChange(preset, now, now)
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white dark:bg-[#081A33] border border-slate-200 dark:border-[#142C52] rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#0E2547] shadow-sm transition-colors"
      >
        <Calendar className="w-4 h-4 text-[#0066FF] dark:text-[#00D4FF]" />
        {value}
        <ChevronDown className="w-4 h-4 ml-1 text-slate-400" />
      </button>
      
      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-56 bg-white dark:bg-[#081A33] border border-slate-200 dark:border-[#142C52] rounded-xl shadow-xl z-50 py-1.5 overflow-hidden">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => handleSelect(preset)}
              className={cn(
                "block w-full text-left px-4 py-2 text-sm transition-colors",
                value === preset ? "bg-slate-100 dark:bg-[#0E2547] font-bold text-[#0066FF] dark:text-[#00D4FF]" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#0E2547]/60"
              )}
            >
              {preset}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
