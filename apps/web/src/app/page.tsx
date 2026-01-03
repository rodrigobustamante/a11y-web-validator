export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            A11yScan
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Web Accessibility Validator for WCAG 2.1/2.2 Standards
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl p-8">
          <div className="mb-6">
            <label
              htmlFor="url-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Enter URL to audit
            </label>
            <input
              id="url-input"
              type="url"
              placeholder="https://example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus-ring"
              aria-describedby="url-help"
            />
            <p id="url-help" className="mt-2 text-sm text-gray-500">
              Enter a valid URL to scan for accessibility issues
            </p>
          </div>

          <button
            type="button"
            className="btn-primary w-full py-3 text-lg"
            aria-label="Start accessibility scan"
          >
            Scan Website
          </button>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              WCAG Compliance
            </h3>
            <p className="text-gray-600">
              Checks against WCAG 2.1 and 2.2 accessibility standards
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Detailed Reports
            </h3>
            <p className="text-gray-600">
              Get actionable insights with code snippets and fix suggestions
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Export Results
            </h3>
            <p className="text-gray-600">
              Download reports as PDF or share specific issues easily
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

