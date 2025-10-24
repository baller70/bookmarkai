'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bold, 
  Italic, 
  Underline, 
  List,
  Hash,
  Quote,
  Code,
  Type,
  Save,
  FileText
} from 'lucide-react';

interface SimpleDocumentEditorProps {
  content: any[];
  onChange: (content: any[]) => void;
  mediaFiles?: any[];
  onMediaEmbed?: (type: string) => void;
}

export function SimpleDocumentEditor({ content, onChange, mediaFiles = [], onMediaEmbed }: SimpleDocumentEditorProps) {
  const [activeFormat, setActiveFormat] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Convert content array to simple text for editing
  const contentText = content.map(block => {
    if (block.type === 'paragraph') {
      return block.data.text || '';
    }
    if (block.type === 'heading') {
      const level = '#'.repeat(block.data.level || 1);
      return `${level} ${block.data.text || ''}`;
    }
    if (block.type === 'list') {
      return block.data.items.map((item: string) => `• ${item}`).join('\n');
    }
    if (block.type === 'quote') {
      return `> ${block.data.text || ''}`;
    }
    if (block.type === 'code') {
      return `\`\`\`\n${block.data.code || ''}\n\`\`\``;
    }
    return block.data.text || '';
  }).join('\n\n');

  const [text, setText] = useState(contentText);

  // Convert simple text back to content array
  const parseTextToContent = (inputText: string) => {
    const lines = inputText.split('\n');
    const blocks: any[] = [];
    let currentBlock: any = null;
    let blockId = 1;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines unless we're building a code block
      if (!trimmedLine && (!currentBlock || currentBlock.type !== 'code')) {
        if (currentBlock) {
          blocks.push(currentBlock);
          currentBlock = null;
        }
        continue;
      }

      // Heading
      if (trimmedLine.startsWith('#')) {
        if (currentBlock) blocks.push(currentBlock);
        const level = trimmedLine.match(/^#+/)?.[0].length || 1;
        const text = trimmedLine.replace(/^#+\s*/, '');
        currentBlock = {
          id: `block-${blockId++}`,
          type: 'heading',
          data: { text, level },
          order: blocks.length
        };
      }
      // Quote
      else if (trimmedLine.startsWith('>')) {
        if (currentBlock) blocks.push(currentBlock);
        const text = trimmedLine.replace(/^>\s*/, '');
        currentBlock = {
          id: `block-${blockId++}`,
          type: 'quote',
          data: { text },
          order: blocks.length
        };
      }
      // List item
      else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        const text = trimmedLine.replace(/^[•\-*]\s*/, '');
        if (currentBlock && currentBlock.type === 'list') {
          currentBlock.data.items.push(text);
        } else {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = {
            id: `block-${blockId++}`,
            type: 'list',
            data: { type: 'bulleted', items: [text] },
            order: blocks.length
          };
        }
      }
      // Code block
      else if (trimmedLine === '```') {
        if (currentBlock && currentBlock.type === 'code') {
          blocks.push(currentBlock);
          currentBlock = null;
        } else {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = {
            id: `block-${blockId++}`,
            type: 'code',
            data: { code: '', language: 'javascript' },
            order: blocks.length
          };
        }
      }
      // Code content
      else if (currentBlock && currentBlock.type === 'code') {
        currentBlock.data.code += (currentBlock.data.code ? '\n' : '') + line;
      }
      // Regular paragraph
      else {
        if (currentBlock && currentBlock.type === 'paragraph') {
          currentBlock.data.text += '\n' + trimmedLine;
        } else {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = {
            id: `block-${blockId++}`,
            type: 'paragraph',
            data: { text: trimmedLine },
            order: blocks.length
          };
        }
      }
    }

    if (currentBlock) {
      blocks.push(currentBlock);
    }

    // Ensure there's at least one paragraph
    if (blocks.length === 0) {
      blocks.push({
        id: 'block-1',
        type: 'paragraph',
        data: { text: '' },
        order: 0
      });
    }

    return blocks;
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    const newContent = parseTextToContent(newText);
    onChange(newContent);
  };

  const insertFormat = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);
    let replacement = '';

    switch (format) {
      case 'heading':
        replacement = `# ${selectedText || 'Heading'}`;
        break;
      case 'bold':
        replacement = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        replacement = `*${selectedText || 'italic text'}*`;
        break;
      case 'list':
        replacement = `• ${selectedText || 'list item'}`;
        break;
      case 'quote':
        replacement = `> ${selectedText || 'quote'}`;
        break;
      case 'code':
        replacement = selectedText.includes('\n') 
          ? `\`\`\`\n${selectedText || 'code'}\n\`\`\``
          : `\`${selectedText || 'code'}\``;
        break;
      default:
        replacement = selectedText;
    }

    const newText = text.substring(0, start) + replacement + text.substring(end);
    handleTextChange(newText);

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-4 bg-gray-50 rounded-t-lg">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertFormat('heading')}
            className="flex items-center gap-1"
          >
            <Hash className="h-4 w-4" />
            Heading
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertFormat('bold')}
            className="flex items-center gap-1"
          >
            <Bold className="h-4 w-4" />
            Bold
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertFormat('italic')}
            className="flex items-center gap-1"
          >
            <Italic className="h-4 w-4" />
            Italic
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertFormat('list')}
            className="flex items-center gap-1"
          >
            <List className="h-4 w-4" />
            List
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertFormat('quote')}
            className="flex items-center gap-1"
          >
            <Quote className="h-4 w-4" />
            Quote
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertFormat('code')}
            className="flex items-center gap-1"
          >
            <Code className="h-4 w-4" />
            Code
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="border border-gray-200 rounded-b-lg">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Start writing your document...

Use markdown-style formatting:
# Heading 1
## Heading 2
**bold text**
*italic text*
• List item
> Quote
```
Code block
```"
          className="w-full h-96 p-6 resize-none border-none outline-none font-mono text-sm leading-relaxed"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
          }}
        />
      </div>

      {/* Help Text */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Formatting Guide:</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div><code># Heading</code> → Large heading</div>
          <div><code>## Subheading</code> → Medium heading</div>
          <div><code>**bold**</code> → <strong>bold text</strong></div>
          <div><code>*italic*</code> → <em>italic text</em></div>
          <div><code>• List item</code> → Bulleted list</div>
          <div><code>&gt; Quote</code> → Block quote</div>
          <div><code>```code```</code> → Code block</div>
        </div>
      </div>
    </div>
  );
}
