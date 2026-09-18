import type { Metadata } from 'next';

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
  LogOut,
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
    <div className="bg-white text-gray-900 min-h-screen flex antialiased font-sans">
      {/* Sidebar */}
        <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
          {/* Logo / Brand */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-semibold text-sm tracking-wide text-gray-900">WhatsApp AI</h1>
                <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                  Enterprise Edition
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1 text-sm font-medium">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 text-blue-600" />
              Overview
            </Link>
            <Link
              href="/admin/appointments"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <CalendarDays className="h-4 w-4 text-blue-600" />
              Appointments
            </Link>
            <Link
              href="/admin/conversations"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Live WhatsApp Chats
            </Link>
            <Link
              href="/admin/knowledge"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <BookOpen className="h-4 w-4 text-blue-600" />
              Knowledge & RAG
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <Settings className="h-4 w-4 text-gray-400" />
              Settings
            </Link>
            <Link
              href="/admin/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <Activity className="h-4 w-4 text-gray-400" />
              Profile & Security
            </Link>
          </nav>

          {/* Bottom Status Card */}
          <div className="p-4 border-t border-gray-200">
            <div className="p-3 bg-white border border-gray-200 rounded-md text-xs space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Gemini Model</span>
                <span className="text-blue-600 font-mono text-[10px]">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">pgvector RAG</span>
                <span className="text-blue-600 font-mono text-[10px]">Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Background Tasks</span>
                <span className="text-green-600 font-mono text-[10px]">Online</span>
              </div>
            </div>

            <a
              href="/signin"
              className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-100 transition-colors text-sm font-semibold"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </a>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#faf9f8]">
          {children}
        </main>
    </div>
  );
}
