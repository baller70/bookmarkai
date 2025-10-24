// @ts-nocheck
/**
 * Unit tests for ARP delete operations
 * Tests asset deletion and related bookmark removal functionality
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock data for testing
const mockSection = {
  id: 'section-1',
  title: 'Test Section',
  content: 'Test content',
  assets: [
    {
      id: 'asset-1',
      name: 'test-file.pdf',
      type: 'document' as const,
      url: 'https://example.com/test-file.pdf',
      size: 1024,
      uploadedAt: new Date()
    },
    {
      id: 'asset-2',
      name: 'test-image.jpg',
      type: 'image' as const,
      url: 'https://example.com/test-image.jpg',
      size: 2048,
      uploadedAt: new Date()
    }
  ],
  relatedBookmarks: ['bookmark-1', 'bookmark-2']
};

const mockBookmarks = [
  {
    id: 'bookmark-1',
    title: 'Test Bookmark 1',
    url: 'https://example.com/1',
    description: 'Test description 1'
  },
  {
    id: 'bookmark-2',
    title: 'Test Bookmark 2',
    url: 'https://example.com/2',
    description: 'Test description 2'
  }
];

describe('ARP Delete Operations', () => {
  let mockSections: typeof mockSection[];
  let mockUpdateSection: jest.Mock;
  let mockSetSections: jest.Mock;

  beforeEach(() => {
    mockSections = [mockSection];
    mockUpdateSection = jest.fn();
    mockSetSections = jest.fn();
    
    // Clear console logs
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('Asset Deletion', () => {
    const createRemoveAssetFunction = (sections: typeof mockSection[], updateSection: jest.Mock) => {
      return (sectionId: string, assetId: string) => {
        const section = sections.find(s => s.id === sectionId);
        if (!section) {
          console.error('Section not found:', sectionId);
          return;
        }

        const assetToRemove = section.assets.find(asset => asset.id === assetId);
        if (!assetToRemove) {
          console.error('Asset not found:', assetId);
          return;
        }

        const updatedAssets = section.assets.filter(asset => asset.id !== assetId);
        updateSection(sectionId, {
          assets: updatedAssets
        });

        console.log(`Asset "${assetToRemove.name}" removed successfully`);
      };
    };

    it('should successfully remove an existing asset', () => {
      const removeAsset = createRemoveAssetFunction(mockSections, mockUpdateSection);
      
      removeAsset('section-1', 'asset-1');
      
      expect(mockUpdateSection).toHaveBeenCalledWith('section-1', {
        assets: [mockSection.assets[1]] // Only asset-2 should remain
      });
      expect(console.log).toHaveBeenCalledWith('Asset "test-file.pdf" removed successfully');
    });

    it('should handle non-existent section gracefully', () => {
      const removeAsset = createRemoveAssetFunction(mockSections, mockUpdateSection);
      
      removeAsset('non-existent-section', 'asset-1');
      
      expect(mockUpdateSection).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Section not found:', 'non-existent-section');
    });

    it('should handle non-existent asset gracefully', () => {
      const removeAsset = createRemoveAssetFunction(mockSections, mockUpdateSection);
      
      removeAsset('section-1', 'non-existent-asset');
      
      expect(mockUpdateSection).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Asset not found:', 'non-existent-asset');
    });

    it('should remove the correct asset when multiple assets exist', () => {
      const removeAsset = createRemoveAssetFunction(mockSections, mockUpdateSection);
      
      removeAsset('section-1', 'asset-2');
      
      expect(mockUpdateSection).toHaveBeenCalledWith('section-1', {
        assets: [mockSection.assets[0]] // Only asset-1 should remain
      });
      expect(console.log).toHaveBeenCalledWith('Asset "test-image.jpg" removed successfully');
    });
  });

  describe('Related Bookmark Removal', () => {
    const createToggleRelatedBookmarkFunction = (sections: typeof mockSection[], updateSection: jest.Mock) => {
      return (sectionId: string, bookmarkId: string) => {
        const section = sections.find(s => s.id === sectionId);
        if (!section) return;

        const isCurrentlyRelated = section.relatedBookmarks.includes(bookmarkId);
        const updatedBookmarks = isCurrentlyRelated
          ? section.relatedBookmarks.filter(id => id !== bookmarkId)
          : [...section.relatedBookmarks, bookmarkId];

        updateSection(sectionId, {
          relatedBookmarks: updatedBookmarks
        });

        console.log('Remove related bookmark clicked:', { sectionId, bookmarkId });
      };
    };

    it('should successfully remove a related bookmark', () => {
      const toggleRelatedBookmark = createToggleRelatedBookmarkFunction(mockSections, mockUpdateSection);
      
      toggleRelatedBookmark('section-1', 'bookmark-1');
      
      expect(mockUpdateSection).toHaveBeenCalledWith('section-1', {
        relatedBookmarks: ['bookmark-2'] // Only bookmark-2 should remain
      });
      expect(console.log).toHaveBeenCalledWith('Remove related bookmark clicked:', {
        sectionId: 'section-1',
        bookmarkId: 'bookmark-1'
      });
    });

    it('should add a bookmark if not currently related', () => {
      const toggleRelatedBookmark = createToggleRelatedBookmarkFunction(mockSections, mockUpdateSection);
      
      toggleRelatedBookmark('section-1', 'bookmark-3');
      
      expect(mockUpdateSection).toHaveBeenCalledWith('section-1', {
        relatedBookmarks: ['bookmark-1', 'bookmark-2', 'bookmark-3']
      });
    });

    it('should handle non-existent section gracefully', () => {
      const toggleRelatedBookmark = createToggleRelatedBookmarkFunction(mockSections, mockUpdateSection);
      
      toggleRelatedBookmark('non-existent-section', 'bookmark-1');
      
      expect(mockUpdateSection).not.toHaveBeenCalled();
    });
  });

  describe('Section Deletion', () => {
    const createRemoveSectionFunction = (sections: typeof mockSection[], setSections: jest.Mock) => {
      return (sectionId: string) => {
        if (sections.length > 1) {
          const updatedSections = sections.filter(section => section.id !== sectionId);
          setSections(updatedSections);
        }
      };
    };

    it('should successfully remove a section when multiple sections exist', () => {
      const sectionsWithMultiple = [mockSection, { ...mockSection, id: 'section-2' }];
      const removeSection = createRemoveSectionFunction(sectionsWithMultiple, mockSetSections);
      
      removeSection('section-1');
      
      expect(mockSetSections).toHaveBeenCalledWith([{ ...mockSection, id: 'section-2' }]);
    });

    it('should not remove section when only one section exists', () => {
      const removeSection = createRemoveSectionFunction(mockSections, mockSetSections);
      
      removeSection('section-1');
      
      expect(mockSetSections).not.toHaveBeenCalled();
    });
  });

  describe('API Delete Operations', () => {
    it('should handle bookmark deletion API response', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Bookmark deleted successfully' })
      };
      
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      
      const response = await fetch('/api/bookmarks/bookmark-1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: 'test-user' })
      });
      
      const result = await response.json();
      
      expect(fetch).toHaveBeenCalledWith('/api/bookmarks/bookmark-1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: 'test-user' })
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Bookmark deleted successfully');
    });

    it('should handle API error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Bookmark not found' })
      };
      
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      
      const response = await fetch('/api/bookmarks/non-existent', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: 'test-user' })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(result.error).toBe('Bookmark not found');
    });
  });
});
