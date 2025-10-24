export default function HeroSection() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Hero illustration with cloud chaos image */}
          <div className="mb-12">
            <img 
              src="/images/cloud-chaos.png" 
              alt="A cloud of chaos with crossed-out app logos and cartoon faces, representing project confusion" 
              className="mx-auto max-w-4xl w-full h-auto"
            />
          </div>
          
          {/* Main headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-black mb-6 leading-tight">
            Wrestling with projects?
            <br />
            <span className="block">It doesn&apos;t have to be this hard.</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            There are lots of ways to manage projects. And there&apos;s plenty of software promising to help. You&apos;ve probably tried some. Yet, here you are.
          </p>
          
          <p className="text-lg text-gray-700 mb-8 max-w-4xl mx-auto">
            <strong>Unfortunately, most project management systems are either overwhelming, inadequate, bewildering, or chaotic. You know?</strong>
          </p>
          
          <p className="text-lg text-gray-700 mb-8 max-w-4xl mx-auto">
            Not Basecamp. Basecamp is refreshingly straightforward, with a 21-year track record to back it up. Longevity isn&apos;t luck — it&apos;s proof it works. And you&apos;ll work better with it too.
          </p>
          
          {/* Jason Fried signature */}
          <div className="mb-8">
            <p className="text-lg text-gray-700 mb-4 max-w-4xl mx-auto">
              <strong>Basecamp is famously no-nonsense, effective, and reliable.</strong> The trifecta. It&apos;s designed for smaller, hungrier businesses, not big, sluggish ones. Over 30 pages of customer testimonials detail how things run better on Basecamp.
            </p>
            <p className="text-lg text-gray-700 mb-6 max-w-4xl mx-auto">
              So, we invite you to poke around, watch the video below, and try Basecamp for free. We&apos;d be honored to have you as a customer. Thank you.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <div className="text-left">
                <p className="font-bold text-gray-900">Jason Fried, <a href="mailto:jason@basecamp.com" className="text-blue-600 hover:underline">jason@basecamp.com</a></p>
                <p className="text-sm text-gray-600 italic">Co-founder & CEO</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
