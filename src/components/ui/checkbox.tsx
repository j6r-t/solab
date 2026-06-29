'use client'

import { type ComponentProps } from 'react'

interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type' | 'onChange'> {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
}

export function Checkbox({ checked, onCheckedChange, className = '', ...props }: CheckboxProps) {
    return (
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            className={`h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer ${className}`}
            {...props}
        />
    )
}
