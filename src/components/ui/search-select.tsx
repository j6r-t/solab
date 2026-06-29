'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Search, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SearchSelectOption {
    value: string
    label: string
    secondary?: string
}

interface SearchSelectProps {
    options: SearchSelectOption[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    title?: string
    disabled?: boolean
}

export function SearchSelect({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    emptyMessage = 'No results found',
    title = 'Select',
    disabled = false,
}: SearchSelectProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')

    const selected = options.find((o) => o.value === value)

    const filtered = useMemo(() => {
        if (!search.trim()) return options
        const q = search.toLowerCase()
        return options.filter(
            (o) =>
                o.label.toLowerCase().includes(q) ||
                (o.secondary && o.secondary.toLowerCase().includes(q))
        )
    }, [options, search])

    function handleSelect(val: string) {
        onChange(val)
        setOpen(false)
        setSearch('')
    }

    return (
        <>
            <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={() => setOpen(true)}
                className="w-full justify-between font-normal h-9"
            >
                <span className={cn('truncate', !selected && 'text-muted-foreground')}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Button>
            <Dialog open={open} onOpenChange={(o) => { if (!o) setSearch(''); setOpen(o) }}>
                <DialogContent className="max-w-md p-0 gap-0">
                    <DialogHeader className="px-4 pt-4 pb-0">
                        <DialogTitle className="text-sm font-medium">{title}</DialogTitle>
                    </DialogHeader>
                    <div className="relative mx-4 mt-3 mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="pl-10 h-9"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto pb-2">
                        {filtered.length === 0 ? (
                            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                                {emptyMessage}
                            </p>
                        ) : (
                            filtered.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent',
                                        option.value === value && 'bg-accent/50'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                                            option.value === value
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-muted-foreground/30'
                                        )}
                                    >
                                        {option.value === value && <Check className="h-3 w-3" />}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium">{option.label}</p>
                                        {option.secondary && (
                                            <p className="truncate text-xs text-muted-foreground">
                                                {option.secondary}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
