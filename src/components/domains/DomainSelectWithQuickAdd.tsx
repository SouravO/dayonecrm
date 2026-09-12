'use client'

import React, { useState, useTransition, useRef, useEffect } from 'react'
import { Plus, Check, X, FolderPlus } from 'lucide-react'
import { createDomain } from '@/features/domains/actions'
import type { Domain } from '@/types'

interface Props {
  startupId: string
  initialDomains: Domain[]
  defaultValue?: string
  onChange?: (domainId: string) => void
  name?: string
  className?: string
}

export function DomainSelectWithQuickAdd({
  startupId,
  initialDomains = [],
  defaultValue = '',
  onChange,
  name = 'domain_id',
  className = '',
}: Props) {
  const [domainList, setDomainList] = useState<Domain[]>(initialDomains)
  const [selectedId, setSelectedId] = useState<string>(defaultValue)
  const [isAdding, setIsAdding] = useState(false)
  const [newDomainName, setNewDomainName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync if initialDomains changes externally
  useEffect(() => {
    setDomainList(initialDomains)
  }, [initialDomains])

  // Sync if defaultValue changes externally (e.g. switching edit modal task)
  useEffect(() => {
    setSelectedId(defaultValue)
  }, [defaultValue])

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAdding])

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === '__ADD_NEW__') {
      setIsAdding(true)
      return
    }
    setSelectedId(val)
    if (onChange) onChange(val)
  }

  const handleQuickAdd = (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const trimmed = newDomainName.trim()
    if (!trimmed) {
      setError('Please enter a domain name')
      return
    }

    // Check if domain already exists
    const exists = domainList.find(
      (d) => d.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (exists) {
      setSelectedId(exists.id)
      if (onChange) onChange(exists.id)
      setIsAdding(false)
      setNewDomainName('')
      setSuccessMsg(`"${exists.name}" selected`)
      setTimeout(() => setSuccessMsg(null), 2500)
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('startup_id', startupId)
        formData.append('name', trimmed)

        const res = await createDomain({}, formData)
        if (res.error) {
          setError(res.error)
        } else if (res.data) {
          const created = res.data as Domain
          setDomainList((prev) => [...prev, created])
          setSelectedId(created.id)
          if (onChange) onChange(created.id)
          setIsAdding(false)
          setNewDomainName('')
          setSuccessMsg(`"${created.name}" created & selected!`)
          setTimeout(() => setSuccessMsg(null), 3000)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to add domain'
        setError(msg)
      }
    })
  }

  return (
    <div className={`form-group ${className}`} style={{ position: 'relative' }}>
      {/* Label Row with Quick Add Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <label className="label" style={{ marginBottom: 0 }}>
          Domain
        </label>
        {!isAdding && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              setIsAdding(true)
              setError(null)
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-brand)',
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '2px 4px',
              borderRadius: 4,
              transition: 'opacity 0.15s ease',
            }}
            title="Create a new functional domain right here without leaving this form"
          >
            <Plus size={12} />
            <span>New Domain</span>
          </button>
        )}
      </div>

      {/* Main Select Input */}
      <select
        name={name}
        className="input"
        value={selectedId}
        onChange={handleSelectChange}
        style={{ width: '100%' }}
      >
        <option value="">No domain</option>
        {domainList.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
        <option value="__ADD_NEW__" style={{ color: 'var(--color-brand)', fontWeight: 600 }}>
          + Add new domain...
        </option>
      </select>

      {/* Success Notification */}
      {successMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11.5,
            color: '#059669',
            marginTop: 4,
            fontWeight: 600,
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <Check size={12} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Inline Quick Add Domain Mini-Form */}
      {isAdding && (
        <div
          style={{
            marginTop: 8,
            padding: '10px 12px',
            background: '#faf7f0',
            border: '1px solid #e0d8c7',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(45, 38, 25, 0.05)',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#6e6354',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <FolderPlus size={12} color="var(--color-brand)" />
            <span>Create & Select New Domain</span>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              ref={inputRef}
              type="text"
              value={newDomainName}
              onChange={(e) => {
                setNewDomainName(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleQuickAdd(e)
                } else if (e.key === 'Escape') {
                  setIsAdding(false)
                  setError(null)
                }
              }}
              placeholder="e.g. Growth Marketing, Logistics, R&D..."
              className="input"
              style={{
                fontSize: 12.5,
                padding: '6px 10px',
                flex: 1,
                background: '#ffffff',
              }}
              disabled={isPending}
            />

            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={isPending || !newDomainName.trim()}
              className="btn btn-primary btn-sm"
              style={{
                fontSize: 12,
                padding: '6px 12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
              }}
            >
              {isPending ? (
                <span>Adding…</span>
              ) : (
                <>
                  <Check size={12} />
                  <span>Add</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAdding(false)
                setNewDomainName('')
                setError(null)
              }}
              disabled={isPending}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: 12,
                padding: '6px 8px',
                flexShrink: 0,
              }}
              title="Cancel"
            >
              <X size={13} />
            </button>
          </div>

          {error && (
            <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4, fontWeight: 500 }}>
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
