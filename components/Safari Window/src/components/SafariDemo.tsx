/* eslint-disable no-unused-vars */
import { Safari } from "./magicui/safari";
import { useState, useEffect } from "react";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  MessageSquare, // Reddit
  MessageCircle, // Discord and WhatsApp
  Mail,         // Gmail
  Search,       // Google
  Tv,           // TikTok
  DollarSign,   // Finance
  BookMarked,
  LineChart,
  Cog,
  MailCheck,    // Outlook
  Image,
  Video,
  Heart,
  Users,
  User,         // For user profiles
  Menu,
  Settings,
  PenTool,      // For Canva
  Bot,          // For ChatGPT
  ShoppingBag,   // For Shopify
  Bell,         // For notifications
  Repeat,       // For refresh/sync
  BarChart2,    // For analytics
  TrendingUp,
  ShieldCheck,
  Globe,
  Clock,
  ArrowRight,
  Check,
  Calendar,
} from "lucide-react";

import type { LucideProps } from "lucide-react";

// Simple placeholder WordPress icon (circle with "W")
const WordpressIcon = (props: LucideProps) => (
  <svg
    width={props.width || 16}
    height={props.height || 16}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fontSize="12"
      fontWeight="bold"
      fill="white"
    >
      W
    </text>
  </svg>
);

/* 13 social-media tabs with color schemes */
const socialTabs = [
  {
    name: "Facebook",
    icon: Facebook,
    color: "bg-blue-500",
    textColor: "text-blue-600",
    platform: "facebook"
  },
  {
    name: "X",
    icon: Twitter,
    color: "bg-black",
    textColor: "text-white",
    platform: "twitter"
  },
  {
    name: "Instagram",
    icon: Instagram,
    color: "bg-pink-500",
    textColor: "text-pink-600",
    platform: "instagram"
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    color: "bg-blue-700",
    textColor: "text-blue-700",
    platform: "linkedin"
  },
  {
    name: "YouTube",
    icon: Youtube,
    color: "bg-red-600",
    textColor: "text-red-600",
    platform: "youtube"
  },
  {
    name: "Canva",
    icon: PenTool,
    color: "bg-purple-600",
    textColor: "text-purple-600",
    platform: "canva"
  },
  {
    name: "ChatGPT",
    icon: Bot,
    color: "bg-green-600",
    textColor: "text-green-600",
    platform: "chatgpt"
  },
  {
    name: "Outlook",
    icon: MailCheck,
    color: "bg-blue-400",
    textColor: "text-blue-500",
    platform: "outlook"
  },
  {
    name: "WordPress",
    icon: WordpressIcon,
    color: "bg-[#21759b]",
    textColor: "text-[#21759b]",
    platform: "wordpress"
  },
  {
    name: "TikTok",
    icon: Tv,
    color: "bg-black",
    textColor: "text-slate-800",
    platform: "tiktok"
  },
  {
    name: "Shopify",
    icon: ShoppingBag,
    color: "bg-green-700",
    textColor: "text-green-700",
    platform: "shopify"
  },
  {
    name: "Gmail",
    icon: Mail,
    color: "bg-red-500",
    textColor: "text-red-500",
    platform: "gmail"
  }
];

