import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: {
    default: 'Day One — Venture Studio',
    template: '%s | Day One',
  },
  description:
    'Day One is a venture studio management platform helping startups grow from scratch with structured weekly goals, task tracking, and performance analytics.',
  keywords: ['venture studio', 'startup management', 'performance tracking'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
