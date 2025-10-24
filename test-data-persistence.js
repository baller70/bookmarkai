#!/usr/bin/env node

/**
 * Test script to verify data persistence functionality
 * This script tests the bookmark API endpoints to ensure data is properly persisted
 */

const BASE_URL = 'http://localhost:3000'

async function testBookmarkPersistence() {
  console.log('🧪 Testing Bookmark Data Persistence...\n')

  try {
    // Test 1: Create a new bookmark
    console.log('📝 Test 1: Creating a new bookmark...')
    const createResponse = await fetch(`${BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Bookmark - Data Persistence',
        url: 'https://example.com/test-persistence',
        description: 'This is a test bookmark to verify data persistence',
        category: 'Testing',
        tags: ['test', 'persistence'],
        user_id: 'dev-user-123',
        isFavorite: false
      }),
    })

    if (!createResponse.ok) {
      throw new Error(`Failed to create bookmark: ${createResponse.status} ${createResponse.statusText}`)
    }

    const createResult = await createResponse.json()
    console.log('✅ Bookmark created successfully:', createResult.bookmark?.id)
    const bookmarkId = createResult.bookmark?.id

    if (!bookmarkId) {
      throw new Error('No bookmark ID returned from create operation')
    }

    // Test 2: Verify the bookmark exists by fetching all bookmarks
    console.log('\n📋 Test 2: Fetching all bookmarks to verify persistence...')
    const fetchResponse = await fetch(`${BASE_URL}/api/bookmarks?user_id=dev-user-123`)
    
    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch bookmarks: ${fetchResponse.status} ${fetchResponse.statusText}`)
    }

    const fetchResult = await fetchResponse.json()
    const bookmarks = fetchResult.bookmarks || []
    const createdBookmark = bookmarks.find(b => b.id === bookmarkId)

    if (!createdBookmark) {
      throw new Error(`Created bookmark with ID ${bookmarkId} not found in fetch results`)
    }

    console.log('✅ Bookmark found in fetch results:', createdBookmark.title)

    // Test 3: Update the bookmark's favorite status
    console.log('\n❤️ Test 3: Testing favorite functionality...')
    const favoriteResponse = await fetch(`${BASE_URL}/api/bookmarks/${bookmarkId}/favorite`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isFavorite: true,
        user_id: 'dev-user-123'
      }),
    })

    if (!favoriteResponse.ok) {
      throw new Error(`Failed to update favorite status: ${favoriteResponse.status} ${favoriteResponse.statusText}`)
    }

    const favoriteResult = await favoriteResponse.json()
    console.log('✅ Favorite status updated successfully:', favoriteResult)

    // Test 4: Verify the favorite status persisted
    console.log('\n🔍 Test 4: Verifying favorite status persistence...')
    const verifyResponse = await fetch(`${BASE_URL}/api/bookmarks?user_id=dev-user-123`)
    
    if (!verifyResponse.ok) {
      throw new Error(`Failed to verify bookmarks: ${verifyResponse.status} ${verifyResponse.statusText}`)
    }

    const verifyResult = await verifyResponse.json()
    const verifyBookmarks = verifyResult.bookmarks || []
    const updatedBookmark = verifyBookmarks.find(b => b.id === bookmarkId)

    if (!updatedBookmark) {
      throw new Error(`Updated bookmark with ID ${bookmarkId} not found`)
    }

    if (!updatedBookmark.isFavorite) {
      throw new Error('Favorite status was not persisted correctly')
    }

    console.log('✅ Favorite status persisted correctly:', updatedBookmark.isFavorite)

    // Test 5: Update the bookmark with full data
    console.log('\n📝 Test 5: Testing full bookmark update...')
    const updateResponse = await fetch(`${BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: bookmarkId,
        title: 'Updated Test Bookmark - Data Persistence',
        url: 'https://example.com/test-persistence-updated',
        description: 'This bookmark has been updated to test persistence',
        category: 'Testing Updated',
        tags: ['test', 'persistence', 'updated'],
        user_id: 'dev-user-123',
        isFavorite: true
      }),
    })

    if (!updateResponse.ok) {
      throw new Error(`Failed to update bookmark: ${updateResponse.status} ${updateResponse.statusText}`)
    }

    const updateResult = await updateResponse.json()
    console.log('✅ Bookmark updated successfully')

    // Test 6: Final verification
    console.log('\n🎯 Test 6: Final verification of all changes...')
    const finalResponse = await fetch(`${BASE_URL}/api/bookmarks?user_id=dev-user-123`)
    
    if (!finalResponse.ok) {
      throw new Error(`Failed to final verify: ${finalResponse.status} ${finalResponse.statusText}`)
    }

    const finalResult = await finalResponse.json()
    const finalBookmarks = finalResult.bookmarks || []
    const finalBookmark = finalBookmarks.find(b => b.id === bookmarkId)

    if (!finalBookmark) {
      throw new Error(`Final bookmark with ID ${bookmarkId} not found`)
    }

    // Verify all changes persisted
    const expectedTitle = 'Updated Test Bookmark - Data Persistence'
    const expectedCategory = 'Testing Updated'
    const expectedFavorite = true

    if (finalBookmark.title !== expectedTitle) {
      throw new Error(`Title not persisted. Expected: "${expectedTitle}", Got: "${finalBookmark.title}"`)
    }

    if (finalBookmark.category !== expectedCategory) {
      throw new Error(`Category not persisted. Expected: "${expectedCategory}", Got: "${finalBookmark.category}"`)
    }

    if (!finalBookmark.isFavorite) {
      throw new Error(`Favorite status not persisted. Expected: true, Got: ${finalBookmark.isFavorite}`)
    }

    console.log('✅ All changes persisted correctly!')
    console.log('📊 Final bookmark state:', {
      id: finalBookmark.id,
      title: finalBookmark.title,
      category: finalBookmark.category,
      isFavorite: finalBookmark.isFavorite,
      tags: finalBookmark.tags
    })

    console.log('\n🎉 All tests passed! Data persistence is working correctly.')
    return true

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    return false
  }
}

// Run the test
if (require.main === module) {
  testBookmarkPersistence()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error)
      process.exit(1)
    })
}

module.exports = { testBookmarkPersistence }
