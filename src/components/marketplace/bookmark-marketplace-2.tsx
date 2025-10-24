'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Store,
  Search,
  Filter,
  Grid,
  List,
  Star,
  Heart,
  ShoppingCart,
  Plus,
  Edit,
  Trash,
  Play,
  BarChart,
  DollarSign,
  MessageCircle,
  CreditCard,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  Download,
  Eye,
  Calendar,
  FileText,
  Settings,
  Upload,
  Target,
  Zap,
  Award,
  Bookmark
} from 'lucide-react'

export default function BookmarkMarketplace2() {
  const [activeTab, setActiveTab] = useState('marketplace-home')
  const [viewMode, setViewMode] = useState('grid')
  const [priceRange, setPriceRange] = useState([0, 100])

  // Mock data
  const featuredBundles = [
    {
      id: 1,
      title: "Ultimate UI/UX Design Resources",
      author: "DesignPro",
      price: 29.99,
      rating: 4.8,
      reviews: 156,
      downloads: 2341,
      thumbnail: "/api/placeholder/300/200",
      tags: ["UI/UX", "Design", "Figma"]
    },
    {
      id: 2,
      title: "AI Tools Collection 2024",
      author: "TechGuru",
      price: 19.99,
      rating: 4.9,
      reviews: 89,
      downloads: 1523,
      thumbnail: "/api/placeholder/300/200",
      tags: ["AI", "Productivity", "Tools"]
    }
  ]

  const categories = [
    { name: "UI/UX", count: 234, color: "bg-blue-100 text-blue-800" },
    { name: "AI Tools", count: 189, color: "bg-purple-100 text-purple-800" },
    { name: "Productivity", count: 156, color: "bg-green-100 text-green-800" },
    { name: "Development", count: 145, color: "bg-orange-100 text-orange-800" },
    { name: "Marketing", count: 98, color: "bg-pink-100 text-pink-800" },
    { name: "Learning", count: 76, color: "bg-indigo-100 text-indigo-800" }
  ]

  const trendingTags = [
    { name: "figma", sales: 156 },
    { name: "ai-tools", sales: 134 },
    { name: "productivity", sales: 98 },
    { name: "design-system", sales: 87 },
    { name: "react", sales: 76 }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Store className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Bookmark Marketplace 2.0</h1>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">Pro</Badge>
          </div>
          <p className="text-gray-600 text-lg">Discover, buy, and sell curated bookmark collections from the community</p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9 mb-8">
            <TabsTrigger value="marketplace-home">Home</TabsTrigger>
            <TabsTrigger value="browse-listings">Browse</TabsTrigger>
            <TabsTrigger value="create-listing">Create</TabsTrigger>
            <TabsTrigger value="my-listings">My Listings</TabsTrigger>
            <TabsTrigger value="sales-analytics">Analytics</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* 1. Marketplace Home */}
          <TabsContent value="marketplace-home" className="space-y-8">
            {/* Hero Carousel */}
            <Card>
              <CardContent className="p-0">
                <div className="relative h-64 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-between p-8">
                    <div className="text-white">
                      <h2 className="text-3xl font-bold mb-2">Featured Collection</h2>
                      <p className="text-lg opacity-90">Ultimate UI/UX Design Resources</p>
                      <Button className="mt-4 bg-white text-blue-600 hover:bg-gray-100">
                        View Collection
                      </Button>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Bar */}
            <Card>
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Find bookmark bundles..." 
                    className="pl-10 text-lg h-12"
                  />
                  <Button className="absolute right-2 top-2 h-8">
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Category Tiles */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Browse Categories</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.map((category, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center mx-auto mb-2`}>
                        <Bookmark className="h-6 w-6" />
                      </div>
                      <h4 className="font-medium">{category.name}</h4>
                      <p className="text-sm text-gray-500">{category.count} bundles</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Trending Tags Cloud */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Trending Tags</h3>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((tag, index) => (
                  <Badge 
                    key={index}
                    variant="secondary" 
                    className="cursor-pointer hover:bg-blue-100 hover:text-blue-700"
                    style={{ fontSize: `${Math.max(12, Math.min(18, tag.sales / 10 + 12))}px` }}
                  >
                    #{tag.name} ({tag.sales})
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recommended for You */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Recommended for You</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredBundles.map((bundle) => (
                  <Card key={bundle.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <img 
                        src={bundle.thumbnail} 
                        alt={bundle.title}
                        className="w-full h-32 object-cover rounded-t-lg"
                      />
                      <div className="p-4">
                        <h4 className="font-semibold mb-1">{bundle.title}</h4>
                        <p className="text-sm text-gray-500 mb-2">by {bundle.author}</p>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm">{bundle.rating}</span>
                            <span className="text-xs text-gray-400">({bundle.reviews})</span>
                          </div>
                          <span className="font-bold text-blue-600">${bundle.price}</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" className="flex-1">
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Buy Now
                          </Button>
                          <Button variant="outline" size="sm">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* List Yours CTA */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-2">Ready to Sell Your Bookmarks?</h3>
                <p className="text-gray-600 mb-4">Join thousands of creators earning from their curated collections</p>
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-5 w-5 mr-2" />
                  List Your Collection
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Browse Listings */}
          <TabsContent value="browse-listings" className="space-y-6">
            {/* Filter Panel & Controls */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Filter Sidebar */}
              <Card className="lg:w-80">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Filter className="h-5 w-5 mr-2" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Price Range</label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={100}
                      step={1}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>

                  {/* Category Checkboxes */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Categories</label>
                    <div className="space-y-2">
                      {categories.map((category, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input type="checkbox" id={`cat-${index}`} className="rounded" />
                          <label htmlFor={`cat-${index}`} className="text-sm">{category.name}</label>
                          <span className="text-xs text-gray-400">({category.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Seller Rating */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Minimum Rating</label>
                    <Slider defaultValue={[4]} max={5} step={0.1} />
                  </div>
                </CardContent>
              </Card>

              {/* Main Content */}
              <div className="flex-1">
                {/* Sort & View Controls */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <Select defaultValue="newest">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    AI Assist
                  </Button>
                </div>

                {/* Results */}
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {featuredBundles.map((bundle) => (
                    <Card key={bundle.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardContent className={viewMode === 'grid' ? 'p-0' : 'p-4'}>
                        {viewMode === 'grid' ? (
                          <>
                            <img 
                              src={bundle.thumbnail} 
                              alt={bundle.title}
                              className="w-full h-32 object-cover rounded-t-lg"
                            />
                            <div className="p-4">
                              <h4 className="font-semibold mb-1">{bundle.title}</h4>
                              <p className="text-sm text-gray-500 mb-2">by {bundle.author}</p>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                  <span className="text-sm">{bundle.rating}</span>
                                </div>
                                <span className="font-bold text-blue-600">${bundle.price}</span>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" className="flex-1">Buy Now</Button>
                                <Button variant="outline" size="sm">
                                  <Heart className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center space-x-4">
                            <img 
                              src={bundle.thumbnail} 
                              alt={bundle.title}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold">{bundle.title}</h4>
                              <p className="text-sm text-gray-500">by {bundle.author}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                  <span className="text-sm">{bundle.rating}</span>
                                </div>
                                <span className="text-sm text-gray-500">{bundle.downloads} downloads</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-blue-600 mb-2">${bundle.price}</div>
                              <div className="flex space-x-2">
                                <Button size="sm">Buy Now</Button>
                                <Button variant="outline" size="sm">
                                  <Heart className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 3. Create Listing */}
          <TabsContent value="create-listing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Listing</CardTitle>
                <CardDescription>List your bookmark collection for sale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Multi-Step Form */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Title</label>
                        <Input placeholder="Enter listing title" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Category</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat, index) => (
                              <SelectItem key={index} value={cat.name.toLowerCase()}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Short Description</label>
                      <Textarea placeholder="Describe your bookmark collection..." />
                    </div>
                  </div>

                  {/* Content Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Content Selection</h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Drag and drop URLs or select from your bookmarks</p>
                      <Button variant="outline">
                        Select Bookmarks
                      </Button>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Pricing & Licensing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Price</label>
                        <Input type="number" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">License Type</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select license" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="personal">Personal Use</SelectItem>
                            <SelectItem value="commercial">Commercial Use</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Switch id="subscription" />
                        <label htmlFor="subscription" className="text-sm">Subscription model</label>
                      </div>
                    </div>
                  </div>

                  {/* AI Description Helper */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">AI Description Helper</h4>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">Let AI craft a compelling description based on your bookmarks</p>
                    <Button variant="outline" size="sm" className="border-blue-300 text-blue-700">
                      Generate Description
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4 pt-6">
                    <Button className="flex-1">
                      Publish Listing
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Save as Draft
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. My Listings */}
          <TabsContent value="my-listings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">My Listings</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Listing
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Title</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Price</th>
                        <th className="text-left p-4 font-medium">Sales</th>
                        <th className="text-left p-4 font-medium">Views</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {featuredBundles.map((bundle) => (
                        <tr key={bundle.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <img 
                                src={bundle.thumbnail} 
                                alt={bundle.title}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div>
                                <div className="font-medium">{bundle.title}</div>
                                <div className="text-sm text-gray-500">Created 2 days ago</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          </td>
                          <td className="p-4 font-medium">${bundle.price}</td>
                          <td className="p-4">{bundle.downloads}</td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <span>1,234</span>
                              <div className="w-16 h-2 bg-gray-200 rounded">
                                <div className="w-3/4 h-full bg-blue-500 rounded"></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 5. Sales Analytics */}
          <TabsContent value="sales-analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Revenue</p>
                      <p className="text-2xl font-bold">$2,341</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Items Sold</p>
                      <p className="text-2xl font-bold">156</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Avg. Price</p>
                      <p className="text-2xl font-bold">$15.01</p>
                    </div>
                    <BarChart className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Conversion Rate</p>
                      <p className="text-2xl font-bold">3.2%</p>
                    </div>
                    <Target className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
                <CardDescription>Track your earnings and sales trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Interactive sales chart would go here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">💡 Pricing Optimization</h4>
                    <p className="text-sm text-blue-700">Consider reducing the price of "AI Tools Collection" by 15% to increase sales volume.</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">📈 Trending Category</h4>
                    <p className="text-sm text-green-700">UI/UX resources are trending. Consider creating more design-focused collections.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 6. Transactions */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>View all your purchases and sales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">UI/UX Design Bundle purchased</p>
                          <p className="text-sm text-gray-500">Transaction ID: TXN-{1000 + i}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$29.99</p>
                        <p className="text-sm text-gray-500">2 days ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 7. Messages */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>Communicate with buyers and sellers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">User{i}23</p>
                          <span className="text-xs text-gray-500">2h ago</span>
                        </div>
                        <p className="text-sm text-gray-600">Question about your AI Tools collection...</p>
                      </div>
                      <Badge variant="secondary">New</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 8. Payouts */}
          <TabsContent value="payouts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payouts</CardTitle>
                <CardDescription>Manage your earnings and payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-700">Available Balance</p>
                    <p className="text-2xl font-bold text-green-900">$1,234.56</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">Pending</p>
                    <p className="text-2xl font-bold text-blue-900">$456.78</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">Total Earned</p>
                    <p className="text-2xl font-bold text-gray-900">$3,456.78</p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Request Payout
                  </Button>
                  <Button variant="outline">
                    Payment Methods
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 9. Reviews */}
          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reviews & Ratings</CardTitle>
                <CardDescription>Feedback from your customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">U{i}</span>
                          </div>
                          <span className="font-medium">User{i}23</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="h-4 w-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        "Excellent collection of AI tools! Very well organized and saved me hours of research."
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>AI Tools Collection</span>
                        <span>3 days ago</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 