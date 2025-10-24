
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface AddBookmarkFormProps {
  onAddBookmark: (bookmark: any) => void;
  loading: boolean;
}

export const AddBookmarkForm: React.FC<AddBookmarkFormProps> = ({ onAddBookmark, loading }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [enableAI, setEnableAI] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddBookmark({
      title,
      url,
      description,
      category,
      tags,
      notes,
      enableAI,
    });
    // Reset form
    setTitle('');
    setUrl('');
    setDescription('');
    setCategory('');
    setTags([]);
    setNotes('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Enter a title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Enter a brief description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="category">Category (Optional)</Label>
        <Input
          id="category"
          placeholder="e.g., Tech, News, Health"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          placeholder="e.g., react, nextjs, tailwind"
          value={tags.join(', ')}
          onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()))}
        />
      </div>
       <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add personal notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="enableAI"
          checked={enableAI}
          onCheckedChange={(checked) => setEnableAI(!!checked)}
        />
        <Label htmlFor="enableAI">Enable AI Analysis</Label>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add Bookmark'}
      </Button>
    </form>
  );
};
