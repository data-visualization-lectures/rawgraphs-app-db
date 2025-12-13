const APP_NAME = 'rawgraphs';
const BUCKET_NAME = 'user_projects'; // This might become obsolete if data is stored directly in DB

// Helper to get configuration and session purely for Raw Fetch
async function getSupabaseConfig() {
    // 1. Get the Global Instance (managed by dataviz-auth-client.js)
    const globalAuthClient = window.supabase;
    if (!globalAuthClient || !globalAuthClient.auth) {
        throw new Error("認証クライアントが読み込まれていません。ページをリロードしてください。");
    }

    // 2. Verify Session
    const { data: { session }, error: sessionError } = await globalAuthClient.auth.getSession();
    if (sessionError || !session || !session.user) {
        console.warn("Session check failed:", sessionError);
        throw new Error("ログインしてください。");
    }

    // 3. Prepare Configuration
    const DEFAULT_URL = "https://vebhoeiltxspsurqoxvl.supabase.co";
    // Need explicit key for query param usage
    const globalKey = globalAuthClient.supabaseKey;
    const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYmhvZWlsdHhzcHN1cnFveHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAyMjI2MTIsImV4cCI6MjA0NTc5ODYxMn0.sV-Xf6wP_m46D_q-XN0oZfK9NogDqD9xV5sS-n6J8c4";

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || DEFAULT_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || globalKey || DEFAULT_KEY;

    if (!supabaseKey) {
        throw new Error("Supabase API Key is missing.");
    }

    return {
        supabaseUrl,
        supabaseKey: supabaseKey.trim(),
        accessToken: session.access_token,
        user: session.user
    };
}

export async function getProjects() {
    console.log("Fetching projects via Raw Fetch...");
    try {
        const { supabaseUrl, supabaseKey, accessToken } = await getSupabaseConfig();

        // Construct URL with API Key in query param to bypass header stripping
        const endpoint = `${supabaseUrl}/rest/v1/projects?select=id,name,created_at,updated_at&app_name=eq.${APP_NAME}&order=updated_at.desc&apikey=${supabaseKey}`;

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                // Also send in header (standard), though query param is the fix
                'apikey': supabaseKey,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Supabase getProjects error:", errorBody);
            throw new Error(`Server responded with ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("getProjects exception:", error);
        throw error;
    }
}

export async function saveProject(projectData) {
    console.log("Saving project via Raw Fetch...");
    try {
        const { supabaseUrl, supabaseKey, accessToken, user } = await getSupabaseConfig();

        // Use native crypto.randomUUID()
        const id = projectData.id || crypto.randomUUID();
        const now = new Date().toISOString();

        const payload = {
            id,
            user_id: user.id,
            name: projectData.name,
            data: projectData, // The JSON data
            app_name: APP_NAME,
            created_at: projectData.created_at || now,
            updated_at: now
        };

        // Check if exists updates or insert? 
        // PostgREST "upsert" is typically POST with Prefer: resolution=merge-duplicates OR PUT (if pk known).
        // For simplicity with Raw Fetch, we'll try POST with upsert header.

        const endpoint = `${supabaseUrl}/rest/v1/projects?apikey=${supabaseKey}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=representation' // Upsert behavior
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Supabase saveProject error:", errorBody);
            throw new Error(`Server responded with ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        // data is array of inserted rows
        return data && data.length > 0 ? data[0] : null;

    } catch (error) {
        console.error("saveProject exception:", error);
        throw error;
    }
}

export async function updateProject(projectId, projectData) {
    // Alias for saveProject since we use upsert
    return saveProject({ ...projectData, id: projectId });
}

export async function deleteProject(projectId) {
    console.log("Deleting project via Raw Fetch...", projectId);
    try {
        const { supabaseUrl, supabaseKey, accessToken } = await getSupabaseConfig();

        const endpoint = `${supabaseUrl}/rest/v1/projects?id=eq.${projectId}&apikey=${supabaseKey}`;

        const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Supabase deleteProject error:", errorBody);
            throw new Error(`Server responded with ${response.status}: ${errorBody}`);
        }

        return true;

    } catch (error) {
        console.error("deleteProject exception:", error);
        throw error;
    }
}

export async function checkUserSession() {
    // Only verify session existence
    try {
        const globalAuthClient = window.supabase;
        if (!globalAuthClient) return null;
        const { data } = await globalAuthClient.auth.getSession();
        return data.session?.user || null;
    } catch {
        return null;
    }
}

export async function loadProject(projectId) {
    console.log("Loading project via Raw Fetch...", projectId);
    try {
        const { supabaseUrl, supabaseKey, accessToken } = await getSupabaseConfig();

        // Fetch specifically the 'data' column
        const endpoint = `${supabaseUrl}/rest/v1/projects?select=data&id=eq.${projectId}&apikey=${supabaseKey}`;

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.pgrst.object+json' // Expect single object
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Supabase loadProject error:", errorBody);
            throw new Error(`Server responded with ${response.status}: ${errorBody}`);
        }

        const record = await response.json();
        // The project data is stored in the 'data' JSONB column
        // .select('data') returns { data: {...} }
        return record.data;

    } catch (error) {
        console.error("loadProject exception:", error);
        throw error;
    }
}
