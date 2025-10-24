
'use client'
export const dynamic = 'force-dynamic'

import React, { useState, use } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  ShoppingCart, 
  Star,
  Heart,
  Download,
  Shield,
  Share2,
  ExternalLink,
  Check,
  Clock,
  TrendingUp,
  Award,
  Globe,
  Edit
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

// Mock data - in real app this would come from API
const mockData = {
  '1': {
    id: '1',
    title: 'Ultimate Web Development Resources',
    description: 'Comprehensive collection of tools, tutorials, and frameworks for modern web development. This carefully curated collection includes everything you need to become a proficient web developer, from beginner tutorials to advanced frameworks and cutting-edge tools.',
    fullDescription: `This comprehensive collection represents 5+ years of curating the absolute best web development resources available. Whether you're a beginner just starting your coding journey or an experienced developer looking to stay current with the latest technologies, this collection has everything you need.

**What's Included:**
• 127 hand-picked bookmarks across 8 categories
• Beginner-friendly tutorials with step-by-step guides
• Advanced frameworks and libraries documentation
• Essential development tools and utilities
• Code examples and best practices
• Community resources and forums
• Career guidance and interview preparation
• Regular updates with new resources

**Categories Covered:**
• Frontend Development (React, Vue, Angular)
• Backend Development (Node.js, Python, PHP)
• CSS Frameworks and Methodologies
• JavaScript Libraries and Tools
• Development Environment Setup
• Testing and Debugging Tools
• Performance Optimization
• Deployment and DevOps

This collection has helped over 2,300 developers level up their skills and land their dream jobs. Join the community of successful developers who trust this resource.`,
    category: 'Development',
    price: 29.99,
    originalPrice: 49.99,
    rating: 4.9,
    reviews: 156,
    downloads: 2341,
    author: 'DevMaster Pro',
    authorAvatar: 'DM',
    authorBio: 'Senior Full-Stack Developer with 8+ years experience at Google and Meta. Created 15+ popular open-source projects.',
    authorVerified: true,
    bookmarkCount: 127,
    tags: ['React', 'JavaScript', 'CSS', 'Tools', 'Tutorials', 'Frameworks'],
    featured: true,
    premium: true,
    lastUpdated: '2024-01-15',
    createdAt: '2023-06-01',
    language: 'English',
    difficulty: 'All Levels',
    previewBookmarks: [
      { title: 'React Official Documentation', url: 'https://react.dev', category: 'Framework' },
      { title: 'CSS Grid Complete Guide', url: 'https://css-tricks.com/snippets/css/complete-guide-grid/', category: 'CSS' },
      { title: 'JavaScript ES6 Features', url: 'https://es6-features.org/', category: 'JavaScript' },
      { title: 'Webpack Configuration Guide', url: 'https://webpack.js.org/guides/', category: 'Tools' },
      { title: 'VS Code Extensions for Developers', url: 'https://marketplace.visualstudio.com/', category: 'Tools' }
    ],
    screenshots: [
      '/images/marketplace/screenshot1.jpg',
      '/images/marketplace/screenshot2.jpg',
      '/images/marketplace/screenshot3.jpg'
    ],
    testimonials: [
      {
        name: 'Sarah Chen',
        avatar: 'SC',
        rating: 5,
        comment: 'This collection saved me months of research. Everything is perfectly organized and up-to-date!',
        verified: true
      },
      {
        name: 'Mike Rodriguez',
        avatar: 'MR', 
        rating: 5,
        comment: 'Best investment I made for my career. Got promoted to senior developer thanks to these resources.',
        verified: true
      }
    ],
    faqs: [
      {
        question: 'How often is this collection updated?',
        answer: 'The collection is updated monthly with new resources and outdated links are removed or replaced.'
      },
      {
        question: 'Is this suitable for beginners?',
        answer: 'Absolutely! The collection includes resources for all skill levels, from complete beginners to advanced developers.'
      },
      {
        question: 'Do I get lifetime access?',
        answer: 'Yes, once purchased you have lifetime access to the collection and all future updates.'
      }
    ]
  },
  '2': {
    id: '2',
    title: 'AI & Machine Learning Essentials',
    description: 'Curated resources for learning and implementing AI/ML solutions',
    fullDescription: `Dive deep into the world of Artificial Intelligence and Machine Learning with this expertly curated collection. Perfect for researchers, students, and professionals looking to stay at the forefront of AI innovation.

**What's Included:**
• 94 premium AI/ML resources across multiple domains
• Latest research papers from top conferences (NIPS, ICML, ICLR)
• Comprehensive framework tutorials (TensorFlow, PyTorch, Keras)
• High-quality datasets for practice and research
• Industry case studies and real-world applications
• Career guidance for AI professionals
• Interview preparation materials
• Community forums and discussion groups

**Key Areas Covered:**
• Deep Learning and Neural Networks
• Computer Vision and Image Processing
• Natural Language Processing
• Reinforcement Learning
• MLOps and Model Deployment
• Data Science and Analytics
• Research Papers and Publications
• Industry Tools and Platforms

This collection is trusted by over 1,500 AI professionals and has been featured in top ML newsletters. Stay ahead of the curve with cutting-edge resources.`,
    category: 'AI/ML',
    price: 39.99,
    originalPrice: 59.99,
    rating: 4.8,
    reviews: 89,
    downloads: 1567,
    author: 'AI Researcher',
    authorAvatar: 'AR',
    authorBio: 'PhD in Machine Learning, published researcher with 50+ papers. Former Google Brain researcher.',
    authorVerified: true,
    bookmarkCount: 94,
    tags: ['TensorFlow', 'PyTorch', 'Datasets', 'Papers', 'Deep Learning', 'NLP'],
    featured: true,
    premium: true,
    lastUpdated: '2024-01-10',
    createdAt: '2023-08-15',
    language: 'English',
    difficulty: 'Intermediate',
    previewBookmarks: [
      { title: 'TensorFlow Official Tutorials', url: 'https://tensorflow.org', category: 'Framework' },
      { title: 'Kaggle Competition Datasets', url: 'https://kaggle.com', category: 'Data' },
      { title: 'ArXiv ML Papers Collection', url: 'https://arxiv.org', category: 'Research' },
      { title: 'PyTorch Lightning Documentation', url: 'https://pytorch-lightning.readthedocs.io', category: 'Framework' },
      { title: 'Hugging Face Model Hub', url: 'https://huggingface.co', category: 'Models' }
    ],
    screenshots: ['/images/marketplace/ai-screenshot1.jpg'],
    testimonials: [
      {
        name: 'Dr. Emily Watson',
        avatar: 'EW',
        rating: 5,
        comment: 'Incredible collection! Helped me transition from academia to industry AI roles. The research papers section is gold.',
        verified: true
      }
    ],
    faqs: [
      {
        question: 'Is this suitable for beginners?',
        answer: 'This collection is designed for intermediate to advanced users. Some programming experience in Python is recommended.'
      },
      {
        question: 'Are the datasets free to use?',
        answer: 'Most datasets linked are open source, but some may require registration or have usage restrictions. Each link includes licensing information.'
      }
    ]
  },
  '3': {
    id: '3',
    title: 'Design System Inspiration',
    description: 'Beautiful design systems and UI/UX resources from top companies',
    fullDescription: `Elevate your design skills with this comprehensive collection of design systems, UI components, and UX resources from the world's leading companies and design teams.

**What's Included:**
• 78 hand-picked design system examples
• Component libraries from top companies
• Design tokens and style guides
• Accessibility best practices
• User research methodologies
• Prototyping tools and templates
• Design process documentation
• Color palette generators and tools

**Featured Design Systems:**
• Material Design (Google)
• Human Interface Guidelines (Apple)
• Atlassian Design System
• IBM Carbon Design System
• Shopify Polaris
• Microsoft Fluent Design
• Ant Design
• Lightning Design System (Salesforce)

Perfect for designers, developers, and product managers looking to create cohesive, scalable design systems.`,
    category: 'Design',
    price: 19.99,
    originalPrice: 29.99,
    rating: 4.7,
    reviews: 203,
    downloads: 3421,
    author: 'DesignGuru',
    authorAvatar: 'DG',
    authorBio: 'Senior Product Designer at Meta, previously at Airbnb. Design systems expert with 10+ years experience.',
    authorVerified: true,
    bookmarkCount: 78,
    tags: ['UI/UX', 'Figma', 'Components', 'Inspiration', 'Design Systems', 'Accessibility'],
    featured: false,
    premium: false,
    lastUpdated: '2024-01-08',
    createdAt: '2023-05-20',
    language: 'English',
    difficulty: 'All Levels',
    previewBookmarks: [
      { title: 'Material Design Guidelines', url: 'https://material.io', category: 'Design System' },
      { title: 'Apple Human Interface Guidelines', url: 'https://developer.apple.com/design', category: 'Design System' },
      { title: 'Atlassian Design System', url: 'https://atlassian.design', category: 'Design System' },
      { title: 'Figma Component Libraries', url: 'https://figma.com', category: 'Tools' },
      { title: 'Adobe Color Palette Generator', url: 'https://color.adobe.com', category: 'Tools' }
    ],
    screenshots: ['/images/marketplace/design-screenshot1.jpg'],
    testimonials: [
      {
        name: 'Alex Chen',
        avatar: 'AC',
        rating: 5,
        comment: 'Amazing resource for building consistent design systems. Saved our team months of research!',
        verified: true
      }
    ],
    faqs: [
      {
        question: 'Do I need Figma to use these resources?',
        answer: 'While many resources are Figma-based, the collection includes tools and examples for Sketch, Adobe XD, and other design platforms.'
      }
    ]
  }
}

