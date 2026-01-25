import './globals.css'

export const metadata = {
  title: '8a6ya - Pay your dues easily',
  description: 'Split expenses simply with your friends',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}