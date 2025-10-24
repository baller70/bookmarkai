// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import './novel-editor.css';
import {
  EditorRoot,
  EditorContent,
  type EditorInstance,
  type JSONContent,
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  handleCommandNavigation,
  type SuggestionItem,
  // Import extensions directly from novel main export
  TiptapImage,
  TiptapLink,
  TaskList,
  TaskItem,
  StarterKit,
  TiptapUnderline,
  TextStyle,
  Color,
} from 'novel';

// Import additional extensions from @tiptap directly
import { Placeholder } from '@tiptap/extension-placeholder';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';

interface NovelEditorProps {
  content: any[];
  onChange: (content: any[]) => void;
  className?: string;
  placeholder?: string;
  mediaFiles?: any[];
}

export function NovelEditor({ 
  content, 
  onChange, 
  className = "",
  placeholder = "Press '/' for commands, or start writing...",
  mediaFiles = []
}: NovelEditorProps) {
  const [editorContent, setEditorContent] = useState<JSONContent | null>(null);
  const editorRef = useRef<EditorInstance | null>(null);

  // Define base suggestion items for slash commands
  const baseSuggestionItems: SuggestionItem[] = [
    {
      title: 'Paragraph',
      description: 'Start writing with plain text',
      icon: '📝',
      command: ({ editor, range }) => {
        alert('Paragraph command clicked!');
        try {
          editor.chain().focus().deleteRange(range).setParagraph().run();
        } catch (error) {
          console.error('❌ Paragraph command failed:', error);
        }
      },
    },
    {
      title: 'Heading 1',
      description: 'Large section heading',
      icon: 'H1',
      command: ({ editor, range }) => {
        try {
          editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
        } catch (error) {
          console.error('❌ Heading 1 command failed:', error);
        }
      },
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: 'H2',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
      },
    },
    {
      title: 'Heading 3',
      description: 'Small section heading',
      icon: 'H3',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
      },
    },
    {
      title: 'Bullet List',
      description: 'Create a simple bullet list',
      icon: '•',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: 'Numbered List',
      description: 'Create a numbered list',
      icon: '1.',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: 'Quote',
      description: 'Capture a quote',
      icon: '"',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: 'Code Block',
      description: 'Capture a code snippet',
      icon: '{}',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      title: 'Divider',
      description: 'Visually divide blocks',
      icon: '—',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
    {
      title: 'Image',
      description: 'Insert an image',
      icon: '🖼️',
      command: ({ editor, range }) => {
        const url = window.prompt('Enter image URL:');
        if (url) {
          editor.chain().focus().deleteRange(range).setImage({ src: url, alt: '', title: '' }).run();
        }
      },
    },
    {
      title: 'Video',
      description: 'Embed a video',
      icon: '🎥',
      command: ({ editor, range }) => {
        const url = window.prompt('Enter video URL (YouTube, Vimeo, etc.):');
        if (url) {
          // For now, we'll insert it as a link with video text
          editor.chain().focus().deleteRange(range).insertContent(`[Video: ${url}](${url})`).run();
        }
      },
    },
    {
      title: 'To-Do List',
      description: 'Create a task list with checkboxes',
      icon: '✅',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: 'Checkbox',
      description: 'Insert a single checkbox item',
      icon: '☑️',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).insertContent('- [ ] ').run();
      },
    },
    {
      title: 'AI Assistant',
      description: 'Ask AI to help with your content',
      icon: '🤖',
      command: ({ editor, range }) => {
        const prompt = window.prompt('What would you like AI to help you with?');
        if (prompt) {
          editor.chain().focus().deleteRange(range).insertContent(`🤖 AI: ${prompt}`).run();
        }
      },
    },
  ];

  // Add sample media files for testing when no files exist
  const sampleMediaFiles = mediaFiles && mediaFiles.length > 0 ? mediaFiles : [
    {
      name: "Sample Image.jpg",
      type: "image", 
      url: "https://picsum.photos/400/300",
      description: "A sample image for testing"
    },
    {
      name: "Sample Document.pdf",
      type: "document",
      url: "#",
      description: "A sample document"
    }
  ];

  // Add media files as additional suggestion items  
  const mediaCommands: SuggestionItem[] = (sampleMediaFiles || []).map((file: any) => ({
    title: file.name,
    description: `Insert ${file.type}: ${file.name}`,
    icon: file.type === 'image' ? '🖼️' : 
          file.type === 'video' ? '🎥' : 
          file.type === 'audio' ? '🎵' : '📄',
    command: ({ editor, range }) => {
      try {
        if (file.type === 'image') {
          editor.chain().focus().deleteRange(range).setImage({ 
            src: file.url, 
            alt: file.description || file.name,
            title: file.name 
          }).run();
        } else {
          // For non-image files, insert as a link
          editor.chain().focus().deleteRange(range).insertContent(`[${file.type}: ${file.name}](${file.url})`).run();
        }
      } catch (error) {
        console.error(`❌ Media command failed for ${file.name}:`, error);
      }
    },
  }));

  // Combine base commands with media commands
  const rawSuggestionItems: SuggestionItem[] = [...baseSuggestionItems, ...mediaCommands];

  // Debug: Log the number of suggestion items (reduced logging)
  console.log('🔍 NovelEditor: Total suggestion items loaded:', rawSuggestionItems.length);
  console.log('🔍 NovelEditor: Media files received:', mediaFiles?.length || 0);
  console.log('🔍 NovelEditor: Sample media files used:', sampleMediaFiles.length);
  console.log('🔍 NovelEditor: Media commands generated:', mediaCommands.length);
  if (sampleMediaFiles.length > 0) {
    console.log('🔍 NovelEditor: First sample media file:', sampleMediaFiles[0]);
  }

  // Configure extensions
  const defaultExtensions = [
    StarterKit.configure({
      bulletList: {
        keepMarks: true,
        keepAttributes: false,
      },
      orderedList: {
        keepMarks: true,
        keepAttributes: false,
      },
      // Disable StarterKit's horizontalRule to avoid duplicate
      horizontalRule: false,
    }),
    // Command.configure suggestion disabled to avoid Suggestion plugin crashes with editor undefined
    // Slash commands are handled via custom overlays in specific editors where needed.
    HorizontalRule.configure({
      HTMLAttributes: {
        class: 'mt-4 mb-6 border-t border-gray-300',
      },
    }),
    TiptapLink.configure({
      HTMLAttributes: {
        class: 'text-blue-500 underline underline-offset-[3px] hover:text-blue-600 transition-colors cursor-pointer',
      },
    }),
    TiptapImage.configure({
      allowBase64: true,
      HTMLAttributes: {
        class: 'rounded-lg border border-gray-200',
      },
    }),
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === 'heading') {
          return `Heading ${node.attrs.level}`;
        }
        return placeholder;
      },
      includeChildren: true,
    }),
    TaskList.configure({
      HTMLAttributes: {
        class: 'not-prose pl-2 ',
      },
    }),
    TaskItem.configure({
      HTMLAttributes: {
        class: 'flex gap-2 items-start my-4',
      },
      nested: true,
    }),
    TiptapUnderline,
    TextStyle,
    Color,
  ];

  // Convert our content format to Novel's JSONContent format
  useEffect(() => {
    if (content && content.length > 0) {
      // Convert our block-based content to Tiptap JSONContent
      const novelContent: JSONContent = {
        type: 'doc',
        content: content.map(block => {
          switch (block.type) {
            case 'paragraph':
              return {
                type: 'paragraph',
                content: block.data?.text ? [{ 
                  type: 'text', 
                  text: block.data.text 
                }] : []
              };
            case 'heading':
              return {
                type: 'heading',
                attrs: { level: block.data?.level || 1 },
                content: block.data?.text ? [{ 
                  type: 'text', 
                  text: block.data.text 
                }] : []
              };
            case 'list':
              return {
                type: block.data?.style === 'ordered' ? 'orderedList' : 'bulletList',
                content: (block.data?.items || []).map((item: string) => ({
                  type: 'listItem',
                  content: [{
                    type: 'paragraph',
                    content: [{ type: 'text', text: item }]
                  }]
                }))
              };
            case 'quote':
              return {
                type: 'blockquote',
                content: [{
                  type: 'paragraph',
                  content: [{ type: 'text', text: block.data?.text || '' }]
                }]
              };
            case 'code':
              return {
                type: 'codeBlock',
                attrs: { language: block.data?.language || 'javascript' },
                content: [{ type: 'text', text: block.data?.code || '' }]
              };
            case 'divider':
              return { type: 'horizontalRule' };
            default:
              return {
                type: 'paragraph',
                content: [{ type: 'text', text: block.data?.text || '' }]
              };
          }
        })
      };
      setEditorContent(novelContent);
    } else {
      // Empty document
      setEditorContent({
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: []
        }]
      });
    }
  }, [content]);

  const handleEditorChange = (editorContent: JSONContent) => {
    // Convert Novel's JSONContent back to our block format
    if (!editorContent?.content) {
      onChange([]);
      return;
    }

    const blocks = editorContent.content.map((node, index) => {
      const blockId = `block-${Date.now()}-${index}`;
      
      switch (node.type) {
        case 'paragraph':
          return {
            id: blockId,
            type: 'paragraph',
            data: { 
              text: node.content?.map(n => n.text).join('') || '' 
            },
            order: index
          };
        case 'heading':
          return {
            id: blockId,
            type: 'heading',
            data: { 
              text: node.content?.map(n => n.text).join('') || '',
              level: node.attrs?.level || 1
            },
            order: index
          };
        case 'bulletList':
        case 'orderedList':
          return {
            id: blockId,
            type: 'list',
            data: {
              style: node.type === 'orderedList' ? 'ordered' : 'unordered',
              items: node.content?.map(item => 
                item.content?.[0]?.content?.map(n => n.text).join('') || ''
              ) || []
            },
            order: index
          };
        case 'blockquote':
          return {
            id: blockId,
            type: 'quote',
            data: { 
              text: node.content?.[0]?.content?.map(n => n.text).join('') || ''
            },
            order: index
          };
        case 'codeBlock':
          return {
            id: blockId,
            type: 'code',
            data: {
              code: node.content?.map(n => n.text).join('') || '',
              language: node.attrs?.language || 'javascript'
            },
            order: index
          };
        case 'horizontalRule':
          return {
            id: blockId,
            type: 'divider',
            data: {},
            order: index
          };
        default:
          return {
            id: blockId,
            type: 'paragraph',
            data: { text: '' },
            order: index
          };
      }
    });

    onChange(blocks);
  };

  if (!editorContent) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading editor...
      </div>
    );
  }

  return (
    <div className={`novel-editor-wrapper h-full ${className}`}>
      <EditorRoot>
        <EditorContent
          initialContent={editorContent}
          extensions={defaultExtensions}
          onUpdate={({ editor }: { editor: EditorInstance }) => {
            editorRef.current = editor;
            const json = editor.getJSON();
            if (json) {
              handleEditorChange(json);
            }
          }}
          className="novel-editor h-full w-full"
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            attributes: {
              class: 'prose prose-stone dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-none p-6',
            },
          }}
        >
          <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-gray-200 bg-white px-1 py-2 shadow-md" shouldFilter={false}>
            <EditorCommandEmpty className="px-2 text-gray-500">No results</EditorCommandEmpty>
            <EditorCommandList>
              {rawSuggestionItems.map((item, index) => (
                <EditorCommandItem
                  key={`${item.title}-${index}`}
                  onCommand={(val) => {
                    console.log('🔍 Command triggered:', item.title);
                    // Get current editor instance and range
                    const editor = editorRef.current;
                    if (editor && item.command) {
                      // Create a mock range - this might need adjustment based on actual cursor position
                      const { from, to } = editor.state.selection;
                      const range = { from, to };
                      item.command({ editor, range });
                    }
                  }}
                  className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 aria-selected:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-gray-200 bg-white">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>
        </EditorContent>
      </EditorRoot>
      
      <style jsx global>{`
        .novel-editor-wrapper {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .novel-editor {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .novel-editor .ProseMirror {
          padding: 24px;
          height: 100%;
          outline: none;
          font-size: 16px;
          line-height: 1.6;
          overflow-y: auto;
        }
        
        .novel-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: "${placeholder}";
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        
        /* Novel-specific styling */
        .novel-editor .ProseMirror h1 {
          font-size: 2.25rem;
          font-weight: 700;
          line-height: 1.2;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        
        .novel-editor .ProseMirror h2 {
          font-size: 1.875rem;
          font-weight: 600;
          line-height: 1.3;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        
        .novel-editor .ProseMirror h3 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        
        .novel-editor .ProseMirror blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }
        
        .novel-editor .ProseMirror pre {
          background: #f3f4f6;
          border-radius: 6px;
          padding: 1rem;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          overflow-x: auto;
          margin: 1rem 0;
        }
        
        .novel-editor .ProseMirror ul, 
        .novel-editor .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        
        .novel-editor .ProseMirror li {
          margin: 0.25rem 0;
        }
        
        .novel-editor .ProseMirror hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2rem 0;
        }
        
        /* Slash command menu styling */
        .novel-slash-command {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          max-height: 300px;
          overflow-y: auto;
          z-index: 50;
        }
        
        .novel-slash-command-item {
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .novel-slash-command-item:hover,
        .novel-slash-command-item.is-selected {
          background: #f3f4f6;
        }
        
        .novel-slash-command-item:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
}
