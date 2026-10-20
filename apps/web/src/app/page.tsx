import { AuditForm } from '@/components/AuditForm';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-dark-bg transition-colors">
      {/* Header with theme toggle */}
      <header className="absolute top-4 right-4">
        <ThemeToggle />
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              A11yScan
            </span>
          </h1>
          <p className="text-xl text-gray-700 dark:text-[#e5ecf6]/80 max-w-2xl mx-auto">
            Web Accessibility Validator for WCAG 2.1/2.2 Standards
          </p>
        </div>

        <AuditForm />

        {/* Features section with proper heading hierarchy */}
        <section className="mt-16 max-w-5xl mx-auto" aria-labelledby="features-heading">
          <h2 id="features-heading" className="sr-only">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
          <div className="card group hover:border-primary-600/50 transition-all duration-300">
            <div className="w-12 h-12 bg-primary-600/10 dark:bg-primary-600/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              WCAG Compliance
            </h3>
            <p className="text-gray-600 dark:text-[#e5ecf6]/70">
              Checks against WCAG 2.1 and 2.2 accessibility standards
            </p>
          </div>
          
          <div className="card group hover:border-primary-600/50 transition-all duration-300">
            <div className="w-12 h-12 bg-accent-600/10 dark:bg-accent-600/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Detailed Reports
            </h3>
            <p className="text-gray-600 dark:text-[#e5ecf6]/70">
              Get actionable insights with code snippets and fix suggestions
            </p>
          </div>
          
          <div className="card group hover:border-primary-600/50 transition-all duration-300">
            <div className="w-12 h-12 bg-primary-600/10 dark:bg-primary-600/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Export Results
            </h3>
            <p className="text-gray-600 dark:text-[#e5ecf6]/70">
              Download reports as PDF or share specific issues easily
            </p>
          </div>
          </div>
        </section>
      </div>
    </main>
  );
}
