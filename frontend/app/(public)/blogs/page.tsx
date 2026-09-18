import Link from 'next/link';

export default function BlogsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="py-24 bg-white px-4 sm:px-6 lg:px-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-serif text-slate-900">Latest from the Blog</h2>
            <p className="text-slate-600 mt-4 text-lg">Insights, updates, and thoughts on AI for modern businesses.</p>
          </div>
          
          <div className="flex justify-center mt-12">
            <p className="text-slate-500 italic text-lg">Coming soon! Stay tuned for updates.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
