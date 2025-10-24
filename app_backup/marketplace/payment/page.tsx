
'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft,
  CreditCard,
  Shield,
  Check,
  Lock,
  Star,
  Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// Mock data for the product being purchased
const mockData = {
  '1': {
    id: '1',
    title: 'Ultimate Web Development Resources',
    author: 'DevMaster Pro',
    authorAvatar: 'DM',
    price: 29.99,
    originalPrice: 49.99,
    rating: 4.9,
    reviews: 156,
    downloads: 2341,
    bookmarkCount: 127,
    category: 'Development'
  },
  '2': {
    id: '2',
    title: 'AI & Machine Learning Essentials',
    author: 'AI Researcher', 
    authorAvatar: 'AR',
    price: 39.99,
    originalPrice: 59.99,
    rating: 4.8,
    reviews: 89,
    downloads: 1567,
    bookmarkCount: 94,
    category: 'AI/ML'
  },
  '3': {
    id: '3',
    title: 'Design System Inspiration',
    author: 'DesignGuru',
    authorAvatar: 'DG', 
    price: 19.99,
    originalPrice: 29.99,
    rating: 4.7,
    reviews: 203,
    downloads: 3421,
    bookmarkCount: 78,
    category: 'Design'
  }
}

function PaymentPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const productId = searchParams.get('id')
  
  const [formData, setFormData] = useState({
    email: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    country: '',
    zipCode: ''
  })
  
  const [isProcessing, setIsProcessing] = useState(false)
  
  const product = productId ? mockData[productId as keyof typeof mockData] : null
  
  useEffect(() => {
    if (!productId || !product) {
      router.push('/marketplace')
    }
  }, [productId, product, router])
  
  if (!product) {
    return null
  }
  
  const savings = product.originalPrice - product.price
  const savingsPercent = Math.round((savings / product.originalPrice) * 100)
  const tax = product.price * 0.08 // 8% tax
  const total = product.price + tax
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    
    // Simulate payment processing
    try {
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      toast.success('Payment successful! Redirecting to download...')
      
      // In real app, would redirect to success page or download
      setTimeout(() => {
        router.push(`/marketplace/${productId}?purchased=true`)
      }, 2000)
      
    } catch (error) {
      toast.error('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
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
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/marketplace/${productId}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
              <ArrowLeft className="h-5 w-5" />
              Back to Product
            </Link>
            <span className="h-6 border-l border-gray-200" />
            <span className="flex items-center gap-2">
              <Lock className="h-6 w-6 text-green-600" />
              <span className="text-xl font-bold">Secure Checkout</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-6 w-6" />
                  Payment Information
                </CardTitle>
                <p className="text-sm text-gray-600">Your payment is secured with 256-bit SSL encryption</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      type="text"
                      value={formData.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        type="text"
                        value={formData.expiryDate}
                        onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        type="text"
                        value={formData.cvv}
                        onChange={(e) => handleInputChange('cvv', e.target.value)}
                        placeholder="123"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="cardholderName">Cardholder Name</Label>
                    <Input
                      id="cardholderName"
                      type="text"
                      value={formData.cardholderName}
                      onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select onValueChange={(value) => handleInputChange('country', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="AU">Australia</SelectItem>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        type="text"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        placeholder="12345"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing Payment...
                      </div>
                    ) : (
                      <>
                        <Lock className="h-5 w-5 mr-2" />
                        Complete Purchase - ${total.toFixed(2)}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Security Features */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>SSL Secured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-green-600" />
                    <span>256-bit Encryption</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Money-back Guarantee</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Info */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shrink-0">
                    {product.authorAvatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{product.title}</h3>
                    <p className="text-sm text-gray-600">by {product.author}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        {renderStars(product.rating)}
                        <span className="text-sm">{product.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">({product.reviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {product.downloads.toLocaleString()}
                      </span>
                      <span>{product.bookmarkCount} bookmarks</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${product.price.toFixed(2)}</span>
                  </div>
                  {product.originalPrice > product.price && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({savingsPercent}% off)</span>
                      <span>-${savings.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                
                <Separator />
                
                {/* What's Included */}
                <div>
                  <h4 className="font-medium mb-3">What&apos;s Included:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>{product.bookmarkCount} premium bookmarks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Instant download access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Lifetime updates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>30-day money-back guarantee</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>24/7 customer support</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading payment page...</div>}>
      <PaymentPageContent />
    </Suspense>
  );
} 