const PlatformUI = ({ platform, opacity = 0.2 }: { platform: string, opacity?: number }) => {
  switch (platform) {
    case 'facebook':
      return (
        <div className="w-full h-full" style={{ opacity }}>
          {/* Facebook Header */}
          <div className="h-14 bg-[#1877F2] w-full flex items-center px-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <Facebook className="text-blue-600 h-6 w-6" />
            </div>
            <div className="flex-1 mx-4 h-10 bg-gray-100 rounded-full"></div>
            <div className="flex space-x-2">
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
            </div>
          </div>

          {/* Facebook Content */}
          <div className="flex h-[calc(100%-56px)]">
            {/* Left sidebar */}
            <div className="w-[250px] bg-white p-2 border-r border-gray-300">
              <div className="flex items-center p-2 rounded-lg bg-blue-50 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 mr-3"></div>
                <div className="h-5 bg-blue-100 w-32 rounded"></div>
              </div>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center p-2 rounded-lg hover:bg-gray-100 mb-1">
                  <div className="w-8 h-8 rounded-full bg-gray-200 mr-3"></div>
                  <div className="h-5 bg-gray-200 w-32 rounded"></div>
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 bg-[#F0F2F5] p-4 overflow-auto">
              {/* Create post */}
              <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 mr-2"></div>
                  <div className="flex-1 h-10 bg-gray-100 rounded-full"></div>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <div className="flex items-center">
                    <Video className="text-red-500 h-5 w-5 mr-2" />
                    <div className="h-4 bg-gray-200 w-16 rounded"></div>
                  </div>
                  <div className="flex items-center">
                    <Image className="text-green-500 h-5 w-5 mr-2" />
                    <div className="h-4 bg-gray-200 w-16 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Posts */}
              {[1,2].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 mr-2"></div>
                    <div>
                      <div className="h-5 bg-gray-300 w-32 rounded mb-1"></div>
                      <div className="h-4 bg-gray-200 w-24 rounded"></div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="h-4 bg-gray-300 w-full rounded mb-1"></div>
                    <div className="h-4 bg-gray-300 w-4/5 rounded"></div>
                  </div>
                  <div className="aspect-video bg-gray-100 rounded-lg mb-3"></div>
                  <div className="flex justify-between pt-2 border-t">
                    <div className="flex items-center">
                      <Heart className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="h-4 bg-gray-200 w-8 rounded"></div>
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="h-4 bg-gray-200 w-8 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right sidebar */}
            <div className="w-[250px] bg-white p-2 border-l border-gray-300">
              <div className="p-2">
                <div className="h-5 bg-gray-300 w-32 rounded mb-3"></div>
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 mr-2"></div>
                    <div className="h-5 bg-gray-200 w-24 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 'twitter':
      return (
        <div className="w-full h-full" style={{ opacity }}>
          {/* Twitter Header */}
          <div className="h-14 bg-[#1DA1F2] w-full flex items-center px-4">
            <Twitter className="text-white h-8 w-8" />
            <div className="flex-1 mx-4 max-w-md">
              <div className="h-10 bg-white/20 rounded-md w-full max-w-md mx-auto flex items-center px-4">
                <Search className="h-4 w-4 text-white/90 mr-2" />
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                <div className="w-5 h-5 rounded bg-gray-200 ml-2"></div>
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="w-8 h-8 rounded-full bg-white/30"></div>
              <div className="w-8 h-8 rounded-full bg-white/30"></div>
            </div>
          </div>

          <div className="flex h-[calc(100%-56px)]">
            {/* Left sidebar */}
            <div className="w-[250px] bg-white p-2 border-r border-gray-300">
              {["Home","Explore","Notifications","Messages","Bookmarks","Lists","Profile"].map(label => (
                <div key={label} className="flex items-center p-2 rounded-lg hover:bg-gray-100 mb-1">
                  <div className="w-6 h-6 rounded-full bg-gray-200 mr-3"></div>
                  <div className="h-5 bg-gray-200 w-24 rounded"></div>
                </div>
              ))}
              <div className="bg-[#1DA1F2] text-white rounded-full p-2 flex justify-center mt-2">
                <div className="h-5 font-bold w-20 text-center">Post</div>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 bg-[#F5F8FA] p-4 overflow-auto">
              {[1,2].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 mr-2"></div>
                    <div>
                      <div className="h-5 bg-gray-300 w-32 rounded mb-1"></div>
                      <div className="h-4 bg-gray-200 w-24 rounded"></div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="h-4 bg-gray-300 w-full rounded mb-1"></div>
                    <div className="h-4 bg-gray-300 w-4/5 rounded"></div>
                  </div>
                  <div className="aspect-video bg-gray-100 rounded-lg mb-3"></div>
                  <div className="flex justify-between pt-2 border-t">
                    <div className="flex items-center">
                      <Heart className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="h-4 bg-gray-200 w-8 rounded"></div>
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="h-4 bg-gray-200 w-8 rounded"></div>
                    </div>
                    <div className="flex items-center">
                      <Repeat className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="h-4 bg-gray-200 w-8 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right sidebar */}
            <div className="w-[250px] bg-white p-2 border-l border-gray-300">
              <div className="p-2">
                <div className="h-5 bg-gray-300 w-32 rounded mb-3"></div>
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 mr-2"></div>
                    <div className="h-5 bg-gray-200 w-24 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 'tiktok':
      return (
        <div className="w-full h-full" style={{ opacity }}>
          {/* TikTok Header */}
          <div className="h-14 bg-[#FE2C55] w-full flex items-center px-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <Tv className="text-[#FE2C55] h-6 w-6" />
            </div>
            <div className="flex-1 mx-4 h-10 bg-gray-100 rounded-full"></div>
            <div className="flex space-x-2">
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
            </div>
          </div>

          {/* TikTok Content (Facebook-style skeleton) */}
          <div className="flex h-[calc(100%-56px)]">
            {/* Left sidebar */}
            <div className="w-[250px] bg-white p-2 border-r border-gray-300">
              <div className="flex items-center p-2 rounded-lg bg-red-50 mb-2">
                <div className="w-8 h-8 rounded-full bg-red-100 mr-3"></div>
                <div className="h-5 bg-red-100 w-32 rounded"></div>
              </div>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center p-2 rounded-lg hover:bg-gray-100 mb-1">
                  <div className="w-8 h-8 rounded-full bg-gray-200 mr-3"></div>
                  <div className="h-5 bg-gray-200 w-32 rounded"></div>
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 bg-[#F0F2F5] p-4 overflow-auto">
              {/* Create post */}
              <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 mr-2"></div>
                  <div className="flex-1 h-10 bg-gray-100 rounded-full"></div>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <div className="flex items-center">
                    <Video className="text-red-500 h-5 w-5 mr-2" />
                    <div className="h-4 bg-gray-200 w-16 rounded"></div>
                  </div>
                  <div className="flex items-center">
                    <Image className="text-green-500 h-5 w-5 mr-2" />
                    <div className="h-4 bg-gray-200 w-16 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Posts */}
              {[1,2].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 mr-2"></div>
                    <div>
                      <div className="h-5 bg-gray-300 w-32 rounded mb-1"></div>
                      <div className="h-4 bg-gray-200 w-24 rounded"></div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="h-4 bg-gray-300 w-full rounded mb-1"></div>
                    <div className="h-4 bg-gray-300 w-4/5 rounded"></div>
                  </div>
                  <div className="aspect-video bg-gray-100 rounded-lg mb-3"></div>
                  <div className="flex justify-between pt-2 border-t">
                    <div className="flex items-center">
                      <Heart className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="h-4 bg-gray-200 w-8 rounded"></div>
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="h-4 bg-gray-200 w-8 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right sidebar */}
            <div className="w-[250px] bg-white p-2 border-l border-gray-300">
              <div className="p-2">
                <div className="h-5 bg-gray-300 w-32 rounded mb-3"></div>
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 mr-2"></div>
                    <div className="h-5 bg-gray-200 w-24 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 'instagram':
      return (
        <div className="w-full h-full" style={{ opacity }}>
          {/* Instagram Header */}
          <div className="h-14 bg-white border-b border-gray-200 w-full flex items-center justify-between px-6">
            <div className="w-28 h-8 bg-gray-800"></div>
            <div className="flex space-x-4">
              <div className="w-6 h-6 rounded-full bg-gray-200"></div>
              <div className="w-6 h-6 rounded-full bg-gray-200"></div>
            </div>
          </div>

          {/* Stories */}
          <div className="h-24 bg-white border-b border-gray-200 flex items-center px-4 overflow-x-auto">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="flex flex-col items-center mr-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-white p-0.5">
                    <div className="w-full h-full rounded-full bg-gray-200"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 w-12 rounded mt-1"></div>
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 bg-gray-50 p-4 overflow-auto">
            {[1,2].map(i => (
              <div key={i} className="bg-white border border-gray-200 rounded-sm mb-6">
                <div className="p-3 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 mr-2"></div>
                  <div className="h-4 bg-gray-300 w-32 rounded"></div>
                </div>
                <div className="aspect-square bg-gray-100"></div>
                <div className="p-3">
                  <div className="flex justify-between mb-2">
                    <div className="flex space-x-3">
                      <Heart className="h-6 w-6 text-gray-800" />
                      <MessageCircle className="h-6 w-6 text-gray-800" />
                      <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="h-4 bg-gray-300 w-32 rounded mb-1"></div>
                  <div className="flex mb-1">
                    <div className="h-4 bg-gray-300 w-24 rounded mr-2"></div>
                    <div className="h-4 bg-gray-200 w-48 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'gmail':
      return (
        <div className="w-full h-full" style={{ opacity }}>
          {/* Gmail Header */}
          <div className="h-16 bg-white border-b border-gray-200 w-full flex items-center px-4">
            <Menu className="h-6 w-6 text-gray-600 mr-6" />
            <div className="flex items-center mr-6">
              <Mail className="h-8 w-8 text-red-500 mr-2" />
              <div className="h-6 bg-gray-800 w-16 rounded"></div>
            </div>
            <div className="flex-1 h-12 bg-blue-50 rounded-lg flex items-center px-4">
              <Search className="h-5 w-5 text-gray-500 mr-3" />
              <div className="h-4 bg-gray-200 w-1/2 rounded"></div>
            </div>
            <div className="ml-4">
              <div className="w-8 h-8 rounded-full bg-gray-200"></div>
            </div>
          </div>

          <div className="flex h-[calc(100%-64px)]">
            {/* Left sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 p-4">
              <div className="bg-blue-100 rounded-full py-3 px-6 flex items-center mb-6">
                <div className="h-5 bg-blue-200 w-24 rounded"></div>
              </div>

              {['Inbox', 'Starred', 'Sent', 'Drafts', 'Trash'].map((item, i) => (
                <div key={i} className={`flex items-center rounded-r-full py-2 px-6 mb-1 ${i === 0 ? 'bg-red-50' : ''}`}>
                  <div className="w-5 h-5 rounded-full bg-gray-300 mr-3"></div>
                  <div className="h-4 bg-gray-300 w-24 rounded"></div>
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 bg-white">
              <div className="h-12 border-b border-gray-200 flex items-center px-4">
                <div className="flex items-center space-x-6">
                  <div className="w-5 h-5 rounded bg-gray-200"></div>
                  <div className="w-5 h-5 rounded bg-gray-200"></div>
                  <div className="w-5 h-5 rounded bg-gray-200"></div>
                </div>
              </div>

              {[1,2,3,4,5].map(i => (
                <div key={i} className={`border-b border-gray-200 flex items-center px-4 py-2 ${i === 2 ? 'bg-blue-50' : ''}`}>
                  <div className="w-5 h-5 rounded border border-gray-300 mr-4"></div>
                  <div className="w-5 h-5 rounded-full bg-gray-200 mr-4"></div>
                  <div className="flex-1 flex items-center">
                    <div className="w-40">
                      <div className="h-4 bg-gray-300 w-32 rounded"></div>
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 w-64 rounded"></div>
                    </div>
                    <div className="w-24 text-right">
                      <div className="h-4 bg-gray-200 w-16 rounded ml-auto"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'youtube':
      return (
        <div className="w-full h-full" style={{ opacity }}>
          {/* YouTube Header */}
          <div className="h-14 bg-white border-b border-gray-200 w-full flex items-center px-4">
            <Menu className="h-6 w-6 text-gray-700 mr-4" />
            <div className="flex items-center mr-4">
              <Youtube className="h-6 w-6 text-red-600 mr-1" />
              <div className="h-5 bg-gray-800 w-16 rounded"></div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="w-1/2 flex">
                <div className="flex-1 h-10 border border-gray-200 rounded-l-full flex items-center px-4">
                  <div className="h-4 bg-gray-200 w-full rounded"></div>
                </div>
                <div className="h-10 w-16 bg-gray-100 flex items-center justify-center rounded-r-full border-t border-r border-b border-gray-200">
                  <Search className="h-5 w-5 text-gray-700" />
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="w-8 h-8 rounded-full bg-gray-200"></div>
              <div className="w-8 h-8 rounded-full bg-gray-200"></div>
            </div>
          </div>

          <div className="flex h-[calc(100%-56px)]">
            {/* Left sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 py-3">
              {['Home', 'Explore', 'Subscriptions', 'Library'].map((item, i) => (
                <div key={i} className={`flex items-center py-2 px-6 ${i === 0 ? 'bg-gray-100' : ''}`}>
                  <div className="w-6 h-6 rounded bg-gray-300 mr-4"></div>
                  <div className="h-4 bg-gray-300 w-24 rounded"></div>
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 bg-gray-50 p-6">
              <div className="mb-4 flex space-x-3">
                {['All', 'Music', 'Gaming', 'News'].map((item, i) => (
                  <div key={i} className={`px-3 py-1 rounded-full ${i === 0 ? 'bg-black text-white' : 'bg-gray-100'}`}>
                    <div className={`h-4 ${i === 0 ? 'bg-gray-600' : 'bg-gray-300'} w-16 rounded`}></div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="mb-4">
                    <div className="aspect-video bg-gray-200 rounded-lg mb-2"></div>
                    <div className="flex">
                      <div className="w-9 h-9 rounded-full bg-gray-300 mr-2"></div>
                      <div>
                        <div className="h-4 bg-gray-800 w-full rounded mb-1"></div>
                        <div className="h-3 bg-gray-400 w-4/5 rounded mb-1"></div>
                        <div className="h-3 bg-gray-400 w-2/3 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 'canva':
      return (
        <div className="w-full h-full" style={{ opacity }}>
          {/* Canva Header */}
          <div className="h-14 bg-white border-b border-gray-200 w-full flex items-center px-4">
            <div className="flex items-center">
              <PenTool className="h-8 w-8 text-purple-600 mr-2" />
              <div className="h-6 font-bold text-2xl text-purple-600">Canva</div>
            </div>
            <div className="flex-1 mx-4">
              <div className="max-w-md mx-auto relative">
                <div className="h-10 bg-gray-100 rounded-lg w-full flex items-center px-4">
                  <Search className="h-4 w-4 text-gray-500 mr-2" />
                  <div className="h-4 bg-gray-200 w-2/3 rounded"></div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-200"></div>
            </div>
          </div>

          {/* Canva Content */}
          <div className="flex h-[calc(100%-56px)]">
            {/* Left sidebar */}
            <div className="w-16 bg-white border-r border-gray-200 p-2 flex flex-col items-center">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="w-10 h-10 rounded-lg bg-gray-100 mb-3 flex items-center justify-center">
                  <div className="w-5 h-5 rounded bg-gray-300"></div>
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 bg-gray-50 p-6">
              <div className="mb-6">
                <div className="h-8 bg-gray-200 w-64 rounded-md mb-4"></div>
                <div className="flex flex-wrap gap-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-40 h-40 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center">
                      <div className="w-20 h-20 rounded bg-purple-100"></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="h-8 bg-gray-200 w-40 rounded-md mb-4"></div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="border-b border-gray-200 pb-3 mb-3">
                    <div className="grid grid-cols-5 gap-4">
                      <div className="h-4 bg-gray-300 w-full rounded"></div>
                      <div className="h-4 bg-gray-300 w-full rounded"></div>
                      <div className="h-4 bg-gray-300 w-full rounded"></div>
                      <div className="h-4 bg-gray-300 w-full rounded"></div>
                      <div className="h-4 bg-gray-300 w-full rounded"></div>
                    </div>
                  </div>

                  {[1,2,3].map(i => (
                    <div key={i} className="py-3 border-b border-gray-200 last:border-0">
                      <div className="grid grid-cols-5 gap-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded bg-gray-200 mr-2"></div>
                          <div className="h-4 bg-gray-300 w-16 rounded"></div>
                        </div>
                        <div className="h-4 bg-gray-300 w-full rounded"></div>
                        <div className="h-4 bg-gray-300 w-full rounded"></div>
                        <div className="h-4 bg-gray-300 w-full rounded"></div>
                        <div className="h-4 bg-gray-300 w-full rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'chatgpt':
      return (
        <div className="w-full h-full" style={{ opacity }}>
          {/* ChatGPT Header */}
          <div className="h-14 bg-[#10A37F] w-full flex items-center px-4">
            <Bot className="text-white h-8 w-8" />
            <div className="flex-1 mx-4 max-w-md">
              <div className="h-10 bg-white border border-[#008373] rounded-md flex items-center px-4 shadow-sm">
                <Search className="h-4 w-4 text-[#008373] mr-2" />
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                <div className="w-5 h-5 rounded bg-gray-200 ml-2"></div>
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="w-8 h-8 rounded-full bg-white/30"></div>
              <div className="w-8 h-8 rounded-full bg-white/30"></div>
            </div>
          </div>

          <div className="flex h-[calc(100%-56px)]">
            {/* Left sidebar */}
            <div className="w-64 bg-white p-2 border-r border-gray-300">
              <div className="flex items-center p-2 rounded-lg hover:bg-gray-100 mb-2">
                <div className="w-6 h-6 rounded-full bg-green-500 mr-3 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="h-4 bg-gray-200 w-24 rounded"></div>
              </div>
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-center p-2 rounded-lg hover:bg-gray-100 mb-1">
                  <div className="w-4 h-4 rounded-full bg-gray-300 mr-3"></div>
                  <div className="h-3 bg-gray-300 w-32 rounded"></div>
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 bg-gray-50 p-4 overflow-auto flex flex-col space-y-6">
              {[1,2,3].map(i => (
                <div key={i} className={`w-full flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-2xl p-4 rounded-lg shadow-sm bg-white`}>
                    <div className="flex items-center mb-2">
                      <div className={`w-6 h-6 rounded-full ${i % 2 === 0 ? 'bg-green-500' : 'bg-gray-300'} mr-2`}></div>
                      <div className="h-4 bg-gray-300 w-24 rounded"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 bg-gray-300 w-full rounded"></div>
                      <div className="h-3 bg-gray-300 w-5/6 rounded"></div>
                      <div className="h-3 bg-gray-300 w-full rounded"></div>
                      <div className="h-3 bg-gray-300 w-4/6 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right sidebar */}
            <div className="w-64 bg-white p-2 border-l border-gray-300">
              <div className="h-5 bg-gray-300 w-32 rounded mb-3"></div>
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 mr-2"></div>
                  <div className="h-5 bg-gray-200 w-24 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'shopify':
      return (
        <div className="w-full h-full" style={{ opacity }}>
          {/* Shopify Header */}
          <div className="h-16 bg-[#004c3f] w-full flex items-center px-6 text-white">
            <div className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-white mr-2" />
              <div className="h-8 font-bold text-2xl">Shopify</div>
            </div>
            <div className="flex-1 mx-8">
              <div className="max-w-md mx-auto relative">
                <div className="h-10 bg-[#003328] rounded-md w-full flex items-center px-4">
                  <Search className="h-4 w-4 text-gray-400 mr-2" />
                  <div className="h-4 bg-[#002b22] w-2/3 rounded"></div>
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="w-8 h-8 rounded-full bg-[#003328]"></div>
              <div className="w-8 h-8 rounded-full bg-[#003328]"></div>
            </div>
          </div>

          <div className="flex h-[calc(100%-64px)]">
            {/* Left sidebar */}
            <div className="w-64 bg-[#f6f6f7] border-r border-gray-200 p-4">
              <div className="mb-6">
                <div className="h-10 bg-white rounded-md shadow-sm border border-gray-200 flex items-center px-4">
                  <div className="w-6 h-6 rounded bg-green-100 mr-3 flex items-center justify-center">
                    <ShoppingBag className="h-3 w-3 text-green-700" />
                  </div>
                  <div className="h-4 bg-gray-200 w-32 rounded"></div>
                </div>
              </div>

              {['Home', 'Orders', 'Products', 'Customers', 'Analytics', 'Marketing'].map((item, i) => (
                <div key={i} className={`flex items-center py-2 px-3 rounded mb-1 ${i === 0 ? 'bg-[#f1f1f1]' : ''}`}>
                  <div className="w-5 h-5 rounded bg-gray-300 mr-3"></div>
                  <div className="h-4 bg-gray-300 w-24 rounded"></div>
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 bg-white p-6">
              <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="h-8 bg-gray-200 w-48 rounded-md"></div>
                  <div className="bg-[#004c3f] text-white rounded-md px-4 py-2 flex items-center">
                    <div className="h-4 bg-[#003328] w-24 rounded"></div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="bg-[#f6f6f7] p-4 rounded-lg">
                      <div className="h-5 bg-gray-300 w-32 rounded mb-2"></div>
                      <div className="h-8 bg-gray-400 w-24 rounded mb-1"></div>
                      <div className="h-4 bg-gray-300 w-16 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="h-6 bg-gray-200 w-48 rounded-md mb-4"></div>
                <div className="bg-[#f6f6f7] rounded-lg p-4">
                  <div className="border-b border-gray-200 pb-3 mb-3">
                    <div className="grid grid-cols-5 gap-4">
                      <div className="h-4 bg-gray-300 w-full rounded"></div>
                      <div className="h-4 bg-gray-300 w-full rounded"></div>
                      <div className="h-4 bg-gray-300 w-full rounded"></div>
                      <div className="h-4 bg-gray-300 w-full rounded"></div>
                      <div className="h-4 bg-gray-300 w-full rounded"></div>
                    </div>
                  </div>

                  {[1,2,3].map(i => (
                    <div key={i} className="py-3 border-b border-gray-200 last:border-0">
                      <div className="grid grid-cols-5 gap-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded bg-gray-200 mr-2"></div>
                          <div className="h-4 bg-gray-300 w-16 rounded"></div>
                        </div>
                        <div className="h-4 bg-gray-300 w-full rounded"></div>
                        <div className="h-4 bg-gray-300 w-full rounded"></div>
                        <div className="h-4 bg-gray-300 w-full rounded"></div>
                        <div className="h-4 bg-gray-300 w-full rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'linkedin':
      return (
        <div className="w-full h-full" style={{ opacity }}>
          {/* LinkedIn Header */}
          <div className="h-14 bg-white border-b border-gray-200 w-full flex items-center px-4">
            <div className="flex items-center">
              <Linkedin className="h-8 w-8 text-blue-700 mr-2" />
              <div className="h-10 bg-gray-100 rounded-md flex items-center px-3 w-64">
                <Search className="h-4 w-4 text-gray-500 mr-2" />
                <div className="h-4 bg-gray-200 w-32 rounded"></div>
              </div>
            </div>
            <div className="flex-1"></div>
            <div className="flex space-x-4">
              <div className="w-8 h-8 rounded-full bg-gray-200"></div>
              <div className="w-8 h-8 rounded-full bg-gray-200"></div>
              <div className="w-8 h-8 rounded-full bg-gray-200"></div>
            </div>
          </div>

          <div className="flex h-[calc(100%-56px)]">
            {/* Left sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 p-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
                <div className="flex items-center mb-2">
                  <div className="w-16 h-16 rounded-full bg-gray-200 mr-3"></div>
                  <div>
                    <div className="h-5 bg-gray-300 w-32 rounded mb-1"></div>
                    <div className="h-4 bg-gray-200 w-24 rounded"></div>
                  </div>
                </div>
                <div className="border-t border-b border-gray-200 py-2 my-2">
                  <div className="flex justify-between mb-1">
                    <div className="h-4 bg-gray-200 w-24 rounded"></div>
                    <div className="h-4 bg-gray-200 w-8 rounded"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 w-20 rounded"></div>
                    <div className="h-4 bg-gray-200 w-8 rounded"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 w-full rounded mt-2"></div>
              </div>

              <div className="mb-4">
                <div className="h-5 bg-gray-300 w-32 rounded mb-2"></div>
                {['My Network', 'Jobs', 'Events', 'Groups'].map((_, i) => (
                  <div key={i} className="flex items-center py-2">
                    <div className="w-5 h-5 rounded bg-gray-300 mr-3"></div>
                    <div className="h-4 bg-gray-200 w-32 rounded"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main content - Feed */}
            <div className="flex-1 bg-gray-100 p-4 overflow-auto">
              {/* Create post */}
              <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
                <div className="flex">
                  <div className="w-10 h-10 rounded-full bg-gray-200 mr-2"></div>
                  <div className="flex-1 h-10 bg-gray-100 rounded-full flex items-center px-4">
                    <div className="h-4 bg-gray-200 w-48 rounded"></div>
                  </div>
                </div>
                <div className="flex justify-between mt-3 pt-2 border-t border-gray-200">
                  <div className="flex items-center">
                    <Image className="text-blue-600 h-5 w-5 mr-1" />
                    <div className="h-4 bg-gray-200 w-12 rounded"></div>
                  </div>
                  <div className="flex items-center">
                    <Video className="text-green-600 h-5 w-5 mr-1" />
                    <div className="h-4 bg-gray-200 w-12 rounded"></div>
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="text-orange-600 h-5 w-5 mr-1" />
                    <div className="h-4 bg-gray-200 w-12 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Posts */}
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-3 mb-4">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 mr-2"></div>
                    <div>
                      <div className="h-5 bg-gray-300 w-40 rounded mb-1"></div>
                      <div className="h-4 bg-gray-200 w-32 rounded"></div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="h-4 bg-gray-300 w-full rounded mb-1"></div>
                    <div className="h-4 bg-gray-300 w-4/5 rounded mb-1"></div>
                    <div className="h-4 bg-gray-300 w-3/4 rounded"></div>
                  </div>
                  <div className="aspect-video bg-gray-200 rounded-lg mb-3"></div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <div className="flex items-center">
                      <Heart className="h-5 w-5 text-gray-400 mr-1" />
                      <div className="h-4 bg-gray-200 w-6 rounded"></div>
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="h-5 w-5 text-gray-400 mr-1" />
                      <div className="h-4 bg-gray-200 w-6 rounded"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-5 w-5 rounded bg-gray-300 mr-1"></div>
                      <div className="h-4 bg-gray-200 w-6 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right sidebar - News */}
            <div className="w-[300px] bg-white border-l border-gray-200 p-4">
              <div className="mb-4">
                <div className="h-6 bg-gray-300 w-40 rounded mb-3"></div>
                {[1, 2, 3].map(i => (
                  <div key={i} className="mb-3">
                    <div className="h-4 bg-gray-300 w-full rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 w-24 rounded"></div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="h-6 bg-gray-300 w-48 rounded mb-3"></div>
                <div className="bg-[#f6f6f7] rounded-lg p-4">
                  <div className="border-b border-gray-200 pb-3 mb-3">
                    <div className="grid grid-cols-5 gap-4">
                      <div className="h-4 bg-gray-300 w-full rounded"></div>
                      <div className="h-4 bg-gray-300 w-full rounded"></div>
                      <div className="h-4 bg-gray-300 w-full rounded"></div>
                      <div className="h-4 bg-gray-300 w-full rounded"></div>
                      <div className="h-4 bg-gray-300 w-full rounded"></div>
                    </div>
                  </div>

                  {[1,2,3].map(i => (
                    <div key={i} className="py-3 border-b border-gray-200 last:border-0">
                      <div className="grid grid-cols-5 gap-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded bg-gray-200 mr-2"></div>
                          <div className="h-4 bg-gray-300 w-16 rounded"></div>
                        </div>
                        <div className="h-4 bg-gray-300 w-full rounded"></div>
                        <div className="h-4 bg-gray-300 w-full rounded"></div>
                        <div className="h-4 bg-gray-300 w-full rounded"></div>
                        <div className="h-4 bg-gray-300 w-full rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'outlook':
      return (
        <div className="w-full h-full" style={{ opacity }}>
          {/* Outlook Header */}
          <div className="h-14 bg-white border-b border-gray-200 w-full flex items-center px-4">
            <div className="flex items-center">
              <MailCheck className="h-8 w-8 text-blue-500 mr-2" />
              <div className="h-6 font-bold text-lg text-blue-500">Outlook</div>
            </div>
            <div className="flex-1 mx-8">
              <div className="h-10 bg-gray-100 rounded-lg w-full flex items-center px-4">
                <Search className="h-4 w-4 text-gray-500 mr-2" />
                <div className="h-4 bg-gray-200 w-2/3 rounded"></div>
              </div>
            </div>
            <div className="flex space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-200"></div>
            </div>
          </div>

          <div className="flex h-[calc(100%-56px)]">
            {/* Left sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 p-3">
              <div className="bg-blue-500 text-white rounded-md py-2 px-4 flex items-center justify-center mb-4">
                <div className="h-5 bg-blue-600/30 w-24 rounded"></div>
              </div>

              {/* Folders */}
              <div className="mb-4">
                {['Inbox', 'Drafts', 'Sent Items', 'Deleted Items', 'Archive', 'Junk Email'].map((folder, i) => (
                  <div key={i} className={`flex items-center py-2 px-3 rounded ${i === 0 ? 'bg-blue-50' : ''}`}>
                    <div className="w-5 h-5 rounded-full bg-gray-300 mr-3"></div>
                    <div className="h-4 bg-gray-300 w-24 rounded"></div>
                  </div>
                ))}
              </div>

              {/* Categories */}
              <div className="mb-4">
                <div className="h-5 bg-gray-300 w-24 rounded mb-2"></div>
                {['Focused', 'Other', 'Social', 'Promotions'].map((_, i) => (
                  <div key={i} className="flex items-center py-1 px-3">
                    <div className="w-4 h-4 rounded bg-gray-300 mr-3"></div>
                    <div className="h-4 bg-gray-200 w-20 rounded"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Email list */}
            <div className="w-1/3 bg-white border-r border-gray-200">
              <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                <div className="h-5 bg-gray-300 w-24 rounded"></div>
                <div className="flex space-x-2">
                  <div className="w-6 h-6 rounded bg-gray-200"></div>
                  <div className="w-6 h-6 rounded bg-gray-200"></div>
                </div>
              </div>

              {/* Email items */}
              {[1,2,3,4,5].map(i => (
                <div key={i} className={`p-3 border-b border-gray-200 ${i === 2 ? 'bg-blue-50' : ''}`}>
                  <div className="flex mb-1">
                    <div className="w-5 h-5 rounded-full bg-gray-200 mr-2"></div>
                    <div className="h-5 bg-gray-300 w-40 rounded"></div>
                    <div className="ml-auto h-4 bg-gray-200 w-16 rounded"></div>
                  </div>
                  <div className="h-4 bg-gray-300 w-full rounded mb-1"></div>
                  <div className="h-4 bg-gray-200 w-3/4 rounded"></div>
                </div>
              ))}
            </div>

            {/* Email content */}
            <div className="flex-1 bg-gray-50 p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-6 bg-gray-300 w-64 rounded"></div>
                  <div className="flex space-x-2">
                    <div className="w-8 h-8 rounded bg-gray-200"></div>
                    <div className="w-8 h-8 rounded bg-gray-200"></div>
                  </div>
                </div>

                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                  <div>
                    <div className="h-5 bg-gray-300 w-48 rounded mb-1"></div>
                    <div className="h-4 bg-gray-200 w-32 rounded"></div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="h-4 bg-gray-300 w-full rounded mb-3"></div>
                  <div className="h-4 bg-gray-300 w-4/5 rounded mb-3"></div>
                  <div className="h-4 bg-gray-300 w-full rounded mb-3"></div>
                  <div className="h-4 bg-gray-300 w-3/4 rounded mb-3"></div>
                  <div className="h-4 bg-gray-300 w-full rounded mb-3"></div>
                  <div className="h-4 bg-gray-300 w-2/3 rounded mb-3"></div>
                  <div className="h-20 bg-gray-100 rounded mb-3 flex items-center justify-center">
                    <div className="h-8 bg-gray-200 w-20 rounded"></div>
                  </div>
                  <div className="h-4 bg-gray-300 w-full rounded mb-3"></div>
                  <div className="h-4 bg-gray-300 w-1/2 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'wordpress':
      return (
        <div className="w-full h-full" style={{ opacity }}>
          {/* WordPress Header */}
          <div className="h-14 bg-[#21759b] w-full flex items-center px-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <WordpressIcon className="text-[#21759b] h-6 w-6" />
            </div>
            <div className="flex-1 mx-4 h-10 bg-gray-100 rounded-full"></div>
            <div className="flex space-x-2">
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
            </div>
          </div>

          {/* WordPress Content */}
          <div className="flex h-[calc(100%-56px)]">
            {/* Left sidebar */}
            <div className="w-[250px] bg-white p-2 border-r border-gray-300">
              <div className="flex items-center p-2 rounded-lg bg-blue-50 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 mr-3"></div>
                <div className="h-5 bg-blue-100 w-32 rounded"></div>
              </div>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center p-2 rounded-lg hover:bg-gray-100 mb-1">
                  <div className="w-8 h-8 rounded-full bg-gray-200 mr-3"></div>
                  <div className="h-5 bg-gray-200 w-32 rounded"></div>
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 bg-[#F0F2F5] p-4 overflow-auto">
              {/* Create post */}
              <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 mr-2"></div>
                  <div className="flex-1 h-10 bg-gray-100 rounded-full"></div>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <div className="flex items-center">
                    <Video className="text-red-500 h-5 w-5 mr-2" />
                    <div className="h-4 bg-gray-200 w-16 rounded"></div>
                  </div>
                  <div className="flex items-center">
                    <Image className="text-green-500 h-5 w-5 mr-2" />
                    <div className="h-4 bg-gray-200 w-16 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Posts */}
              {[1,2].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 mr-2"></div>
                    <div>
                      <div className="h-5 bg-gray-300 w-32 rounded mb-1"></div>
                      <div className="h-4 bg-gray-200 w-24 rounded"></div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="h-4 bg-gray-300 w-full rounded mb-1"></div>
                    <div className="h-4 bg-gray-300 w-4/5 rounded"></div>
                  </div>
                  <div className="aspect-video bg-gray-100 rounded-lg mb-3"></div>
                  <div className="flex justify-between pt-2 border-t">
                    <div className="flex items-center">
                      <Heart className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="h-4 bg-gray-200 w-8 rounded"></div>
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="h-4 bg-gray-200 w-8 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right sidebar */}
            <div className="w-[250px] bg-white p-2 border-l border-gray-300">
              <div className="p-2">
                <div className="h-5 bg-gray-300 w-32 rounded mb-3"></div>
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 mr-2"></div>
                    <div className="h-5 bg-gray-200 w-24 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="w-full h-full flex items-center justify-center" style={{ opacity }}>
          <div className="text-2xl font-medium text-gray-400">
            {platform.charAt(0).toUpperCase() + platform.slice(1)} Interface
          </div>
        </div>
      );
  }
};

export function SafariDemo() {
  const [activeTab, setActiveTab] = useState(0);
  const [titleClass, setTitleClass] = useState('');

  // Add a shimmer effect to the title every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTitleClass('title-shimmer');
      setTimeout(() => setTitleClass(''), 2000);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative mx-auto max-w-[1200px] transition-all duration-300">
      {/* Safari window */}
      <Safari url={`${socialTabs[activeTab].name.toLowerCase()}.com`} className="w-full dark:opacity-90 transition-opacity duration-300" />

      {/* Tabs row */}
      <div className="absolute top-12 left-0 right-0 flex justify-center gap-1 px-4 overflow-x-auto pb-1 md:overflow-visible">
        <div className="flex space-x-1 md:space-x-2 min-w-min">
          {socialTabs.map(({ name, icon: Icon, color }, index) => (
            <button
              key={name}
              onClick={() => setActiveTab(index)}
              className={`
                inline-flex items-center gap-1 rounded-t-md border border-b-0
                px-2 py-1 text-xs md:text-sm font-medium shadow-inner
                transition-all duration-300 hover:brightness-110 hover:-translate-y-0.5
                transform-gpu dark:text-white min-w-[90px] justify-center
                ${index === activeTab
                  ? `${color} text-white border-transparent`
                  : 'bg-white/90 dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700'}
              `}
            >
              <Icon className={`h-3 w-3 md:h-4 md:w-4 shrink-0 ${index === activeTab ? 'animate-pulse' : ''}`} />
              <span className="hidden xs:inline">{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content with actual simplified UI elements at 20% opacity */}
      <div className="absolute top-28 md:top-24 left-8 right-8 bottom-16 rounded-md overflow-hidden">
        {/* Underlying platform at 20% opacity */}
        <PlatformUI platform={socialTabs[activeTab].platform} opacity={0.2} />

        {/* Hero content overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6 pointer-events-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/10 text-white rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
              <TrendingUp className="w-4 h-4" />
              <span>Analytics Powered Insights - AI-Driven Organization - Task-Focused Workspace</span>
            </div>

            {/* Headline */}
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-black dark:text-white leading-tight font-saira">
              THE&nbsp;
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">#1&nbsp;BOOKMARK&nbsp;APP</span>
              &nbsp;IN&nbsp;THE&nbsp;WORLD
            </h1>

            {/* Subheadline */}
            <p className="mx-auto max-w-xl text-[10px] sm:text-xs leading-relaxed text-black dark:text-white font-bold">
              BOOKMARKAI FUSES DEEP ANALYTICS, AN AI CO-PILOT THAT AUTO-ORGANIZES YOUR LINKS, AND A BUILT-IN TASK WORKSPACE - MAKING IT THE MOST POWERFUL BOOKMARK APP ON THE PLANET.
            </p>

            {/* Stats */}
            <div className="animate-fade-in-up animate-delay-500 flex flex-wrap items-center justify-center gap-4 lg:gap-8 mt-8 text-sm text-gray-400 dark:text-gray-300">
              <div className="flex items-center gap-2 hover:text-green-400 transition-all duration-300 hover:scale-110">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                <span>Early access spots are limited.</span>
              </div>
              <div className="flex items-center gap-2 hover:text-blue-400 transition-all duration-300 hover:scale-110">
                <Globe className="w-4 h-4 text-blue-400" />
                <span>Privacy-first data encryption is used.</span>
              </div>
              <div className="flex items-center gap-2 hover:text-purple-400 transition-all duration-300 hover:scale-110">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>One-minute sign-up.</span>
              </div>
            </div>

            {/* CTA */}
            <form className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <div className="flex-1 relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input type="email" required placeholder="emma.chen@techcorp.com" className="w-full py-2 pl-10 pr-3 rounded-lg bg-white/80 placeholder-gray-500 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">
                JOIN BETA LIST <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Feature bullets */}
            <p className="mt-4 text-xs lg:text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center justify-center gap-4">
              <span className="flex items-center gap-1 hover:text-green-400 transition-colors duration-300">
                <Check className="w-3 h-3 text-green-400" />
                No credit card required.
              </span>
              <span className="flex items-center gap-1 hover:text-blue-400 transition-colors duration-300">
                <Calendar className="w-3 h-3 text-blue-400" />
                Seven-day free trial.
              </span>
              <span className="flex items-center gap-1 hover:text-purple-400 transition-colors duration-300">
                <Users className="w-3 h-3 text-purple-400" />
                Exclusive beta perks.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

