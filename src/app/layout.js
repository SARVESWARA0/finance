import "./globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Stock Analysis Assistant",
  description: "Real-time stock analysis and market insights",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full dark">
      <body className={`${inter.className} h-full bg-background text-foreground`}>
        <div className="min-h-full">
          <nav className="sticky top-0 z-40 bg-slate-900/70 backdrop-blur supports-[backdrop-filter]:bg-slate-900/50 border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
          </nav>

          <main>
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  )
}
