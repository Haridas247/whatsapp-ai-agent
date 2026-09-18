export default function UseCasesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Steps Section acting as Use Cases */}
      <section className="py-24 bg-[#f7f8f6] px-4 sm:px-6 lg:px-8 border-t border-emerald-900/5 flex-1">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-serif text-slate-900">How clinics use Bizentrix AI</h2>
            <p className="text-slate-600 mt-4 text-lg">We've made getting started incredibly simple. No technical knowledge required.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-emerald-200 -z-10" />
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-emerald-700 text-white font-serif text-2xl rounded-full flex items-center justify-center mb-6 shadow-lg">01</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Connect WhatsApp</h3>
              <p className="text-slate-600">Scan a QR code to link your business number securely to our platform.</p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-emerald-700 text-white font-serif text-2xl rounded-full flex items-center justify-center mb-6 shadow-lg">02</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Train the AI</h3>
              <p className="text-slate-600">Upload your pricing list and clinic details. The AI learns everything instantly.</p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-emerald-700 text-white font-serif text-2xl rounded-full flex items-center justify-center mb-6 shadow-lg">03</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Watch it work</h3>
              <p className="text-slate-600">Go live. Sit back and watch appointments flow into your dashboard.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
