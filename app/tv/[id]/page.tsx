import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CompanyTvDisplay } from '@/components/tv/CompanyTvDisplay'
import { createAdminClient } from '@/lib/supabase/admin'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ theme?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createAdminClient()

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  let name = 'Company'

  if (isUuid) {
    const { data } = await supabase.from('startups').select('name').eq('id', id).single()
    if (data?.name) name = data.name
  } else {
    const normalized = id.replace(/-/g, ' ').trim()
    const { data } = await supabase.from('startups').select('name').ilike('name', `%${normalized}%`).limit(1).maybeSingle()
    if (data?.name) name = data.name
  }

  return {
    title: `${name} — Live TV Mission Control | Day One`,
    description: `Real-time sprint metrics, burndown velocity, and live domain execution for ${name}.`,
  }
}

export default async function TvPage({ params, searchParams }: Props) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const initialTheme = resolvedSearchParams?.theme === 'cream' ? 'cream' : 'dark'

  // Pre-fetch initial telemetry data server-side
  // We can fetch from our internal API route using relative or localhost fetch
  const host = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  let initialData = null
  try {
    const res = await fetch(`${host}/api/tv/${id}`, { cache: 'no-store' })
    if (res.ok) {
      initialData = await res.json()
    }
  } catch (e) {
    console.error('Error pre-fetching TV telemetry:', e)
  }

  if (!initialData || initialData.error) {
    notFound()
  }

  return <CompanyTvDisplay initialData={initialData} startupId={id} initialTheme={initialTheme} />
}
