import { createClient } from '@/lib/supabase/server'
import { FolderKanban, Clock, CheckCircle2, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Proje sayısını al
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)
    .eq('status', 'active')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.email?.split('@')[0]}!
          </p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button>
            <FolderKanban className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold mt-2">{projectCount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasks Today</p>
              <p className="text-2xl font-bold mt-2">0</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Time Today</p>
              <p className="text-2xl font-bold mt-2">0h</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold mt-2">0h</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/dashboard/projects/new" className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <FolderKanban className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-medium">Create Project</h3>
            <p className="text-sm text-gray-600 mt-1">Start a new project</p>
          </Link>
          <Link href="/dashboard/timeline" className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <Clock className="w-8 h-8 text-purple-600 mb-2" />
            <h3 className="font-medium">View Timeline</h3>
            <p className="text-sm text-gray-600 mt-1">See your activity log</p>
          </Link>
          <Link href="/dashboard/notes" className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <CheckCircle2 className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-medium">Quick Note</h3>
            <p className="text-sm text-gray-600 mt-1">Capture an idea</p>
          </Link>
        </div>
      </div>

      {/* Getting Started (sadece proje yoksa göster) */}
      {projectCount === 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
          <h2 className="text-lg font-semibold mb-2">🚀 Get Started</h2>
          <p className="text-gray-700 mb-4">
            Welcome to Devlogify! Create your first project to start tracking your work.
          </p>
          <Link href="/dashboard/projects/new">
            <Button>Create Your First Project</Button>
          </Link>
        </div>
      )}
    </div>
  )
}