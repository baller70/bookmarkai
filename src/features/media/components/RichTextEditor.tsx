'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  Image, 
  Video, 
  Music, 
  FileText, 
  Code, 
  Quote, 
  Minus,
  List,
  Hash,
  Type,
  Table,
  ExternalLink,
  Plus
} from 'lucide-react';
import { DocumentContent, ContentBlockType, SlashCommand } from '../types';

interface RichTextEditorProps {
  content: DocumentContent[];
  onChange: (content: DocumentContent[]) => void;
  onMediaEmbed?: (type: ContentBlockType) => void;
  mediaFiles?: any[];
}

export function RichTextEditor({ content, onChange, onMediaEmbed, mediaFiles = [] }: RichTextEditorProps) {
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 });
  const [slashQuery, setSlashQuery] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const slashCommands: SlashCommand[] = [
    {
      id: 'heading1',
      label: 'Heading 1',
      description: 'Big section heading',
      icon: 'H1',
      action: () => insertBlock('heading', { text: '', level: 1 }),
      keywords: ['heading', 'h1', 'title']
    },
    {
      id: 'heading2',
      label: 'Heading 2',
      description: 'Medium section heading',
      icon: 'H2',
      action: () => insertBlock('heading', { text: '', level: 2 }),
      keywords: ['heading', 'h2', 'subtitle']
    },
    {
      id: 'heading3',
      label: 'Heading 3',
      description: 'Small section heading',
      icon: 'H3',
      action: () => insertBlock('heading', { text: '', level: 3 }),
      keywords: ['heading', 'h3']
    },
    {
      id: 'paragraph',
      label: 'Text',
      description: 'Just start writing with plain text',
      icon: 'T',
      action: () => insertBlock('paragraph', { text: '' }),
      keywords: ['text', 'paragraph', 'p']
    },
    {
      id: 'image',
      label: 'Image',
      description: 'Upload or embed an image',
      icon: 'IMG',
      action: () => {
        insertBlock('image', { url: '', alt: '', caption: '' });
        onMediaEmbed?.('image');
      },
      keywords: ['image', 'picture', 'photo', 'img']
    },
    {
      id: 'video',
      label: 'Video',
      description: 'Upload or embed a video',
      icon: 'VID',
      action: () => {
        insertBlock('video', { url: '', title: '', thumbnail: '' });
        onMediaEmbed?.('video');
      },
      keywords: ['video', 'movie', 'clip']
    },
    {
      id: 'audio',
      label: 'Audio',
      description: 'Upload or embed audio',
      icon: 'AUD',
      action: () => {
        insertBlock('audio', { url: '', title: '', duration: 0 });
        onMediaEmbed?.('audio');
      },
      keywords: ['audio', 'music', 'sound', 'podcast']
    },
    {
      id: 'file',
      label: 'File',
      description: 'Upload or attach a file',
      icon: 'FILE',
      action: () => {
        insertBlock('file', { url: '', name: '', size: 0 });
        onMediaEmbed?.('file');
      },
      keywords: ['file', 'attachment', 'document']
    },
    {
      id: 'code',
      label: 'Code',
      description: 'Capture a code snippet',
      icon: 'CODE',
      action: () => insertBlock('code', { code: '', language: 'javascript' }),
      keywords: ['code', 'snippet', 'programming']
    },
    {
      id: 'quote',
      label: 'Quote',
      description: 'Capture a quote',
      icon: 'QUOTE',
      action: () => insertBlock('quote', { text: '', author: '' }),
      keywords: ['quote', 'blockquote', 'citation']
    },
    {
      id: 'divider',
      label: 'Divider',
      description: 'Visually divide blocks',
      icon: 'DIV',
      action: () => insertBlock('divider', {}),
      keywords: ['divider', 'separator', 'line', 'hr']
    },
    {
      id: 'list',
      label: 'Bulleted List',
      description: 'Create a simple bulleted list',
      icon: 'LIST',
      action: () => insertBlock('list', { type: 'bulleted', items: [''] }),
      keywords: ['list', 'bullet', 'ul']
    },
    {
      id: 'table',
      label: 'Table',
      description: 'Create a table',
      icon: 'TABLE',
      action: () => insertBlock('table', { 
        headers: ['Column 1', 'Column 2'], 
        rows: [['', '']] 
      }),
      keywords: ['table', 'grid', 'data']
    },
    {
      id: 'embed',
      label: 'Embed',
      description: 'Embed external content',
      icon: 'EMBED',
      action: () => insertBlock('embed', { url: '', title: '', description: '' }),
      keywords: ['embed', 'iframe', 'external']
    }
  ];

  // Add media files as additional commands
  const mediaCommands: SlashCommand[] = mediaFiles.map((file: any) => ({
    id: `media-${file.id}`,
    label: file.name,
    description: `Insert ${file.type}: ${file.name}`,
    icon: file.type === 'image' ? 'IMG' : file.type === 'video' ? 'VID' : file.type === 'audio' ? 'AUD' : 'FILE',
    action: () => insertBlock(file.type as ContentBlockType, { 
      url: file.url, 
      name: file.name,
      mediaId: file.id,
      alt: file.description || file.name,
      caption: file.description || ''
    }),
    keywords: [file.name, file.type, ...file.tags]
  }));

  const allCommands = [...slashCommands, ...mediaCommands];

  const filteredCommands = allCommands.filter(command =>
    command.label.toLowerCase().includes(slashQuery.toLowerCase()) ||
    command.keywords.some(keyword => keyword.includes(slashQuery.toLowerCase()))
  );

  const insertBlock = (type: ContentBlockType, data: any) => {
    const newBlock: DocumentContent = {
      id: `block-${Date.now()}`,
      type,
      data,
      order: content.length
    };

    onChange([...content, newBlock]);
    setShowSlashMenu(false);
    setSlashQuery('');
  };

  const updateBlock = (blockId: string, data: any) => {
    const updatedContent = content.map(block =>
      block.id === blockId ? { ...block, data: { ...block.data, ...data } } : block
    );
    onChange(updatedContent);
  };

  const deleteBlock = (blockId: string) => {
    const updatedContent = content.filter(block => block.id !== blockId);
    onChange(updatedContent);
  };

  const handleKeyDown = (event: React.KeyboardEvent, blockId: string) => {
    if (event.key === '/') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSlashMenuPosition({ x: rect.left, y: rect.bottom + 5 });
        setShowSlashMenu(true);
        setSlashQuery('');
      }
    } else if (event.key === 'Escape') {
      setShowSlashMenu(false);
      setSlashQuery('');
    } else if (event.key === 'Backspace') {
      const block = content.find(b => b.id === blockId);
      if (block && !block.data.text && content.length > 1) {
        deleteBlock(blockId);
      }
    }
  };

  const renderBlock = (block: DocumentContent) => {
    switch (block.type) {
      case 'heading':
        const HeadingTag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag 
            className={`font-bold mb-2 ${
              block.data.level === 1 ? 'text-3xl' : 
              block.data.level === 2 ? 'text-2xl' : 'text-xl'
            }`}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => updateBlock(block.id, { text: e.currentTarget.textContent })}
            onKeyDown={(e) => handleKeyDown(e, block.id)}
          >
            {block.data.text || 'Heading'}
          </HeadingTag>
        );

      case 'paragraph':
        return (
          <p 
            className="mb-2 min-h-[1.5rem] focus:outline-none cursor-text border border-transparent hover:border-gray-200 rounded px-1 py-1"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => updateBlock(block.id, { text: e.currentTarget.textContent })}
            onKeyDown={(e) => handleKeyDown(e, block.id)}
            onInput={(e) => updateBlock(block.id, { text: e.currentTarget.textContent })}
            data-placeholder={!block.data.text ? "Type '/' for commands or start writing..." : ""}
            style={{
              position: 'relative'
            }}
          >
            {block.data.text}
          </p>
        );

      case 'image':
        return (
          <div className="mb-4">
            {block.data.url ? (
              <div className="relative">
                <img 
                  src={block.data.url} 
                  alt={block.data.alt} 
                  className="max-w-full h-auto rounded-lg"
                />
                {block.data.caption && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    {block.data.caption}
                  </p>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Image className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Click to upload an image</p>
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="mb-4">
            {block.data.url ? (
              <div className="relative">
                <video 
                  src={block.data.url} 
                  controls 
                  className="max-w-full h-auto rounded-lg"
                  poster={block.data.thumbnail}
                />
                {block.data.title && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    {block.data.title}
                  </p>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Click to upload a video</p>
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="mb-4">
            {block.data.url ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <audio src={block.data.url} controls className="w-full" />
                {block.data.title && (
                  <p className="text-sm text-gray-700 mt-2">{block.data.title}</p>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Music className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Click to upload audio</p>
              </div>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="mb-4">
            {block.data.url ? (
              <div className="bg-gray-50 rounded-lg p-4 flex items-center space-x-3">
                <FileText className="h-8 w-8 text-gray-600" />
                <div className="flex-1">
                  <p className="font-medium">{block.data.name}</p>
                  <p className="text-sm text-gray-500">{block.data.size} bytes</p>
                </div>
                <Button variant="outline" size="sm">
                  Download
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Click to upload a file</p>
              </div>
            )}
          </div>
        );

      case 'code':
        return (
          <div className="mb-4">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <code 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateBlock(block.id, { code: e.currentTarget.textContent })}
                className="focus:outline-none"
              >
                {block.data.code || '// Enter your code here'}
              </code>
            </pre>
          </div>
        );

      case 'quote':
        return (
          <blockquote className="border-l-4 border-gray-300 pl-4 mb-4 italic">
            <p 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateBlock(block.id, { text: e.currentTarget.textContent })}
              className="focus:outline-none"
            >
              {block.data.text || 'Enter your quote here'}
            </p>
            {block.data.author && (
              <cite className="text-sm text-gray-500 mt-2 block">
                — {block.data.author}
              </cite>
            )}
          </blockquote>
        );

      case 'divider':
        return <hr className="my-6 border-gray-300" />;

      case 'list':
        return (
          <ul className="list-disc list-inside mb-4 space-y-1">
            {block.data.items.map((item: string, index: number) => (
              <li key={index}>
                <span 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const newItems = [...block.data.items];
                    newItems[index] = e.currentTarget.textContent || '';
                    updateBlock(block.id, { items: newItems });
                  }}
                  className="focus:outline-none"
                >
                  {item || 'List item'}
                </span>
              </li>
            ))}
          </ul>
        );

      case 'table':
        return (
          <div className="mb-4 overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  {block.data.headers.map((header: string, index: number) => (
                    <th key={index} className="border border-gray-300 px-4 py-2 text-left">
                      <span 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const newHeaders = [...block.data.headers];
                          newHeaders[index] = e.currentTarget.textContent || '';
                          updateBlock(block.id, { headers: newHeaders });
                        }}
                        className="focus:outline-none font-medium"
                      >
                        {header}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.data.rows.map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex}>
                    {row.map((cell: string, cellIndex: number) => (
                      <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                        <span 
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const newRows = [...block.data.rows];
                            newRows[rowIndex][cellIndex] = e.currentTarget.textContent || '';
                            updateBlock(block.id, { rows: newRows });
                          }}
                          className="focus:outline-none"
                        >
                          {cell}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'embed':
        return (
          <div className="mb-4">
            {block.data.url ? (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <iframe 
                  src={block.data.url}
                  className="w-full h-64"
                  title={block.data.title}
                />
                {block.data.title && (
                  <div className="p-3 bg-gray-50 border-t">
                    <p className="font-medium">{block.data.title}</p>
                    {block.data.description && (
                      <p className="text-sm text-gray-500">{block.data.description}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
                             <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                 <ExternalLink className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                 <p className="text-gray-500">Enter a URL to embed content</p>
                <Input 
                  placeholder="https://..."
                  className="mt-2 max-w-md mx-auto"
                  onBlur={(e) => updateBlock(block.id, { url: e.target.value })}
                />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative" ref={editorRef}>
      <style>{`
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
      `}</style>
      <div className="prose max-w-none">
        {content.length === 0 ? (
          <p 
            className="text-gray-500 cursor-text"
            onClick={() => insertBlock('paragraph', { text: '' })}
          >
            Click here to start writing, or type '/' for commands...
          </p>
        ) : (
          content
            .sort((a, b) => a.order - b.order)
            .map(block => (
              <div key={block.id} className="relative group">
                {renderBlock(block)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteBlock(block.id)}
                >
                  ×
                </Button>
              </div>
            ))
        )}
      </div>

      {/* Slash Command Menu */}
      {showSlashMenu && (
        <Card 
          className="fixed z-50 w-80 max-h-80 overflow-y-auto shadow-lg"
          style={{ 
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="p-2">
            <Input
              placeholder="Search commands..."
              value={slashQuery}
              onChange={(e) => setSlashQuery(e.target.value)}
              className="mb-2"
              autoFocus
            />
            <div className="space-y-1">
              {filteredCommands.map((command) => (
                <Button
                  key={command.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-2"
                  onClick={command.action}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-mono">
                      {command.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{command.label}</div>
                      <div className="text-xs text-gray-500">{command.description}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 