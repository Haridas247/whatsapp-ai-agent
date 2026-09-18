import Link from 'next/link';
import Image from 'next/image';
import { Bot, CheckCircle2, MessageSquare, Calendar, ArrowRight, Zap, Shield, Smartphone } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8">
          <h1 className="text-6xl sm:text-7xl font-serif text-slate-900 leading-[1.1] tracking-tight">
            A receptionist <br/>
            answers even <br/>
            at night. And <br/>
            it actually books.
          </h1>
          <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
            The first AI designed for clinics that understands medical intent, talks naturally on WhatsApp, and books appointments directly into your calendar. Stop losing patients after hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-8 py-4 rounded-full transition-colors flex items-center justify-center gap-2"
            >
              Sign Up <ArrowRight className="h-4 w-4" />
            </Link>
            <Link 
              href="#pricing" 
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-medium px-8 py-4 rounded-full transition-colors flex items-center justify-center"
            >
              View pricing
            </Link>
          </div>
          
          <div className="flex items-center gap-8 pt-8 border-t border-emerald-900/10">
            <div>
              <p className="text-3xl font-serif text-slate-900">24/7</p>
              <p className="text-sm text-slate-500 font-medium">Availability</p>
            </div>
            <div>
              <p className="text-3xl font-serif text-slate-900">98%</p>
              <p className="text-sm text-slate-500 font-medium">Task Success</p>
            </div>
            <div>
              <p className="text-3xl font-serif text-slate-900">50+</p>
              <p className="text-sm text-slate-500 font-medium">Supported Languages</p>
            </div>
          </div>
        </div>
        
        {/* Hero Graphic (Abstract representation of the chat/booking interface) */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
          <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-50 p-8 shadow-2xl shadow-emerald-900/5 flex items-center justify-center border border-white">
            <div className="relative w-full max-w-sm mx-auto">
              {/* Fake Phone UI */}
              <div className="bg-white rounded-[2.5rem] shadow-xl border-[8px] border-slate-100 overflow-hidden relative z-10 aspect-[9/19]">
                <div className="bg-emerald-600 px-4 pt-12 pb-4 text-white">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Dr. Kumar Clinic</p>
                      <p className="text-xs text-emerald-100">AI Assistant</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-4 bg-[#efeae2] h-full">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-sm text-sm text-slate-800 shadow-sm w-[85%]">
                    Hello! I'd like to book a dental checkup for tomorrow evening.
                  </div>
                  <div className="bg-[#dcf8c6] p-3 rounded-2xl rounded-tr-sm text-sm text-slate-800 shadow-sm w-[85%] ml-auto">
                    Hi there! 👋 I can help with that. Dr. Kumar has availability tomorrow at 5:00 PM or 6:30 PM. Which one works best for you?
                  </div>
                  <div className="bg-white p-3 rounded-2xl rounded-tl-sm text-sm text-slate-800 shadow-sm w-[85%]">
                    6:30 PM sounds great.
                  </div>
                  <div className="bg-[#dcf8c6] p-3 rounded-2xl rounded-tr-sm text-sm text-slate-800 shadow-sm w-[85%] ml-auto">
                    Perfect! I've booked your appointment for tomorrow at 6:30 PM. See you then! 🦷✨
                  </div>
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute top-1/4 -right-12 bg-white p-4 rounded-2xl shadow-lg border border-slate-100 z-20 flex items-center gap-3 animate-bounce" style={{animationDuration: '3s'}}>
                <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">New Booking</p>
                  <p className="text-sm font-bold text-slate-900">Tomorrow, 6:30 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto bg-emerald-900 rounded-[3rem] p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-emerald-700/50 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-emerald-800/50 rounded-full blur-3xl" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-serif">Turn off your phone. Work better. Earn more.</h2>
            <p className="text-emerald-100 text-lg">Join the clinics that are already using AI to guarantee a response to every single patient.</p>
            <div className="flex justify-center pt-4">
              <Link href="/signup" className="bg-white text-emerald-950 font-bold px-8 py-4 rounded-full hover:bg-emerald-50 transition-colors shadow-xl">
                Get started for free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f0f2ef] pt-16 pb-8 px-4 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
            
            {/* Column 1: Brand */}
            <div className="space-y-6 md:col-span-1">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="Bizentrix Technology" width={40} height={40} className="object-contain" />
                <span className="font-bold text-slate-900 font-serif text-xl">Bizentrix Technology</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Always-on AI Receptionist for SMBs.<br />
                WhatsApp, voice, automatic bookings, and measurable ROI.
              </p>
              
              <div className="flex flex-wrap gap-4 text-xs font-medium">
                <span className="text-emerald-700">Hosted Global</span>
                <span className="text-slate-700">HIPAA ready</span>
                <span className="text-slate-700">Made for Clinics</span>
              </div>
              
              <div className="pt-2">
                <p className="text-sm text-slate-500 mb-1">Bizentrix Technology</p>
                <p className="text-sm text-slate-500">contact@bizentrix.com</p>
              </div>
            </div>

            {/* Column 2: Product */}
            <div>
              <h4 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-wider font-serif">Product</h4>
              <ul className="space-y-4 text-sm text-slate-600">
                <li><Link href="/features" className="hover:text-emerald-700">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-emerald-700">Plans & Pricing</Link></li>
                <li><Link href="#" className="hover:text-emerald-700">For dentists</Link></li>
                <li><Link href="#" className="hover:text-emerald-700">For beauty salons</Link></li>
                <li><Link href="#" className="hover:text-emerald-700">For gyms & PTs</Link></li>
                <li><Link href="#" className="hover:text-emerald-700">Professional studios</Link></li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div>
              <h4 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-wider font-serif">Resources</h4>
              <ul className="space-y-4 text-sm text-slate-600">
                <li><Link href="#" className="hover:text-emerald-700">Case studies</Link></li>
                <li><Link href="#" className="hover:text-emerald-700">Blog</Link></li>
                <li><Link href="#" className="hover:text-emerald-700">Changelog</Link></li>
                <li><Link href="#" className="hover:text-emerald-700">Documentation</Link></li>
                <li><Link href="#" className="hover:text-emerald-700">Help Center</Link></li>
              </ul>
            </div>

            {/* Column 4: Company */}
            <div>
              <h4 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-wider font-serif">Company</h4>
              <ul className="space-y-4 text-sm text-slate-600">
                <li><Link href="#" className="hover:text-emerald-700">About us</Link></li>
                <li><Link href="#" className="hover:text-emerald-700">Contact</Link></li>
                <li><Link href="#" className="hover:text-emerald-700">System status</Link></li>
              </ul>
            </div>

            {/* Column 5: Legal */}
            <div>
              <h4 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-wider font-serif">Legal</h4>
              <ul className="space-y-4 text-sm text-slate-600">
                <li><Link href="#" className="hover:text-emerald-700">Privacy policy</Link></li>
                <li><Link href="#" className="hover:text-emerald-700">Terms</Link></li>
                <li><Link href="#" className="hover:text-emerald-700">DPA</Link></li>
                <li><Link href="#" className="hover:text-emerald-700">Cookie policy</Link></li>
                <li><Link href="#" className="hover:text-emerald-700">Security</Link></li>
              </ul>
            </div>
            
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-slate-200/60 text-xs text-slate-500">
            <div>&copy; {new Date().getFullYear()} Bizentrix Technology.</div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <span>v1.0.0</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-emerald-700 font-medium">Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
