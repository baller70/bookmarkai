import { NextResponse } from 'next/server';

export async function GET() {
  // Mock alliances data
  const mockAlliances = {
    alliances: [
      {
        tag: 'web-development',
        bookmarks: [
          { id: '1', title: 'React Documentation', url: 'https://react.dev' },
          { id: '2', title: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
          { id: '3', title: 'Stack Overflow', url: 'https://stackoverflow.com' },
          { id: '4', title: 'GitHub', url: 'https://github.com' }
        ]
      },
      {
        tag: 'design-tools',
        bookmarks: [
          { id: '5', title: 'Figma', url: 'https://figma.com' },
          { id: '6', title: 'Adobe Creative Cloud', url: 'https://adobe.com' },
          { id: '7', title: 'Dribbble', url: 'https://dribbble.com' }
        ]
      },
      {
        tag: 'productivity',
        bookmarks: [
          { id: '8', title: 'Notion', url: 'https://notion.so' },
          { id: '9', title: 'Todoist', url: 'https://todoist.com' },
          { id: '10', title: 'Calendly', url: 'https://calendly.com' },
          { id: '11', title: 'Slack', url: 'https://slack.com' },
          { id: '12', title: 'Zoom', url: 'https://zoom.us' }
        ]
      }
    ]
  };

  return NextResponse.json(mockAlliances);
} 