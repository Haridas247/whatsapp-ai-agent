import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Pricing Section */}
      <section className="py-24 bg-white px-4 sm:px-6 lg:px-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-emerald-600 font-medium tracking-wide text-sm uppercase mb-3">Clear Pricing</p>
            <h2 className="text-4xl md:text-5xl font-serif text-slate-900">You only pay when it works.</h2>
            <p className="text-slate-600 mt-4 text-lg">No hidden fees, no complex tiers. Cancel anytime.</p>
          </div>
          
          <div className="flex flex-col lg:flex-row justify-center items-stretch gap-8 max-w-5xl mx-auto">
            {/* Standard Tier */}
            <div className="flex-1 bg-white border border-slate-200 p-8 rounded-[2rem] flex flex-col">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-serif text-slate-900">₹999</span>
                <span className="text-slate-500 font-medium">/month</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex gap-3 text-slate-600"><CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0"/> 100 AI conversations / mo</li>
                <li className="flex gap-3 text-slate-600"><CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0"/> WhatsApp Integration</li>
                <li className="flex gap-3 text-slate-600"><CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0"/> Basic Document RAG (1 PDF)</li>
                <li className="flex gap-3 text-slate-600"><CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0"/> Standard Support</li>
              </ul>
              <Link href="/signup" className="block w-full py-3 px-6 text-center rounded-full border-2 border-slate-200 text-slate-900 font-medium hover:border-slate-300 hover:bg-slate-50 transition-colors">
                Start Free Trial
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="flex-1 bg-emerald-900 text-white border border-emerald-800 p-8 rounded-[2rem] shadow-2xl relative flex flex-col transform lg:-translate-y-4">
              <div className="absolute -top-4 inset-x-0 flex justify-center">
                <span className="bg-emerald-400 text-emerald-950 text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">Most Popular</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Professional</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-serif text-white">₹2,499</span>
                <span className="text-emerald-200 font-medium">/month</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex gap-3 text-emerald-50"><CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0"/> Unlimited AI conversations</li>
                <li className="flex gap-3 text-emerald-50"><CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0"/> Live Calendar Booking</li>
                <li className="flex gap-3 text-emerald-50"><CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0"/> Advanced Knowledge Base (Unlimited PDFs)</li>
                <li className="flex gap-3 text-emerald-50"><CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0"/> Human Handoff Feature</li>
                <li className="flex gap-3 text-emerald-50"><CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0"/> Priority Support</li>
              </ul>
              <Link href="/signup" className="block w-full py-3 px-6 text-center rounded-full bg-emerald-500 text-emerald-950 font-bold hover:bg-emerald-400 transition-colors shadow-md">
                Get Professional
              </Link>
            </div>

            {/* Enterprise Tier */}
            <div className="flex-1 bg-white border border-slate-200 p-8 rounded-[2rem] flex flex-col">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Enterprise</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-serif text-slate-900">Custom</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex gap-3 text-slate-600"><CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0"/> Multiple Clinics / Locations</li>
                <li className="flex gap-3 text-slate-600"><CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0"/> Custom EHR Integration</li>
                <li className="flex gap-3 text-slate-600"><CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0"/> White-label Options</li>
                <li className="flex gap-3 text-slate-600"><CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0"/> Dedicated Account Manager</li>
              </ul>
              <Link href="/contact" className="block w-full py-3 px-6 text-center rounded-full border-2 border-slate-200 text-slate-900 font-medium hover:border-slate-300 hover:bg-slate-50 transition-colors">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer is provided by layout */}
    </div>
  );
}
