import Image from 'next/image';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 w-full">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-20">
        {/* Left: Logo and full tagline as a single group, flush left */}
        <div className="flex items-center whitespace-nowrap">
          <Image src="/images/basecamp-logo.png" alt="Basecamp logo" width={32} height={32} className="mr-2" />
          <span className="flex items-center text-black text-lg">
            <span className="font-bold mr-1">Basecamp</span>
            <span className="mr-1">is the</span>
            <span className="font-bold bg-yellow-200 px-1 rounded mr-1">down-to-earth</span>
            <span className="font-bold mr-1">project management system</span>
            <span className="mr-1">by</span>
            <span className="font-bold">37signals</span>
          </span>
        </div>
        {/* Right: Menu, separated by a large left margin */}
        <nav className="flex items-center space-x-6 whitespace-nowrap ml-24">
          <a href="#" className="text-black font-medium hover:underline">Real world results</a>
          <a href="#" className="text-black font-medium hover:underline">Features</a>
          <a href="#" className="text-black font-medium hover:underline">Paths</a>
          <a href="#" className="text-black font-medium hover:underline">Pricing</a>
          <a
            href="#"
            className="ml-4 px-4 py-2 border border-green-600 text-green-700 font-bold rounded-md bg-white hover:bg-green-50 transition-colors duration-150 whitespace-nowrap"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
          >
            Sign in
          </a>
          <a
            href="#"
            className="ml-2 px-4 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 transition-colors duration-150 shadow whitespace-nowrap"
          >
            Sign up free
          </a>
        </nav>
      </div>
    </header>
  )
}

