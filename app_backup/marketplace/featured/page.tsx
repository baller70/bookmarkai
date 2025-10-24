
'use client'
export const dynamic = 'force-dynamic'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Download, Eye, Heart, TrendingUp } from 'lucide-react'

export default function FeaturedPage() {
  const featuredPlaybooks = [
    {
      id: 1,
      title: "Web Development Essentials",
      author: "DevMaster",
      description: "Complete collection of essential web development resources, from HTML basics to advanced frameworks.",
      price: "$29.99",
      rating: 4.9,
      reviews: 234,
      downloads: 1247,
      tags: ["web-dev", "javascript", "react", "css"],
      featured: true
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
      featured: true
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
      featured: true
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
      featured: true
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Star className="h-8 w-8 text-yellow-600" />
        <div>
          <h1 className="text-2xl font-bold">Featured Playbooks</h1>
          <p className="text-gray-600">Hand-picked premium bookmark collections</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Featured This Week</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Downloads</p>
                <p className="text-2xl font-bold">4.2k</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-500" />
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
              <Eye className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Views Today</p>
                <p className="text-2xl font-bold">1.8k</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Playbooks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {featuredPlaybooks.map((playbook) => (
          <Card key={playbook.id} className="relative">
            <div className="absolute top-4 right-4">
              <Badge variant="default" className="bg-yellow-500">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            </div>
            
            <CardHeader>
              <CardTitle className="text-xl">{playbook.title}</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                by {playbook.author}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <p className="text-gray-700 mb-4">{playbook.description}</p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {playbook.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
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

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" size="lg">
          Load More Featured Playbooks
        </Button>
      </div>
    </div>
  )
} 