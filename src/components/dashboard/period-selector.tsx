'use client'

import { useState } from 'react'
import { Calendar, ChevronDown, Check } from 'lucide-react'
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
  'Últimos 15 dias',
  'Últimos 30 dias',
  'Últimos 60 dias',
  'Últimos 90 dias',
  'Este mês',
  'Mês anterior',
  'Personalizado'
]

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const [open, setOpen] = useState(false)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [isCustomMode, setIsCustomMode] = useState(false)
  
  const handleSelect = (preset: string) => {
    if (preset !== 'Personalizado') {
      setIsCustomMode(false)
      const { from, to } = getDateRange(preset)
      onChange(preset, from, to)
      setOpen(false)
    } else {
      setIsCustomMode(true)
    }
  }

  const handleApplyCustom = () => {
    if (customFrom && customTo) {
      const from = new Date(`${customFrom}T00:00:00`)
      const to = new Date(`${customTo}T23:59:59.999`)
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        onChange(`Personalizado: ${customFrom} - ${customTo}`, from, to)
        setOpen(false)
      }
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white dark:bg-[#081A33] border border-slate-200 dark:border-[#142C52] rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#0E2547] shadow-sm transition-colors"
      >
        <Calendar className="w-3.5 h-3.5 text-[#0066FF] dark:text-[#00D4FF]" />
        <span className="truncate max-w-[180px]">{value}</span>
        <ChevronDown className="w-3.5 h-3.5 ml-1 text-slate-400 shrink-0" />
      </button>
      
      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-64 bg-white dark:bg-[#081A33] border border-slate-200 dark:border-[#142C52] rounded-xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in">
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-[#142C52]/60">
            <div className="py-1">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleSelect(preset)}
                  className={cn(
                    "flex items-center justify-between w-full text-left px-4 py-2 text-xs transition-colors",
                    value.startsWith(preset) ? "bg-blue-50/70 dark:bg-[#0E2547] font-bold text-[#0066FF] dark:text-[#00D4FF]" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#0E2547]/60"
                  )}
                >
                  <span>{preset}</span>
                  {value.startsWith(preset) && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>

            {isCustomMode && (
              <div className="p-3 bg-slate-50 dark:bg-[#061224] space-y-2.5">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Selecionar Intervalo:</p>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Data Inicial:</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-[#081A33] border border-slate-200 dark:border-[#142C52] rounded text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Data Final:</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-[#081A33] border border-slate-200 dark:border-[#142C52] rounded text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
                <button
                  onClick={handleApplyCustom}
                  disabled={!customFrom || !customTo}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow disabled:opacity-50"
                >
                  Aplicar Período
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
