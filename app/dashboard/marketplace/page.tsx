
'use client'
export const dynamic = 'force-dynamic'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Star, Download, Eye, Heart, TrendingUp, Users, DollarSign } from 'lucide-react'

export default function MarketplacePage() {
  const featuredPlaybooks = [
    {
      id: 1,
      title: "Web Development Essentials",
      author: "DevMaster",
      description: "Complete collection of essential web development resources and tools for modern developers.",
      price: "$29.99",
      rating: 4.9,
      reviews: 234,
      downloads: 1247,
      tags: ["web-dev", "javascript", "react", "css"],
      bookmarkCount: 127
    },
    {
      id: 2,
      title: "UI/UX Design Mastery",
      author: "DesignPro",
      description: "Curated collection of design resources, tools, and inspiration for modern UI/UX designers.",
      price: "$24.99",
      rating: 4.8,
      reviews: 189,
      downloads: 892,
      tags: ["design", "ui-ux", "figma", "prototyping"],
      bookmarkCount: 94
    },
    {
      id: 3,
      title: "Machine Learning Resources",
      author: "MLExpert",
      description: "Comprehensive guide to machine learning with papers, tutorials, and practical implementations.",
      price: "$39.99",
      rating: 4.9,
      reviews: 156,
      downloads: 743,
      tags: ["ml", "ai", "python", "data-science"],
      bookmarkCount: 112
    },
    {
      id: 4,
      title: "Startup Toolkit",
      author: "EntrepreneurHub",
      description: "Everything you need to start and grow your startup, from ideation to scaling.",
      price: "$19.99",
      rating: 4.7,
      reviews: 298,
      downloads: 1156,
      tags: ["startup", "business", "marketing", "growth"],
      bookmarkCount: 89
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Browse Marketplace</h1>
          <p className="text-gray-600">Discover and purchase curated bookmark collections</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Create Playbook
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Playbooks</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Downloads</p>
                <p className="text-2xl font-bold">45.2k</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold">4.8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold">$12.4k</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search playbooks..."
              className="flex-1"
            />
            <Button variant="outline">
              Filter
            </Button>
            <Button variant="outline">
              Sort
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Featured Playbooks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Popular Playbooks</h2>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredPlaybooks.map((playbook) => (
            <Card key={playbook.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{playbook.title}</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      by {playbook.author}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {playbook.bookmarkCount} bookmarks
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-700 mb-4">{playbook.description}</p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {playbook.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{playbook.rating}</span>
                      <span className="text-sm text-gray-500">({playbook.reviews})</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Download className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">{playbook.downloads}</span>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-green-600">{playbook.price}</span>
                </div>
                
                <div className="flex space-x-2">
                  <Button className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Purchase
                  </Button>
                  <Button variant="outline" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Trending Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Trending Categories</CardTitle>
          <CardDescription>Most popular categories this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Development", count: 342, trend: "+12%" },
              { name: "Design", count: 189, trend: "+8%" },
              { name: "Marketing", count: 156, trend: "+15%" },
              { name: "AI/ML", count: 134, trend: "+23%" }
            ].map((category, index) => (
              <div key={index} className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <h3 className="font-medium">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.count} playbooks</p>
                <div className="flex items-center justify-center space-x-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">{category.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest marketplace updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: "New playbook published", item: "React Performance Tips", author: "ReactExpert", time: "2 hours ago" },
              { action: "Playbook updated", item: "Design System Guide", author: "DesignPro", time: "4 hours ago" },
              { action: "Achievement unlocked", item: "First 100 downloads", author: "NewCreator", time: "6 hours ago" },
              { action: "Review posted", item: "5-star review on ML Resources", author: "DataScientist", time: "8 hours ago" }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.item} by {activity.author}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

