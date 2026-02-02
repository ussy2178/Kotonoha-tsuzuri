import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ことのは綴り',
  description: '画像から俳句を検索するアプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body suppressHydrationWarning className="font-mincho antialiased">{children}</body>
    </html>
  )
}