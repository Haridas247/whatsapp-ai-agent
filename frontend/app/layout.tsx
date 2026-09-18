import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import {
  LayoutDashboard,
  CalendarDays,
  MessageSquare,
  BookOpen,
  Settings,
  Sparkles,
  Bot,
  Activity,
} from 'lucide-react';
import TenantSelector from './components/TenantSelector';

export const metadata: Metadata = {
  title: 'Dr. Kumar Dental Clinic | WhatsApp AI Receptionist SaaS',
  description: 'AI-Powered WhatsApp Receptionist & Multi-Tenant Booking Engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex antialiased">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
          {/* Logo / Brand */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-wide text-white">WhatsApp AI</h1>
                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Clinic Pilot v1.0
                </p>
              </div>
            </div>
            <TenantSelector />
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1 text-sm font-medium">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 text-emerald-400" />
              Overview
            </Link>
            <Link
              href="/appointments"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <CalendarDays className="h-4 w-4 text-blue-400" />
              Appointments
            </Link>
            <Link
              href="/conversations"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              Live WhatsApp Chats
            </Link>
            <Link
              href="/knowledge"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <BookOpen className="h-4 w-4 text-purple-400" />
              Knowledge & RAG
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              Settings
            </Link>
          </nav>

          {/* Bottom Status Card */}
          <div className="p-4 border-t border-slate-800">
            <div className="p-3 bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/20 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Gemini 2.5 Flash</span>
                <span className="text-emerald-400 font-mono text-[10px]">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">pgvector RAG</span>
                <span className="text-purple-400 font-mono text-[10px]">768-dim</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">BullMQ Queue</span>
                <span className="text-amber-400 font-mono text-[10px]">Connected</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-950">
          {children}
        </main>
      </body>
    </html>
  );
}
