import { MessageSquare, Calendar, Zap } from 'lucide-react';

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Features Grid */}
      <section className="py-24 bg-white px-4 sm:px-6 lg:px-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-emerald-700 font-bold tracking-wider text-sm uppercase mb-3">Core Engine</p>
            <h2 className="text-4xl md:text-5xl font-serif text-slate-900">Not just a chatbot, a complete business assistant.</h2>
            <p className="text-slate-600 mt-4 text-lg">Built specifically for modern businesses, our AI handles the entire customer journey from inquiry to booking, without human intervention.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-[#f7f8f6] p-8 rounded-3xl">
              <div className="h-12 w-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Natural Conversation</h3>
              <p className="text-slate-600 leading-relaxed">Engage with customers on their favorite app. The AI understands colloquial language, business terms, and intent.</p>
            </div>
            {/* Feature 2 */}
            <div className="bg-[#f7f8f6] p-8 rounded-3xl">
              <div className="h-12 w-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Direct Calendar Sync</h3>
              <p className="text-slate-600 leading-relaxed">No more double bookings. The AI reads your live availability and inserts appointments directly into your schedule.</p>
            </div>
            {/* Feature 3 */}
            <div className="bg-[#f7f8f6] p-8 rounded-3xl">
              <div className="h-12 w-12 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center mb-6">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Custom Knowledge Base</h3>
              <p className="text-slate-600 leading-relaxed">Upload your PDFs, pricing, and FAQs. The AI answers customer questions instantly using your custom knowledge.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
