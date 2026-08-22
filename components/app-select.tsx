'use client'

import { useState } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { CaretDown, Check } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

export type AppSelectOption = {
  value: string
  label: string
  dot?: string | null
  icon?: ReactNode
  disabled?: boolean
}

const EMPTY = '__empty__'

export default function AppSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  placeholder = 'Pilih…',
  id,
  disabled,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: {
  options: AppSelectOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  name?: string
  placeholder?: string
  id?: string
  disabled?: boolean
  'aria-label'?: string
  'aria-describedby'?: string
}) {
  const [uncontrolled, setUncontrolled] = useState<string | undefined>(defaultValue)
  const current = value !== undefined ? value : (uncontrolled ?? '')
  const selected = options.find((o) => o.value === current)

  return (
    <SelectPrimitive.Root
      name={name}
      disabled={disabled}
      {...(value !== undefined
        ? { value: current === '' ? undefined : current }
        : {})}
      defaultValue={defaultValue || undefined}
      onValueChange={(v) => {
        const external = v === EMPTY ? '' : v
        setUncontrolled(external)
        onValueChange?.(external)
      }}
    >
      <SelectPrimitive.Trigger
        className="app-select-trigger"
        id={id}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      >
        <span className="app-select-value" data-empty={!selected}>
          {selected ? (
            <>
              {selected.dot ? <i className="app-select-dot" style={{ background: selected.dot }} /> : null}
              {selected.icon ? <span className="app-select-opticon">{selected.icon}</span> : null}
              <span className="app-select-label">{selected.label}</span>
            </>
          ) : (
            <span className="app-select-label">{placeholder}</span>
          )}
        </span>
        <SelectPrimitive.Icon className="app-select-caret">
          <CaretDown size={13} weight="bold" aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="app-select-content" position="popper" sideOffset={6} align="start">
          <SelectPrimitive.ScrollUpButton className="app-select-scroll-btn" aria-hidden>
            <CaretDown size={12} weight="bold" style={{ transform: 'rotate(180deg)' }} />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="app-select-viewport">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value || EMPTY}
                value={opt.value || EMPTY}
                disabled={opt.disabled}
                className="app-select-item"
              >
                <span className="app-select-leader">
                  {opt.dot ? <i className="app-select-dot" style={{ background: opt.dot }} /> : null}
                  {opt.icon ? <span className="app-select-opticon">{opt.icon}</span> : null}
                </span>
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="app-select-check">
                  <Check size={13} weight="bold" aria-hidden="true" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="app-select-scroll-btn" aria-hidden>
            <CaretDown size={12} weight="bold" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
