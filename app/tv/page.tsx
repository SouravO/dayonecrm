import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { TvDirectoryClient } from '@/components/tv/TvDirectoryClient'

export const metadata: Metadata = {
  title: 'Multi-TV Studio Control Hub — Day One',
  description: 'Launch dedicated live mission control displays for each portfolio startup on office wall TVs.',
}

export default async function TvDirectoryPage() {
  const supabase = createAdminClient()

  // Fetch all startups
  const { data: startups } = await supabase
    .from('startups')
    .select('*')
    .order('name', { ascending: true })

  // Fetch weekly plans, tasks, domains
  const [plansRes, tasksRes, domainsRes] = await Promise.all([
    supabase.from('weekly_plans').select('startup_id, goal, week_start, week_end'),
    supabase.from('tasks').select('startup_id, status'),
    supabase.from('domains').select('startup_id'),
  ])

  const plans = plansRes.data || []
  const tasks = tasksRes.data || []
  const domains = domainsRes.data || []

  const formattedStartups = (startups || []).map((s) => {
    const sPlans = plans.filter((p) => p.startup_id === s.id)
    const latestPlan = sPlans[sPlans.length - 1]
    const sTasks = tasks.filter((t) => t.startup_id === s.id)
    const sDomains = domains.filter((d) => d.startup_id === s.id)
    const slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || s.id

    return {
      id: s.id,
      name: s.name,
      email: s.email,
      status: s.status,
      slug: slug || s.id,
      planGoal: latestPlan?.goal || null,
      tasksCount: sTasks.length,
      domainsCount: sDomains.length,
    }
  })

  return <TvDirectoryClient startups={formattedStartups} />
}
