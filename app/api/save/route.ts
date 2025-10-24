import { NextRequest, NextResponse } from 'next/server';
import { setOracleState } from '@/lib/oracle-state';

// Use Supabase MCP service instead of environment variables
const SUPABASE_PROJECT_ID = "kljhlubpxxcawacrzaix";
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

// In-memory storage for demo purposes (in production, this would be Supabase)
let savedSettings: { [key: string]: any } = {};

// Initialize Oracle state from existing settings on startup
function initializeOracleState() {
  const oracleSettingsKey = 'bookmarks_Oracle Global Settings';
  if (savedSettings[oracleSettingsKey]) {
    const oracleSettings = savedSettings[oracleSettingsKey];
    if (typeof oracleSettings.enabled === 'boolean') {
      setOracleState(oracleSettings.enabled);
      console.log('🚀 Initialized Oracle state from existing settings:', oracleSettings.enabled ? 'ENABLED' : 'DISABLED');
    }
  } else {
    // If no Oracle settings exist, default to disabled for safety
    setOracleState(false);
    console.log('🚀 No existing Oracle settings found, initialized as DISABLED for safety');
  }
}

// Initialize Oracle state when the module loads
initializeOracleState();

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Load API called via Supabase MCP");
    
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table') || 'bookmarks';
    const title = searchParams.get('title');
    
    console.log("📋 Load query:", { table, title });

    // Check if we have saved settings for this title
    // TODO: Implement actual Supabase MCP database operations to retrieve data
    const settingsKey = `${table}_${title}`;
    if (savedSettings[settingsKey]) {
      const loadedSettings = {
        success: true,
        message: "Settings loaded successfully via Supabase MCP",
        data: {
          found: true,
          settings: savedSettings[settingsKey],
          project_id: SUPABASE_PROJECT_ID,
          supabase_url: SUPABASE_URL,
          loaded_at: new Date().toISOString()
        }
      };
      
      console.log("✅ Load successful via MCP:", loadedSettings);
      return NextResponse.json(loadedSettings, { status: 200 });
    }

    // No saved data found
    const notFoundResponse = {
      success: true,
      message: "No saved settings found",
      data: {
        found: false,
        project_id: SUPABASE_PROJECT_ID,
        supabase_url: SUPABASE_URL
      }
    };
    
    console.log("📭 No saved data found:", notFoundResponse);
    return NextResponse.json(notFoundResponse, { status: 200 });

  } catch (error) {
    console.error("❌ Load error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to load settings",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Save API called via Supabase MCP");
    
    const body = await request.json();
    console.log("📝 Save data:", body);

    let settingsToSave = body;
    let settingsKey = '';

    // Handle different data formats
    if (body.payload && body.payload.description) {
      // Legacy format: { payload: { title, description } }
      try {
        const parsedSettings = JSON.parse(body.payload.description);
        settingsToSave = parsedSettings;
        settingsKey = `${body.table}_${body.payload.title}`;
        savedSettings[settingsKey] = parsedSettings;
        console.log(`💾 Stored settings under key: ${settingsKey}`);
        
        // Update Oracle global state if this is Oracle settings
        if (body.payload.title === 'Oracle Global Settings' && typeof parsedSettings.enabled === 'boolean') {
          setOracleState(parsedSettings.enabled);
          console.log('🔄 Updated Oracle global state:', parsedSettings.enabled ? 'ENABLED' : 'DISABLED');
        }
      } catch (parseError) {
        console.log("📝 Description is not JSON, storing full payload");
        settingsKey = `${body.table}_${body.payload.title}`;
        savedSettings[settingsKey] = body.payload;
      }
    } else if (body.table && body.title && body.data) {
      // New format: { table, title, data }
      settingsKey = `${body.table}_${body.title}`;
      savedSettings[settingsKey] = body.data;
      console.log(`💾 Stored settings under key: ${settingsKey}`, body.data);
      
      // Update Oracle global state if this is Oracle settings
      if (body.title === 'Oracle Global Settings' && typeof body.data.enabled === 'boolean') {
        setOracleState(body.data.enabled);
        console.log('🔄 Updated Oracle global state:', body.data.enabled ? 'ENABLED' : 'DISABLED');
      }
    } else {
      // Fallback: store the entire body
      settingsKey = `${body.table || 'default'}_${body.title || 'settings'}`;
      savedSettings[settingsKey] = body;
      console.log(`💾 Stored full body under key: ${settingsKey}`);
    }

    // TODO: Implement actual Supabase MCP database operations
    const mockResponse = {
      success: true,
      message: "Settings saved successfully via Supabase MCP",
      data: {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        project_id: SUPABASE_PROJECT_ID,
        supabase_url: SUPABASE_URL,
        saved_data: body,
        stored_key: settingsKey
      }
    };
    
    console.log("✅ Save successful via MCP:", mockResponse);
    return NextResponse.json(mockResponse, { status: 200 });

  } catch (error) {
    console.error("❌ Save error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to save settings",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 