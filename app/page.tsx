'use client'

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-blue-600 to-blue-800 text-white min-h-screen flex flex-col items-center justify-center">
      <div className="max-w-3xl mx-auto text-center px-6">
        <h1 className="text-5xl font-bold mb-4">Never Miss a Renewal Again</h1>
        <p className="text-xl mb-8">
          Track domains, SSL certs, and subscriptions across clients. Get alerts before they expire.
        </p>

        <div className="bg-white text-gray-900 p-8 rounded-lg shadow-lg mb-8">
          <h3 className="text-2xl font-bold mb-4">Save hundreds in forgotten renewals</h3>
          <ul className="text-left space-y-3 mb-6">
            <li>✓ Centralize all client renewals in one place</li>
            <li>✓ Automatic email alerts 30, 14, 7, 1 days before expiration</li>
            <li>✓ Track renewal costs and avoid auto-renewal fees</li>
            <li>✓ Document renewals for client billing</li>
          </ul>

          <a
            href="/auth"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 inline-block"
          >
            Get Started Free
          </a>
        </div>

        <p className="text-blue-200">Trusted by freelancers and agencies</p>
      </div>
    </div>
  )
}
