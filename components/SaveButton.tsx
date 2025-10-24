/* components/SaveButton.tsx
   ───────────────────────────────────────────────────────────────────
   DEV-ONLY: Single-file "Save" button that bypasses Supabase RLS/auth
   using the anon key via API route.
   ⚠️ Restart your dev server after adding these to `.env.local`:
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_ANON_KEY=your_anon_key_here

   Also ensure your table's RLS INSERT policy allows anon writes:
     USING (true)
*/

"use client";

import React, { useState } from 'react';

interface SaveButtonProps {
  table: string;
  payload: Record<string, any>;
  onSuccess?: () => void;
}

const SaveButton: React.FC<SaveButtonProps> = ({ table, payload, onSuccess }) => {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    
    try {
      console.log('=== SAVE API CALL START ===');
      console.log('Table:', table);
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ table, payload }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save data');
      }
      
      console.log('Save successful:', result);
      onSuccess?.();
      alert('✔️ Saved successfully!');
      
    } catch (err: any) {
      console.error('Save failed:', err);
      alert(`❌ Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={saving}
      className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
    >
      {saving ? 'Saving...' : 'Save'}
    </button>
  );
};

export default SaveButton; 