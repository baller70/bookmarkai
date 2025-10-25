'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AddBookmarkForm } from '@/components/dashboard/AddBookmarkForm';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Plus } from 'lucide-react';

export function AddBookmarkDialog() {
  const [open, setOpen] = useState(false);
  const { addBookmark } = useBookmarks();

  const handleAddBookmark = async (bookmarkData: any) => {
    try {
      await addBookmark(bookmarkData);
      // Close dialog only after successful submission
      setOpen(false);
    } catch (error) {
      // Error is already handled in the hook and form
      // Just re-throw to prevent closing the dialog
      throw error;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Bookmark
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Bookmark</DialogTitle>
        </DialogHeader>
        <AddBookmarkForm 
          onAddBookmark={handleAddBookmark}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
