# Phase 3: Systematic Migration - Cleanup Plan

## Remaining TypeScript Errors to Fix

### 1. File Upload/Storage Issues
**Files:**
- `app/api/bookmarks/upload/route.ts` (lines 65, 299, 513)

**Issue:** Using Supabase storage methods (upload, remove) that are now stubs
**Solution:** Replace with file system storage or cloud storage service

### 2. Auth Component Issues  
**Files:**
- `components/Auth.tsx` (lines 3, 4)
- `components/auth/AuthForm.tsx` (line 34)

**Issue:** Using Supabase Auth UI components and methods
**Solution:** Replace with NextAuth UI components or remove unused files

### 3. Strategy
1. Fix file upload/storage to use file system
2. Remove or stub unused Auth components
3. Verify build succeeds
4. Save checkpoint

Let's begin!
