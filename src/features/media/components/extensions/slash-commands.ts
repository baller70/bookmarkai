// @ts-nocheck
import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import type { Editor } from '@tiptap/core'

// Enhanced renderer using native DOM with comprehensive error handling
function renderCommandList() {
  let component: { onUpdate: (props:any)=>void; element: HTMLElement; destroy: ()=>void } | null = null
  return {
    onStart: (props:any) => {
      try {
        console.log('🔍 SlashCommands renderCommandList: onStart called');
        const el = document.createElement('div')
        el.className = 'z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-gray-200 bg-white px-1 py-2 shadow-md'
        document.body.appendChild(el)
        component = {
          element: el,
          onUpdate: ({ items, command, clientRect }: any) => {
            try {
              console.log('🔍 SlashCommands renderCommandList: onUpdate called with', items?.length, 'items');
              if (!clientRect) {
                console.warn('🚨 renderCommandList onUpdate: No clientRect');
                return;
              }
              const rect = clientRect();
              if (!rect) {
                console.warn('🚨 renderCommandList onUpdate: clientRect() returned null');
                return;
              }
              el.style.position = 'absolute'
              el.style.left = rect.left + 'px'
              el.style.top = rect.bottom + 4 + 'px'
              el.innerHTML = ''

              if (!items || !Array.isArray(items)) {
                console.warn('🚨 renderCommandList onUpdate: Invalid items');
                el.innerHTML = '<div class="text-gray-500 text-sm p-2">No commands available</div>';
                return;
              }

              if (items.length === 0) {
                el.innerHTML = '<div class="text-gray-500 text-sm p-2">No commands found</div>';
                return;
              }

              items.forEach((item: any, index: number) => {
                if (!item || !item.label) {
                  console.warn('🚨 renderCommandList onUpdate: Invalid item at index', index);
                  return;
                }
                const btn = document.createElement('button')
                btn.type = 'button'
                btn.className = 'flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 text-left'
                btn.innerHTML = `
                  <div>
                    <div class="font-medium">${item.label}</div>
                    ${item.description ? `<div class="text-xs text-gray-500">${item.description}</div>` : ''}
                  </div>
                `
                btn.addEventListener('click', () => {
                  try {
                    console.log('🔍 SlashCommands: Item clicked:', item.label);
                    if (typeof command === 'function') {
                      command(item);
                    } else {
                      console.warn('🚨 renderCommandList: Invalid command function');
                    }
                  } catch (error) {
                    console.error('🚨 renderCommandList: Command click error:', error);
                  }
                })
                el.appendChild(btn)
              })
              console.log('✅ SlashCommands renderCommandList: Menu updated with', items.length, 'items');
            } catch (error) {
              console.error('🚨 renderCommandList onUpdate error:', error);
            }
          },
          destroy: () => {
            try {
              console.log('🔍 SlashCommands renderCommandList: destroy called');
              if (el && el.parentNode) {
                el.remove();
              }
            } catch (error) {
              console.error('🚨 renderCommandList destroy error:', error);
            }
          }
        }
        if (component) {
          component.onUpdate(props);
        }
        console.log('✅ SlashCommands renderCommandList: Component created successfully');
      } catch (error) {
        console.error('🚨 renderCommandList onStart error:', error);
      }
    },

    onUpdate: (props:any) => {
      try {
        console.log('🔍 SlashCommands renderCommandList: onUpdate wrapper called');
        if (component && typeof component.onUpdate === 'function') {
          component.onUpdate(props);
        }
      } catch (error) {
        console.error('🚨 renderCommandList onUpdate wrapper error:', error);
      }
    },
    onKeyDown: ({ event }: any) => {
      try {
        console.log('🔍 SlashCommands renderCommandList: onKeyDown called with key:', event?.key);
        if (event && event.key === 'Escape') {
          console.log('🔍 SlashCommands: Escape pressed, destroying component');
          if (component && typeof component.destroy === 'function') {
            component.destroy();
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error('🚨 renderCommandList onKeyDown error:', error);
        return false;
      }
    },
    onExit: () => {
      try {
        console.log('🔍 SlashCommands renderCommandList: onExit called');
        if (component && typeof component.destroy === 'function') {
          component.destroy();
        }
        component = null;
        console.log('✅ SlashCommands renderCommandList: Cleanup completed');
      } catch (error) {
        console.error('🚨 renderCommandList onExit error:', error);
      }
    },
  }
}

async function runAI(editor: Editor, action: 'continue' | 'summarize' | 'improve') {
  try {
    console.log('🔍 SlashCommands runAI: Starting AI action:', action);
    // Enhanced safety check for editor initialization
    if (!editor) {
      console.warn('🚨 runAI: Editor is null/undefined');
      return;
    }

    // Check if editor has the required properties and methods
    if (typeof editor.isEditable !== 'boolean' && typeof editor.isEditable !== 'function') {
      console.warn('🚨 runAI: Editor.isEditable is not available');
      return;
    }

    const isEditable = typeof editor.isEditable === 'function' ? editor.isEditable() : editor.isEditable;
    if (!isEditable) {
      console.warn('🚨 runAI: Editor is not editable');
      return;
    }

    if (!editor.state) {
      console.warn('🚨 runAI: Editor state is not available');
      return;
    }

    const { state } = editor
    const { from, to } = state.selection
    const text = state.doc.textBetween(from, to, '\n') || state.doc.textContent.slice(0, 800)

    console.log('🔍 SlashCommands runAI: Making API request with text length:', text.length);
    const res = await fetch('/api/ai/content-analysis/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, action })
    })
    const json = await res.json()
    const suggestion = json?.suggestion || json?.text || ''

    console.log('🔍 SlashCommands runAI: Received suggestion length:', suggestion.length);
    if (suggestion && editor.isEditable) {
      editor.chain().focus().insertContent(suggestion).run()
      console.log('✅ SlashCommands runAI: Successfully inserted AI suggestion');
    }
  } catch (e) {
    console.warn('🚨 runAI: Error occurred:', e);
    // Fail silently to preserve UX
  }
}

function getCommandItems(query: string) {
  const q = (query || '').toLowerCase()
  console.log('🔍 SlashCommands getCommandItems: Filtering commands with query:', q);

  // Helper function to safely run editor commands with enhanced error handling
  const safeRun = (command: (ed: Editor) => void) => (ed: Editor) => {
    try {
      if (!ed) {
        console.warn('🚨 getCommandItems safeRun: Editor is null/undefined');
        return;
      }

      // Check if editor has the required properties and methods
      if (typeof ed.isEditable !== 'boolean' && typeof ed.isEditable !== 'function') {
        console.warn('🚨 getCommandItems safeRun: Editor.isEditable is not available');
        return;
      }

      const isEditable = typeof ed.isEditable === 'function' ? ed.isEditable() : ed.isEditable;
      if (!isEditable) {
        console.warn('🚨 getCommandItems safeRun: Editor is not editable');
        return;
      }

      console.log('🔍 getCommandItems safeRun: Executing command');
      command(ed);
      console.log('✅ getCommandItems safeRun: Command executed successfully');
    } catch (error) {
      console.error('🚨 getCommandItems safeRun: Command execution error:', error);
    }
  };

  const items = [
    {
      label: 'Paragraph',
      description: 'Regular text paragraph',
      run: safeRun((ed:Editor)=> ed.chain().focus().setParagraph().run())
    },
    {
      label: 'Heading 1',
      description: 'Large section heading',
      run: safeRun((ed:Editor)=> ed.chain().focus().toggleHeading({ level:1 }).run())
    },
    {
      label: 'Heading 2',
      description: 'Medium section heading',
      run: safeRun((ed:Editor)=> ed.chain().focus().toggleHeading({ level:2 }).run())
    },
    {
      label: 'Heading 3',
      description: 'Small section heading',
      run: safeRun((ed:Editor)=> ed.chain().focus().toggleHeading({ level:3 }).run())
    },
    {
      label: 'Bullet List',
      description: 'Unordered list with bullets',
      run: safeRun((ed:Editor)=> ed.chain().focus().toggleBulletList().run())
    },
    {
      label: 'Ordered List',
      description: 'Numbered list',
      run: safeRun((ed:Editor)=> ed.chain().focus().toggleOrderedList().run())
    },
    {
      label: 'Blockquote',
      description: 'Quote or citation',
      run: safeRun((ed:Editor)=> ed.chain().focus().toggleBlockquote().run())
    },
    {
      label: 'Horizontal Rule',
      description: 'Divider line',
      run: safeRun((ed:Editor)=> ed.chain().focus().setHorizontalRule().run())
    },
    {
      label: 'Task List',
      description: 'Checklist with checkboxes',
      run: safeRun((ed:Editor)=> ed.chain().focus().toggleTaskList().run())
    },
    {
      label: 'AI: Continue',
      description: 'Let AI continue your writing',
      run: (ed:Editor)=> runAI(ed,'continue')
    },
    {
      label: 'AI: Summarize',
      description: 'AI will summarize the content',
      run: (ed:Editor)=> runAI(ed,'summarize')
    },
    {
      label: 'AI: Improve',
      description: 'AI will improve the writing',
      run: (ed:Editor)=> runAI(ed,'improve')
    },
  ]

  const filteredItems = items.filter(i => i.label.toLowerCase().includes(q)).slice(0, 20)
  console.log('🔍 SlashCommands getCommandItems: Returning', filteredItems.length, 'filtered items');
  return filteredItems;
}

export const SlashCommands = (opts: { placeholder?: string } = {}) =>
  Extension.create({
    name: 'slash-commands',
    addProseMirrorPlugins() {
      const editor = (this as any).editor;
      return [
        Suggestion({
          editor,
          char: '/',
          startOfLine: false, // Allow slash commands anywhere, not just at start of line
          render: renderCommandList,
          items: (props: any) => {
            try {
              const editor: Editor | undefined = props?.editor;
              const query: string = props?.query ?? '';
              console.log('🔍 SlashCommands items: Called with query:', query);
              // Enhanced safety checks for editor with better error handling
              if (!editor) {
                console.warn('🚨 SlashCommands items: Editor is null/undefined');
                return [];
              }

              // More robust editor state checking
              if (typeof (editor as any).isEditable !== 'boolean' && typeof (editor as any).isEditable !== 'function') {
                console.warn('🚨 SlashCommands items: Editor.isEditable is not available');
                return [];
              }

              const isEditable = typeof (editor as any).isEditable === 'function' ? (editor as any).isEditable() : (editor as any).isEditable;
              if (!isEditable) {
                console.warn('🚨 SlashCommands items: Editor is not editable');
                return [];
              }

              if (!(editor as any).state) {
                console.warn('🚨 SlashCommands items: Editor state is not available');
                return [];
              }

              if (!(editor as any).view) {
                console.warn('🚨 SlashCommands items: Editor view is not available');
                return [];
              }

              console.log('✅ SlashCommands items: All safety checks passed, returning commands');
              return getCommandItems(query || '');
            } catch (error) {
              console.error('🚨 SlashCommands items error:', error);
              return [];
            }
          },
          command: (props: any) => {
            try {
              const editor: Editor | undefined = props?.editor;
              const item = props?.item;
              console.log('🔍 SlashCommands command: Executing command for item:', item?.label);
              // Enhanced safety checks for editor with better error handling
              if (!editor) {
                console.warn('🚨 SlashCommands command: Editor is null/undefined');
                return;
              }

              // More robust editor state checking
              if (typeof (editor as any).isEditable !== 'boolean' && typeof (editor as any).isEditable !== 'function') {
                console.warn('🚨 SlashCommands command: Editor.isEditable is not available');
                return;
              }

              const isEditable = typeof (editor as any).isEditable === 'function' ? (editor as any).isEditable() : (editor as any).isEditable;
              if (!isEditable) {
                console.warn('🚨 SlashCommands command: Editor is not editable');
                return;
              }

              if (!(editor as any).state) {
                console.warn('🚨 SlashCommands command: Editor state is not available');
                return;
              }

              if (!(editor as any).view) {
                console.warn('🚨 SlashCommands command: Editor view is not available');
                return;
              }

              if (!item) {
                console.warn('🚨 SlashCommands command: Item is null/undefined');
                return;
              }
              if (typeof item.run !== 'function') {
                console.warn('🚨 SlashCommands command: Item.run is not a function');
                return;
              }

              console.log('✅ SlashCommands command: All safety checks passed, executing command');
              // Execute the command
              item.run(editor);
              console.log('✅ SlashCommands command: Command executed successfully');
            } catch (error) {
              console.error('🚨 SlashCommands command execution error:', error);
            }
          },
          // Enhanced safety checks for the suggestion plugin
          allow: (props: any) => {
            try {
              const editor: Editor | undefined = props?.editor;
              console.log('🔍 SlashCommands allow: Checking if command should be allowed');
              if (!editor) {
                console.warn('🚨 SlashCommands allow: Editor is null/undefined');
                return false;
              }

              // More robust editor state checking
              if (typeof (editor as any).isEditable !== 'boolean' && typeof (editor as any).isEditable !== 'function') {
                console.warn('🚨 SlashCommands allow: Editor.isEditable is not available');
                return false;
              }

              if (!(editor as any).state) {
                console.warn('🚨 SlashCommands allow: Editor state is not available');
                return false;
              }

              if (!(editor as any).view) {
                console.warn('🚨 SlashCommands allow: Editor view is not available');
                return false;
              }

              const isEditable = typeof (editor as any).isEditable === 'function' ? (editor as any).isEditable() : (editor as any).isEditable;
              console.log('✅ SlashCommands allow: All safety checks passed, allowing command. isEditable:', isEditable);
              return !!isEditable;
            } catch (error) {
              console.error('🚨 SlashCommands allow error:', error);
              return false;
            }
          },
        }) as any,
      ]
    },
  })

