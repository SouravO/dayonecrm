import type { Metadata } from 'next'
import { Inter, Newsreader } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: {
    default: 'Day One — Venture Studio by iQue',
    template: '%s | Day One',
  },
  description:
    'Day One is a venture studio management platform helping startups grow from scratch with structured weekly goals, task tracking, and performance analytics.',
  keywords: ['venture studio', 'startup management', 'performance tracking', 'iQue'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  )
}
