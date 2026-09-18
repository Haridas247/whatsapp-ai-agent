import Link from 'next/link';
import Image from 'next/image';
import { Bot, CheckCircle2, MessageSquare, Calendar, ArrowRight, Zap, Shield, Smartphone, Star } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 inset-x-0 h-full w-full bg-slate-50 -z-10" />
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-200/50 blur-3xl -z-10" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-100/50 blur-3xl -z-10" />

        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold mb-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Introducing Bizentrix AI v2.0
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              The AI Receptionist that <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">actually books.</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Transform your business's WhatsApp into an intelligent, 24/7 booking engine. Bizentrix AI talks to customers naturally, answers FAQs, and syncs directly to your calendar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link 
                href="/signup" 
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5"
              >
                Get Started for Free <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-8 text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> No credit card required</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Setup in 5 minutes</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Cancel anytime</div>
            </div>
          </div>
          
          {/* Hero Graphic (Abstract representation of the chat/booking interface) */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none relative mt-12 lg:mt-0">
            <div className="relative mx-auto w-full max-w-[320px]">
              {/* Fake Phone UI */}
              <div className="bg-white rounded-[3rem] shadow-2xl border-[10px] border-slate-900 overflow-hidden relative z-10 aspect-[9/19] flex flex-col">
                <div className="bg-emerald-600 px-5 pt-10 pb-4 text-white shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-md">
                      <Image src="/logo.png" alt="Bizentrix" width={32} height={32} />
                    </div>
                    <div>
                      <p className="font-bold text-base leading-tight">Bizentrix Assistant</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <p className="text-xs font-medium text-emerald-100">AI Receptionist Online</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-4 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover flex-1 flex flex-col justify-end pb-8">
                  <div className="bg-white p-3.5 rounded-2xl rounded-tl-sm text-sm text-slate-800 shadow-sm w-[85%] self-start border border-slate-100">
                    Hello! I'd like to book a consultation and strategy session for tomorrow evening.
                  </div>
                  <div className="bg-[#dcf8c6] p-3.5 rounded-2xl rounded-tr-sm text-sm text-slate-800 shadow-sm w-[85%] self-end">
                    Hi there! 👋 I can certainly help. We have slots available tomorrow at 5:00 PM or 6:30 PM. A consultation takes about 45 minutes. Which time works best?
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl rounded-tl-sm text-sm text-slate-800 shadow-sm w-[85%] self-start border border-slate-100">
                    6:30 PM sounds great.
                  </div>
                  <div className="bg-[#dcf8c6] p-3.5 rounded-2xl rounded-tr-sm text-sm text-slate-800 shadow-sm w-[85%] self-end">
                    Perfect! ✅ I've booked your appointment for tomorrow at 6:30 PM. We will send you a reminder 24 hours before!
                  </div>
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute top-1/3 -right-16 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-20 flex items-center gap-4 animate-[bounce_4s_infinite]">
                <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Auto-Booked</p>
                  <p className="text-sm font-extrabold text-slate-900">Tomorrow, 6:30 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Vision Section */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-800 text-sm font-semibold mb-6">
            Built for the future of business
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 max-w-3xl mx-auto">
            We built Bizentrix AI because we believe no customer should ever be left on read.
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
            As a technology-first company, we've engineered a sophisticated WhatsApp AI agent from the ground up. We are looking for forward-thinking businesses to partner with us and pioneer the future of automated customer booking.
          </p>
        </div>
      </section>

      {/* Technology Capabilities Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow">
              <div className="mx-auto h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-3">Seamless Sync</h3>
              <p className="text-slate-600 font-medium leading-relaxed">Our AI connects directly to your calendar infrastructure, ensuring double-bookings are impossible and slots are filled in real-time.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow">
              <div className="mx-auto h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-3">Natural NLP</h3>
              <p className="text-slate-600 font-medium leading-relaxed">Engineered using state-of-the-art language models, our agent understands context, intent, and casual customer conversational patterns.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow">
              <div className="mx-auto h-16 w-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-3">Data Secure</h3>
              <p className="text-slate-600 font-medium leading-relaxed">Built with enterprise-grade architecture. All customer data is strictly isolated via secure multi-tenant cloud databases.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" />
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Be among the first to automate your front desk.</h2>
            <p className="text-slate-300 text-lg md:text-xl font-medium">Experience the power of true AI automation. Sign up today to start testing our technology for your business.</p>
            <div className="flex justify-center pt-6">
              <Link href="/signup" className="bg-emerald-500 text-white font-bold px-10 py-5 rounded-full hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 text-lg hover:-translate-y-1">
                Start Your Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 pt-20 pb-10 px-4 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            
            {/* Column 1: Brand & About */}
            <div className="md:col-span-5 space-y-6">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="Bizentrix Technology" width={48} height={48} className="object-contain drop-shadow-sm" />
                <span className="font-extrabold text-slate-900 text-2xl tracking-tight">Bizentrix</span>
              </div>
              <p className="text-base text-slate-600 leading-relaxed font-medium max-w-sm">
                Bizentrix Technologies builds sophisticated software for businesses and enterprises. Custom apps, automation, cloud and real-time systems that boost efficiency.
              </p>
            </div>

            {/* Column 2: Company Navigation */}
            <div className="md:col-span-3 md:col-start-7">
              <h4 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-4 text-slate-600 font-medium">
                <li><Link href="/" className="hover:text-emerald-600 transition-colors">Home</Link></li>
                <li><Link href="/features" className="hover:text-emerald-600 transition-colors">Features</Link></li>
                <li><Link href="/use-cases" className="hover:text-emerald-600 transition-colors">Use Cases</Link></li>
                <li><Link href="/blogs" className="hover:text-emerald-600 transition-colors">Blogs</Link></li>
              </ul>
            </div>

            {/* Column 3: Contact Info & Location */}
            <div className="md:col-span-3">
              <h4 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-wider">Contact & Location</h4>
              <ul className="space-y-4 text-slate-600 font-medium">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>2/293 Ragavendra Colony, Basthi, Hosur, Tamil Nadu</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <a href="mailto:info@bizentrix.com" className="hover:text-emerald-600 transition-colors">info@bizentrix.com</a>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <div className="flex flex-col">
                    <a href="tel:+916385162296" className="hover:text-emerald-600 transition-colors">+91 63851 62296</a>
                    <a href="tel:+919500782296" className="hover:text-emerald-600 transition-colors">+91 95007 82296</a>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-200 gap-4">
            <div className="text-sm text-slate-500 font-medium">
              &copy; {new Date().getFullYear()} Bizentrix Technologies Private Limited. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
              <Link href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider">Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