interface MarketplaceDetailPageProps {
  params: Promise<{ id: string }>
}

export default function MarketplaceDetailPage({ params }: MarketplaceDetailPageProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  const resolvedParams = use(params)
  const item = mockData[resolvedParams.id as keyof typeof mockData]
  
  if (!item) {
    notFound()
  }

  const handlePurchase = () => {
    toast.success('Redirecting to secure checkout...')
    // Redirect to payment page with product ID
    window.location.href = `/marketplace/payment?id=${item.id}`
  }

  const handleFavorite = () => {
    setIsFavorite(!isFavorite)
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites')
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  const savings = item.originalPrice - item.price
  const savingsPercent = Math.round((savings / item.originalPrice) * 100)

  // Helper for overview word limit
  const OVERVIEW_WORD_LIMIT = 100
  const limitOverview = (text: string) => {
    const words = text.split(' ').filter(word => word.trim() !== '')
    if (words.length <= OVERVIEW_WORD_LIMIT) return text
    return words.slice(0, OVERVIEW_WORD_LIMIT).join(' ') + '...'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/marketplace" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
              <ArrowLeft className="h-5 w-5" />
              Back to Marketplace
            </Link>
            <span className="h-6 border-l border-gray-200" />
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-gray-700" />
              <span className="text-xl font-bold">Product Details</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section */}
            <Card>
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shrink-0">
                    {item.authorAvatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">{item.title}</h1>
                      {item.featured && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          <Award className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        {renderStars(item.rating)}
                        <span className="text-sm font-medium ml-1">{item.rating}</span>
                        <span className="text-sm text-gray-500">({item.reviews} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Download className="h-4 w-4" />
                        {item.downloads.toLocaleString()} downloads
                      </div>
                    </div>

                    <p className="text-gray-600 text-lg leading-relaxed">{item.description}</p>
                    
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>{item.authorAvatar}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">{item.author}</span>
                            {item.authorVerified && (
                              <Shield className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500">Verified Creator</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">{item.category}</Badge>
                      <Badge variant="outline">{item.difficulty}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="contents">Contents</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="author">Author</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Collection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                        {limitOverview(item.fullDescription)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Key Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Lifetime Access</div>
                          <div className="text-sm text-gray-500">Access forever, including updates</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Regular Updates</div>
                          <div className="text-sm text-gray-500">Monthly content updates</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Globe className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">Organized Categories</div>
                          <div className="text-sm text-gray-500">Perfectly structured content</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-medium">Trending Resources</div>
                          <div className="text-sm text-gray-500">Latest industry tools</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {item.faqs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Frequently Asked Questions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {item.faqs.slice(0, 5).map((faq, index) => (
                          <div key={index}>
                            <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
                            <p className="text-gray-600">{faq.answer}</p>
                            {index < item.faqs.length - 1 && <Separator className="mt-4" />}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="contents" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Preview Bookmarks ({item.previewBookmarks.length} of {item.bookmarkCount})</CardTitle>
                    <p className="text-sm text-gray-600">Get a taste of what&apos;s included in this collection</p>
                  </CardHeader>
                  <CardContent>
                    {/* Blurred Content Teaser - cover ALL links */}
                    <div className="relative">
                      <div className="space-y-3 blur-sm pointer-events-none select-none">
                        {item.previewBookmarks.map((bookmark, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-60">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <ExternalLink className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{bookmark.title}</div>
                              <div className="text-sm text-gray-500">{bookmark.category}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">{bookmark.category}</Badge>
                          </div>
                        ))}
                      </div>
                      {/* Overlay with purchase prompt */}
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent flex items-center justify-center">
                        <div className="text-center p-6 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg">
                          <div className="mb-4">
                            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Unlock Full Collection</h3>
                            <p className="text-gray-600 mb-4">
                              Get access to all {item.bookmarkCount} premium bookmarks and exclusive content
                            </p>
                          </div>
                          <Button 
                            onClick={handlePurchase}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold"
                          >
                            Purchase Now - ${item.price}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Shield className="h-5 w-5" />
                        <span className="font-medium">
                          +{item.bookmarkCount - item.previewBookmarks.length} more premium bookmarks available after purchase
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Reviews</CardTitle>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {renderStars(item.rating)}
                        <span className="text-2xl font-bold ml-2">{item.rating}</span>
                      </div>
                      <div className="text-gray-600">
                        Based on {item.reviews} reviews
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {item.testimonials.length > 0 ? (
                      <div className="space-y-6">
                        {item.testimonials.map((testimonial, index) => (
                          <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                            <div className="flex items-start gap-4">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">{testimonial.name}</span>
                                  {testimonial.verified && (
                                    <Badge variant="outline" className="text-xs">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Verified Purchase
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mb-2">
                                  {renderStars(testimonial.rating)}
                                </div>
                                <p className="text-gray-700">{testimonial.comment}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No reviews yet. Be the first to review this collection!
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="author" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About the Author</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-6">
                      <Avatar className="w-20 h-20">
                        <AvatarFallback className="text-2xl">{item.authorAvatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold">{item.author}</h3>
                          {item.authorVerified && (
                            <Shield className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <p className="text-gray-600 mb-4">{item.authorBio}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Member Since:</span>
                            <div className="text-gray-600">{new Date(item.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <span className="font-medium">Total Downloads:</span>
                            <div className="text-gray-600">{item.downloads.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl font-bold text-green-600">${item.price}</span>
                      {item.originalPrice > item.price && (
                        <>
                          <span className="text-lg text-gray-500 line-through">${item.originalPrice}</span>
                          <Badge className="bg-red-100 text-red-800">
                            Save {savingsPercent}%
                          </Badge>
                        </>
                      )}
                    </div>
                    {item.originalPrice > item.price && (
                      <p className="text-sm text-gray-600">
                        You save ${savings.toFixed(2)} with this offer!
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button 
                      onClick={handlePurchase}
                      className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Buy Now
                    </Button>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant="outline" 
                        onClick={handleFavorite}
                        className="flex items-center gap-2"
                      >
                        <Heart className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-red-500' : ''}`} />
                        {isFavorite ? 'Saved' : 'Save'}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleShare}
                        className="flex items-center gap-2"
                      >
                        <Share2 className="h-4 w-4" />
                        Share
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => window.location.href = `/marketplace/edit/${item.id}`}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Instant download after purchase</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Lifetime access & updates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>30-day money-back guarantee</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Compatible with all browsers</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Collection Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Bookmarks</span>
                    <span className="font-semibold">{item.bookmarkCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Category</span>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Difficulty</span>
                    <Badge variant="outline">{item.difficulty}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Language</span>
                    <span className="font-semibold">{item.language}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="font-semibold">{new Date(item.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 