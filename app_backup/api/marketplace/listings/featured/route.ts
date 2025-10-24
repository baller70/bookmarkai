import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '6')

    const featuredListings = [
      {
        id: '1',
        title: 'Ultimate Web Development Resources',
        description: 'Comprehensive collection of tools, tutorials, and frameworks for modern web development',
        category: 'Development',
        price: 29.99,
        rating: 4.9,
        reviews: 156,
        downloads: 2341,
        author: 'DevMaster Pro',
        authorAvatar: 'DM',
        bookmarkCount: 127,
        tags: ['React', 'JavaScript', 'CSS', 'Tools'],
        featured: true,
        premium: true,
        previewBookmarks: ['React Documentation', 'CSS Grid Guide', 'JavaScript ES6 Features'],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z'
      },
      {
        id: '2',
        title: 'AI & Machine Learning Essentials',
        description: 'Curated resources for learning and implementing AI/ML solutions',
        category: 'AI/ML',
        price: 39.99,
        rating: 4.8,
        reviews: 89,
        downloads: 1567,
        author: 'AI Researcher',
        authorAvatar: 'AR',
        bookmarkCount: 94,
        tags: ['TensorFlow', 'PyTorch', 'Datasets', 'Papers'],
        featured: true,
        premium: true,
        previewBookmarks: ['TensorFlow Tutorials', 'Kaggle Datasets', 'ArXiv Papers'],
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-18T12:00:00Z'
      },
      {
        id: '3',
        title: 'Design System Inspiration',
        description: 'Beautiful design systems and UI/UX resources from top companies',
        category: 'Design',
        price: 19.99,
        rating: 4.7,
        reviews: 203,
        downloads: 3421,
        author: 'DesignGuru',
        authorAvatar: 'DG',
        bookmarkCount: 78,
        tags: ['UI/UX', 'Figma', 'Components', 'Inspiration'],
        featured: true,
        premium: false,
        previewBookmarks: ['Material Design', 'Apple HIG', 'Atlassian Design'],
        createdAt: '2024-01-05T14:00:00Z',
        updatedAt: '2024-01-16T09:45:00Z'
      },
      {
        id: '4',
        title: 'Marketing Growth Hacks',
        description: 'Proven marketing strategies and tools for rapid business growth',
        category: 'Marketing',
        price: 24.99,
        rating: 4.6,
        reviews: 134,
        downloads: 1892,
        author: 'GrowthHacker',
        authorAvatar: 'GH',
        bookmarkCount: 65,
        tags: ['SEO', 'Social Media', 'Analytics', 'Growth'],
        featured: true,
        premium: true,
        previewBookmarks: ['Google Analytics Guide', 'Facebook Ads Manager', 'SEO Checklist'],
        createdAt: '2024-01-12T11:30:00Z',
        updatedAt: '2024-01-19T16:20:00Z'
      },
      {
        id: '5',
        title: 'Business Intelligence Tools',
        description: 'Essential BI tools and dashboards for data-driven decisions',
        category: 'Business',
        price: 34.99,
        rating: 4.5,
        reviews: 87,
        downloads: 1245,
        author: 'DataAnalyst',
        authorAvatar: 'DA',
        bookmarkCount: 89,
        tags: ['BI', 'Analytics', 'Dashboards', 'Reports'],
        featured: true,
        premium: true,
        previewBookmarks: ['Tableau Public', 'Power BI Templates', 'Google Data Studio'],
        createdAt: '2024-01-08T13:15:00Z',
        updatedAt: '2024-01-17T10:30:00Z'
      },
      {
        id: '6',
        title: 'Educational Resources Hub',
        description: 'Curated learning materials for continuous education and skill development',
        category: 'Education',
        price: 14.99,
        rating: 4.8,
        reviews: 267,
        downloads: 4156,
        author: 'EduMaster',
        authorAvatar: 'EM',
        bookmarkCount: 156,
        tags: ['Online Courses', 'Tutorials', 'Certification', 'Learning'],
        featured: true,
        premium: false,
        previewBookmarks: ['Coursera Courses', 'Khan Academy', 'edX Programs'],
        createdAt: '2024-01-03T09:00:00Z',
        updatedAt: '2024-01-15T14:45:00Z'
      }
    ]

    const limitedListings = featuredListings.slice(0, limit)

    return NextResponse.json({ 
      listings: limitedListings,
      total: featuredListings.length,
      limit,
      page: 1
    })
  } catch (error) {
    console.error('Error fetching featured listings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch featured listings' },
      { status: 500 }
    )
  }
} 