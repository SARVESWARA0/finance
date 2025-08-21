import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Stock Analysis Assistant',
  description: 'Real-time stock analysis and market insights',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full dark">
      <body className={`${inter.className} h-full bg-background text-foreground`}>
        <div className="min-h-full">
          <nav className="sticky top-0 z-40 bg-slate-900/70 backdrop-blur supports-[backdrop-filter]:bg-slate-900/50 border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <div className="flex-shrink-0 flex items-center">
                    <svg className="h-8 w-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 7-7" />
                    </svg>
                    <span className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">StockAI</span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-sm">
                  <a href="https://serpapi.com" target="_blank" rel="noreferrer" className="text-gray-300 hover:text-white">SerpAPI</a>
                  <a href="https://ai.google.dev" target="_blank" rel="noreferrer" className="text-gray-300 hover:text-white">Gemini</a>
                </div>
              </div>
            </div>
          </nav>

          <main>
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
              {children}
            </div>
          </main>

          <footer className="bg-slate-900/50 backdrop-blur mt-auto border-t border-slate-800">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-gray-400">
                © 2024 StockAI. Market data is for informational purposes only.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}