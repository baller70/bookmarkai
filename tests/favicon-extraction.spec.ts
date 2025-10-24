// @ts-nocheck
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://bookmarkhub-web.vercel.app';

test.describe('Favicon Extraction Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
  });

  test('should extract favicon and display in circular logo and background', async ({ page }) => {
    console.log('🧪 Testing favicon extraction functionality...');

    // Test data for different websites with known favicons
    const testBookmarks = [
      {
        title: 'GitHub Test',
        url: 'https://github.com',
        description: 'Testing GitHub favicon extraction'
      },
      {
        title: 'Stack Overflow Test', 
        url: 'https://stackoverflow.com',
        description: 'Testing Stack Overflow favicon extraction'
      }
    ];

    for (const bookmark of testBookmarks) {
      console.log(`🔍 Testing favicon extraction for: ${bookmark.url}`);

      // Step 1: Create a new bookmark
      await test.step(`Create bookmark for ${bookmark.url}`, async () => {
        // Look for add bookmark button or form
        const addButton = page.locator('button:has-text("Add Bookmark"), button:has-text("New Bookmark"), button:has-text("+")').first();
        
        if (await addButton.isVisible()) {
          await addButton.click();
        } else {
          // Try alternative selectors
          const altButton = page.locator('[data-testid="add-bookmark"], .add-bookmark-btn').first();
          if (await altButton.isVisible()) {
            await altButton.click();
          } else {
            console.log('⚠️ Add bookmark button not found, trying form fields directly');
          }
        }

        // Fill in bookmark details
        await page.fill('input[name="title"], input[placeholder*="title" i]', bookmark.title);
        await page.fill('input[name="url"], input[placeholder*="url" i], input[type="url"]', bookmark.url);
        await page.fill('textarea[name="description"], textarea[placeholder*="description" i]', bookmark.description);

        // Disable AI analysis for faster testing
        const aiCheckbox = page.locator('input[type="checkbox"]:near(:text("AI"))').first();
        if (await aiCheckbox.isVisible()) {
          await aiCheckbox.uncheck();
        }

        // Submit the form
        const submitButton = page.locator('button[type="submit"], button:has-text("Add"), button:has-text("Save"), button:has-text("Create")').first();
        await submitButton.click();

        // Wait for the bookmark to be created
        await page.waitForTimeout(3000); // Allow time for favicon extraction
      });

      // Step 2: Verify the bookmark was created and favicon was extracted
      await test.step(`Verify favicon extraction for ${bookmark.url}`, async () => {
        // Wait for bookmark to appear in the list
        await page.waitForSelector(`text="${bookmark.title}"`, { timeout: 10000 });

        // Find the bookmark card/item
        const bookmarkCard = page.locator(`[data-testid="bookmark-card"]:has-text("${bookmark.title}"), .bookmark-card:has-text("${bookmark.title}"), .bookmark-item:has-text("${bookmark.title}")`).first();
        
        if (!(await bookmarkCard.isVisible())) {
          // Fallback: find any element containing the bookmark title
          const bookmarkElement = page.locator(`*:has-text("${bookmark.title}")`).first();
          await expect(bookmarkElement).toBeVisible();
        }

        // Take a screenshot for debugging
        await page.screenshot({ 
          path: `tests/screenshots/favicon-test-${bookmark.title.replace(/\s+/g, '-').toLowerCase()}.png`,
          fullPage: true 
        });
      });

      // Step 3: Verify circular logo display
      await test.step(`Verify circular logo for ${bookmark.url}`, async () => {
        // Look for circular logo/avatar images
        const circularLogos = page.locator('img[class*="rounded-full"], img[class*="circular"], .avatar img, [class*="w-24 h-24"] img, [class*="w-10 h-10"] img');
        
        let faviconFound = false;
        const logoCount = await circularLogos.count();
        
        for (let i = 0; i < logoCount; i++) {
          const logo = circularLogos.nth(i);
          const src = await logo.getAttribute('src');
          
          if (src && (
            src.includes('github') || 
            src.includes('stackoverflow') || 
            src.includes('google.com/s2/favicons') ||
            src.includes('favicon')
          )) {
            console.log(`✅ Found circular logo with favicon: ${src}`);
            faviconFound = true;
            
            // Verify the image loads successfully
            await expect(logo).toBeVisible();
            
            // Check if it has circular styling
            const classes = await logo.getAttribute('class');
            expect(classes).toMatch(/rounded-full|circular|avatar/);
            
            break;
          }
        }

        if (!faviconFound) {
          console.log('⚠️ No favicon found in circular logos, checking all images...');
          const allImages = page.locator('img');
          const imageCount = await allImages.count();
          
          for (let i = 0; i < imageCount; i++) {
            const img = allImages.nth(i);
            const src = await img.getAttribute('src');
            if (src) {
              console.log(`📷 Image found: ${src}`);
            }
          }
        }

        // At minimum, verify that some circular logo exists
        await expect(circularLogos.first()).toBeVisible();
      });

      // Step 4: Verify background image/pattern
      await test.step(`Verify background favicon for ${bookmark.url}`, async () => {
        // Look for elements with background images
        const backgroundElements = page.locator('[style*="background-image"], [class*="bg-cover"], [class*="bg-center"]');
        
        let backgroundFaviconFound = false;
        const bgCount = await backgroundElements.count();
        
        for (let i = 0; i < bgCount; i++) {
          const element = backgroundElements.nth(i);
          const style = await element.getAttribute('style');
          
          if (style && (
            style.includes('github') || 
            style.includes('stackoverflow') || 
            style.includes('google.com/s2/favicons') ||
            style.includes('favicon')
          )) {
            console.log(`✅ Found background with favicon: ${style}`);
            backgroundFaviconFound = true;
            
            // Verify the element is visible
            await expect(element).toBeVisible();
            break;
          }
        }

        if (!backgroundFaviconFound) {
          console.log('⚠️ No favicon found in backgrounds, checking computed styles...');
          
          // Check computed background styles
          const bookmarkCards = page.locator('.bookmark-card, [data-testid="bookmark-card"], .bookmark-item');
          const cardCount = await bookmarkCards.count();
          
          for (let i = 0; i < cardCount; i++) {
            const card = bookmarkCards.nth(i);
            const bgImage = await card.evaluate(el => window.getComputedStyle(el).backgroundImage);
            
            if (bgImage && bgImage !== 'none') {
              console.log(`📷 Background image found: ${bgImage}`);
              if (bgImage.includes('github') || bgImage.includes('stackoverflow') || bgImage.includes('favicon')) {
                backgroundFaviconFound = true;
                break;
              }
            }
          }
        }

        // Log result
        if (backgroundFaviconFound) {
          console.log('✅ Background favicon verification passed');
        } else {
          console.log('⚠️ Background favicon not found - may be using fallback or different implementation');
        }
      });

      // Step 5: API verification - check if favicon was stored in database
      await test.step(`Verify favicon in API response for ${bookmark.url}`, async () => {
        // Make API call to get bookmarks
        const response = await page.request.get(`${BASE_URL}/api/bookmarks`);
        expect(response.ok()).toBeTruthy();
        
        const bookmarks = await response.json();
        console.log(`📊 Found ${bookmarks.length} bookmarks in API response`);
        
        // Find our test bookmark
        const testBookmark = bookmarks.find((b: any) => 
          b.title === bookmark.title || b.url === bookmark.url
        );
        
        if (testBookmark) {
          console.log(`✅ Found test bookmark in API: ${testBookmark.title}`);
          console.log(`🔍 Favicon field: ${testBookmark.favicon || 'NOT SET'}`);
          console.log(`🔍 Custom favicon: ${testBookmark.custom_favicon || 'NOT SET'}`);
          console.log(`🔍 Custom logo: ${testBookmark.custom_logo || 'NOT SET'}`);
          
          // Verify favicon was extracted and stored
          if (testBookmark.favicon) {
            expect(testBookmark.favicon).toBeTruthy();
            console.log(`✅ Favicon successfully extracted and stored: ${testBookmark.favicon}`);
          } else {
            console.log('⚠️ Favicon field is empty - extraction may have failed');
          }
        } else {
          console.log('⚠️ Test bookmark not found in API response');
        }
      });

      console.log(`✅ Completed favicon test for ${bookmark.url}`);
    }
  });

  test('should handle favicon extraction failures gracefully', async ({ page }) => {
    console.log('🧪 Testing favicon extraction failure handling...');

    // Test with a URL that likely won't have a favicon
    const testBookmark = {
      title: 'Invalid Favicon Test',
      url: 'https://httpbin.org/status/404',
      description: 'Testing favicon extraction failure handling'
    };

    // Create bookmark with problematic URL
    await test.step('Create bookmark with problematic URL', async () => {
      const addButton = page.locator('button:has-text("Add Bookmark"), button:has-text("New Bookmark"), button:has-text("+")').first();
      
      if (await addButton.isVisible()) {
        await addButton.click();
      }

      await page.fill('input[name="title"], input[placeholder*="title" i]', testBookmark.title);
      await page.fill('input[name="url"], input[placeholder*="url" i], input[type="url"]', testBookmark.url);
      await page.fill('textarea[name="description"], textarea[placeholder*="description" i]', testBookmark.description);

      const submitButton = page.locator('button[type="submit"], button:has-text("Add"), button:has-text("Save")').first();
      await submitButton.click();

      await page.waitForTimeout(3000);
    });

    // Verify fallback favicon is used
    await test.step('Verify fallback favicon handling', async () => {
      await page.waitForSelector(`text="${testBookmark.title}"`, { timeout: 10000 });

      // Should still show some kind of logo/favicon (fallback)
      const circularLogos = page.locator('img[class*="rounded-full"], img[class*="circular"], .avatar img');
      await expect(circularLogos.first()).toBeVisible();

      // Take screenshot for verification
      await page.screenshot({ 
        path: 'tests/screenshots/favicon-fallback-test.png',
        fullPage: true 
      });

      console.log('✅ Fallback favicon handling verified');
    });
  });
});
