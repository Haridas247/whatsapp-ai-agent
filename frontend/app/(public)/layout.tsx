import Link from 'next/link';
import Image from 'next/image';
import { Bot, LogIn } from 'lucide-react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f8f6] text-slate-900 font-sans selection:bg-emerald-200">
      {/* Top Navigation */}
      <nav className="border-b border-emerald-900/10 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.png" alt="Bizentrix Technology" width={40} height={40} className="object-contain" />
              <span className="font-bold text-xl tracking-tight text-slate-900 font-serif">Bizentrix Technology</span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Home
              </Link>
              <Link href="/features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Features
              </Link>
              <Link href="/use-cases" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Use Cases
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Pricing
              </Link>
              <Link href="/blogs" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Blogs
              </Link>
            </div>

            {/* Auth Actions */}
            <div className="flex items-center gap-6">
              <Link 
                href="/signup" 
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}
