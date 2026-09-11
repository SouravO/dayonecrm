import { NextResponse } from 'next/server'
import { getTvTelemetry } from '@/lib/tv/telemetry'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getTvTelemetry(id)

    if (!payload) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('Error fetching TV telemetry in API route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
