'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Star, 
  Package, 
  Edit, 
  Trash2, 
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SellerStats, Listing, ListingResponse, MARKETPLACE_CONFIG } from '../models';
import { MarketplaceService } from '../services/MarketplaceService';
import { PaymentService } from '../services/PaymentService';
import { CreateListingModal } from './CreateListingModal';
import { PayoutModal } from './PayoutModal';

const marketplaceService = new MarketplaceService();
const paymentService = new PaymentService(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

export function SellerDashboard() {
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [earnings, setEarnings] = useState({ totalEarnings: 0, availableBalance: 0, pendingBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, listingsData, earningsData] = await Promise.all([
          marketplaceService.getSellerStats('current-user'), // Replace with actual user ID
          marketplaceService.getSellerListings('current-user'),
          paymentService.getEarnings()
        ]);
        
        setStats(statsData);
        setListings(listingsData.data);
        setEarnings(earningsData);
      } catch (error) {
        console.error('Failed to fetch seller data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteListing = async (listingId: string) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      try {
        await marketplaceService.deleteListing(listingId);
        setListings(prev => prev.filter(l => l.id !== listingId));
      } catch (error) {
        console.error('Failed to delete listing:', error);
      }
    }
  };

  const handleToggleActive = async (listingId: string, isActive: boolean) => {
    try {
      await marketplaceService.updateListing(listingId, { isActive: !isActive });
      setListings(prev => prev.map(l => 
        l.id === listingId ? { ...l, isActive: !isActive } : l
      ));
    } catch (error) {
      console.error('Failed to update listing:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your marketplace listings and earnings</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Listing
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalSales || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(earnings.totalEarnings / 100).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.averageRating?.toFixed(1) || '0.0'}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Listings</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeListings || 0}</p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="listings">My Listings</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="listings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={listing.thumbnail}
                            alt={listing.title}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium">{listing.title}</p>
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {listing.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {listing.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {marketplaceService.formatPrice(listing.priceCents, listing.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={listing.isActive ? "default" : "secondary"}
                          className={listing.isActive ? "bg-green-100 text-green-800" : ""}
                        >
                          {listing.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span>{listing.ratingAvg.toFixed(1)}</span>
                          <span className="text-gray-500">({listing.ratingCount})</span>
                        </div>
                      </TableCell>
                      <TableCell>0</TableCell> {/* TODO: Add sales count */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(listing.id, listing.isActive)}
                            >
                              {listing.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteListing(listing.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="earnings" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 mb-2">Available Balance</h3>
                <p className="text-3xl font-bold text-green-600">
                  ${(earnings.availableBalance / 100).toFixed(2)}
                </p>
                <Button 
                  className="w-full mt-4" 
                  onClick={() => setShowPayoutModal(true)}
                  disabled={earnings.availableBalance < 2000} // $20 minimum
                >
                  Request Payout
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 mb-2">Pending Balance</h3>
                <p className="text-3xl font-bold text-yellow-600">
                  ${(earnings.pendingBalance / 100).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Processing payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 mb-2">Total Earned</h3>
                <p className="text-3xl font-bold text-blue-600">
                  ${(earnings.totalEarnings / 100).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  All time earnings
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Analytics</h3>
              <p className="text-gray-600">Analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showCreateModal && (
        <CreateListingModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newListing) => {
            // Convert Listing to ListingResponse format
            const listingResponse: ListingResponse = {
              ...newListing,
              seller: {
                id: newListing.sellerId,
                name: 'Current User', // TODO: Get from auth
                avatar: '/default-avatar.png'
              },
              reviewsCount: 0,
              recentReviews: []
            };
            setListings(prev => [listingResponse, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}

      {showPayoutModal && (
        <PayoutModal
          availableBalance={earnings.availableBalance}
          onClose={() => setShowPayoutModal(false)}
          onSuccess={() => {
            setShowPayoutModal(false);
            // Refresh earnings
          }}
        />
      )}
    </div>
  );
}