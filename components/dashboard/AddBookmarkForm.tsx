import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

interface AddBookmarkFormProps {
  onAddBookmark: (bookmark: any) => Promise<void>;
  onClose?: () => void;
}

export const AddBookmarkForm: React.FC<AddBookmarkFormProps> = ({ onAddBookmark, onClose }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [enableAI, setEnableAI] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    // Validate required fields
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      toast.error('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setIsSubmitting(true);

    try {
      await onAddBookmark({
        title: title.trim(),
        url: url.trim(),
        description: description.trim(),
        category: category.trim(),
        tags,
        notes: notes.trim(),
        enableAI,
      });

      // Reset form only after successful submission
      setTitle('');
      setUrl('');
      setDescription('');
      setCategory('');
      setTags([]);
      setNotes('');

      toast.success('Bookmark added successfully!');

      // Close modal if onClose is provided
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error('Error adding bookmark:', error);
      toast.error(error.message || 'Failed to add bookmark. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Enter a title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label htmlFor="url">URL *</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Enter a brief description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label htmlFor="category">Category (Optional)</Label>
        <Input
          id="category"
          placeholder="e.g., Tech, News, Health"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          placeholder="e.g., react, nextjs, tailwind"
          value={tags.join(', ')}
          onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
          disabled={isSubmitting}
        />
      </div>
       <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add personal notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="enableAI"
          checked={enableAI}
          onCheckedChange={(checked) => setEnableAI(!!checked)}
          disabled={isSubmitting}
        />
        <Label htmlFor="enableAI">Enable AI Analysis</Label>
      </div>
      <div className="flex gap-2 justify-end">
        {onClose && (
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </>
          ) : (
            'Add Bookmark'
          )}
        </Button>
      </div>
    </form>
  );
};
