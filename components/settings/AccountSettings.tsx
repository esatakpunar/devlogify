'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, LogOut, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { User } from '@supabase/supabase-js'
import { useTranslation } from '@/lib/i18n/useTranslation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface AccountSettingsProps {
  user: User
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslation()

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error(t('account.passwordsDoNotMatch'))
      return
    }

    if (newPassword.length < 6) {
      toast.error(t('account.passwordMustBeAtLeast6'))
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast.success(t('account.passwordUpdatedSuccessfully'))
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Failed to update password:', error)
      toast.error(t('account.failedToUpdatePassword'))
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleDeleteAccount = async () => {
    toast.error(t('account.accountDeletionNotAvailable'))
  }

  return (
    <div className="space-y-8">
      {/* Change Password */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">{t('account.changePassword')}</h3>
          <p className="text-sm text-gray-600">
            {t('account.updatePasswordToKeepSecure')}
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">{t('account.newPassword')}</Label>
            <Input
              id="new-password"
              type="password"
              placeholder={t('account.enterNewPassword')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t('account.confirmPassword')}</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder={t('account.confirmNewPassword')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? t('account.updating') : t('account.updatePassword')}
          </Button>
        </form>
      </div>

      {/* Sign Out */}
      <div className="space-y-4 pt-6 border-t">
        <div>
          <h3 className="text-lg font-medium">{t('account.signOut')}</h3>
          <p className="text-sm text-gray-600">
            {t('account.signOutFromAccount')}
          </p>
        </div>

        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          {t('account.signOut')}
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="space-y-4 pt-6 border-t border-red-200">
        <div>
          <h3 className="text-lg font-medium text-red-600">{t('account.dangerZone')}</h3>
          <p className="text-sm text-gray-600">
            {t('account.irreversibleActions')}
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900">{t('account.deleteAccount')}</h4>
              <p className="text-sm text-red-700 mt-1">
                {t('account.deleteAccountDescription')}
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="mt-4">
                <Trash2 className="w-4 h-4 mr-2" />
                {t('account.deleteAccount')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('account.areYouAbsolutelySure')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('account.deleteAccountWarning')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                  {t('account.deleteAccount')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}