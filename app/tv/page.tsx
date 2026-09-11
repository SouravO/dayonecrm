import type { Metadata } from 'next'
import { CompanyTvDisplay } from '@/components/tv/CompanyTvDisplay'
import { TvDirectoryClient } from '@/components/tv/TvDirectoryClient'
import { getTvTelemetry, getAllTvStartups } from '@/lib/tv/telemetry'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Live TV Mission Control — Day One Studio Wall',
  description:
    'Full-screen real-time TV telemetry wall display with multi-company swapping, sprint process dashbars, and burndown velocity.',
}

interface Props {
  searchParams: Promise<{
    company?: string
    view?: string
  }>
}

export default async function TvDirectoryPage({ searchParams }: Props) {
  const resolvedParams = await searchParams
  const allStartups = await getAllTvStartups()

  // If user explicitly requests the directory fleet view or if no startups exist
  if (resolvedParams?.view === 'directory' || allStartups.length === 0) {
    return <TvDirectoryClient startups={allStartups} />
  }

  // Resolve target company: either query param ?company=slug/id, or first ACTIVE startup, or first startup
  const companyQuery = resolvedParams?.company?.toLowerCase()
  const targetStartup =
    (companyQuery &&
      allStartups.find(
        (s) =>
          s.id.toLowerCase() === companyQuery ||
          s.slug.toLowerCase() === companyQuery ||
          s.name.toLowerCase() === companyQuery
      )) ||
    allStartups.find((s) => s.name.toLowerCase() === 'bare logic') ||
    allStartups.find((s) => s.status === 'ACTIVE') ||
    allStartups[0]

  const initialData = await getTvTelemetry(targetStartup.id)

  if (!initialData) {
    return <TvDirectoryClient startups={allStartups} />
  }

  return (
    <CompanyTvDisplay
      initialData={initialData}
      startupId={targetStartup.id}
      allStartups={allStartups}
    />
  )
}
