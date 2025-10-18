import { createClient } from '@/lib/supabase/server'
import { FolderKanban, Clock, CheckCircle2, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AnimatedCard } from '@/components/ui/AnimatedCard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Proje sayısını al
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)
    .eq('status', 'active')

  const stats = [
    {
      title: 'Active Projects',
      value: projectCount || 0,
      icon: FolderKanban,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Tasks Today',
      value: 0,
      icon: CheckCircle2,
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Time Today',
      value: '0h',
      icon: Clock,
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'This Week',
      value: '0h',
      icon: TrendingUp,
      color: 'orange',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
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
        {stats.map((stat, index) => (
          <AnimatedCard key={stat.title} delay={index * 0.1}>
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold mt-2 dark:text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Quick Actions - animasyonlu */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { href: '/dashboard/projects/new', icon: FolderKanban, title: 'Create Project', desc: 'Start a new project', color: 'blue' },
            { href: '/dashboard/timeline', icon: Clock, title: 'View Timeline', desc: 'See your activity log', color: 'purple' },
            { href: '/dashboard/notes', icon: CheckCircle2, title: 'Quick Note', desc: 'Capture an idea', color: 'green' },
          ].map((action, index) => (
            <AnimatedCard key={action.href} delay={0.5 + index * 0.1}>
              <Link 
                href={action.href} 
                className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all block"
              >
                <action.icon className={`w-8 h-8 text-${action.color}-600 dark:text-${action.color}-400 mb-2`} />
                <h3 className="font-medium dark:text-white">{action.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{action.desc}</p>
              </Link>
            </AnimatedCard>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      {projectCount === 0 && (
        <AnimatedCard delay={0.8}>
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
            <h2 className="text-lg font-semibold mb-2 dark:text-white">🚀 Get Started</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Welcome to Devlogify! Create your first project to start tracking your work.
            </p>
            <Link href="/dashboard/projects/new">
              <Button>Create Your First Project</Button>
            </Link>
          </div>
        </AnimatedCard>
      )}
    </div>
  )
}