'use client'

import { Sheet, SheetContent, SheetTitle, VisuallyHidden } from '@/components/ui/sheet'
import { Sidebar } from './Sidebar'

interface MobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-64">
        <VisuallyHidden>
          <SheetTitle>Navigation Menu</SheetTitle>
        </VisuallyHidden>
        <Sidebar onLinkClick={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}