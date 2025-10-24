
"use client"
export const dynamic = 'force-dynamic'

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function TestBookmarkModal() {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Bookmark Modal Avatar Test</h1>
        <p className="mb-4">This public test page opens a demo modal that uses the same Avatar sizing and classes as the bookmark details modal.</p>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="px-4 py-2 bg-blue-600 text-white rounded">Open Demo Modal</button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <Avatar className="h-16 w-16 rounded-none" data-testid="bookmark-modal-avatar" style={{ borderRadius: 0 }}>
                  <AvatarImage src="https://logo.clearbit.com/vercel.com" alt="Demo" />
                  <AvatarFallback className="rounded-none bg-black text-white">D</AvatarFallback>
                </Avatar>
                <span className="text-lg">Demo Bookmark Title</span>
              </DialogTitle>
            </DialogHeader>
            <div className="text-sm text-gray-600">This reproduces the modal avatar container used in the dashboard.</div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

