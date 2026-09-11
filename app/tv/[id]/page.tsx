import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CompanyTvDisplay } from '@/components/tv/CompanyTvDisplay'
import { getTvTelemetry, getAllTvStartups } from '@/lib/tv/telemetry'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const payload = await getTvTelemetry(id)
  const name = payload?.startup.name || 'Portfolio Startup'

  return {
    title: `${name} — Live TV Mission Control | Day One`,
    description: `Real-time sprint metrics, burndown velocity, and live domain execution for ${name}.`,
  }
}

export default async function TvPage({ params }: Props) {
  const { id } = await params

  const [initialData, allStartups] = await Promise.all([
    getTvTelemetry(id),
    getAllTvStartups(),
  ])

  if (!initialData) {
    notFound()
  }

  return (
    <CompanyTvDisplay
      initialData={initialData}
      startupId={initialData.startup.id}
      allStartups={allStartups}
    />
  )
}
