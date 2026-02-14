'use client'

import { useState, useMemo } from 'react'
import { Check, ChevronsUpDown, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'
import type { CompanyMemberWithProfile } from '@/types/supabase'

interface UserPickerProps {
  members: CompanyMemberWithProfile[]
  selectedUserId: string | null
  onSelect: (userId: string | null) => void
  placeholder?: string
  label?: string
  disabled?: boolean
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  return email[0].toUpperCase()
}

export function UserPicker({
  members,
  selectedUserId,
  onSelect,
  placeholder,
  label,
  disabled = false,
}: UserPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const t = useTranslation()

  const filteredMembers = useMemo(() => {
    if (!search) return members
    const lower = search.toLowerCase()
    return members.filter(m =>
      m.profile.full_name?.toLowerCase().includes(lower) ||
      m.profile.email.toLowerCase().includes(lower)
    )
  }, [members, search])

  const selectedMember = useMemo(
    () => members.find(m => m.user_id === selectedUserId),
    [members, selectedUserId]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 text-sm"
          disabled={disabled}
        >
          {selectedMember ? (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-5 w-5">
                <AvatarImage src={selectedMember.profile.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">
                  {getInitials(selectedMember.profile.full_name, selectedMember.profile.email)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">
                {selectedMember.profile.full_name || selectedMember.profile.email}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">
              {placeholder || t('tasks.selectMember')}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {selectedUserId && (
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted text-muted-foreground"
              onClick={() => {
                onSelect(null)
                setOpen(false)
                setSearch('')
              }}
            >
              <X className="h-4 w-4" />
              {t('tasks.clearSelection')}
            </button>
          )}
          {filteredMembers.map((member) => (
            <button
              key={member.id}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted",
                selectedUserId === member.user_id && "bg-muted"
              )}
              onClick={() => {
                onSelect(member.user_id === selectedUserId ? null : member.user_id)
                setOpen(false)
                setSearch('')
              }}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={member.profile.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">
                  {getInitials(member.profile.full_name, member.profile.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <div className="truncate font-medium">
                  {member.profile.full_name || member.profile.email}
                </div>
                {member.profile.full_name && (
                  <div className="truncate text-xs text-muted-foreground">
                    {member.profile.email}
                  </div>
                )}
              </div>
              {selectedUserId === member.user_id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
          {filteredMembers.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t('common.noResults')}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
