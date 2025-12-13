const APP_NAME = 'rawgraphs';
const BUCKET_NAME = 'user_projects';

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
    // Updated to the correct key verified by direct browser access
    const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYmhvZWlsdHhzcHN1cnFveHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNTY4MjMsImV4cCI6MjA4MDYzMjgyM30.5uf-D07Hb0JxL39X9yQ20P-5gFc1CRMdKWhDySrNZ0E";

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
        const { supabaseUrl, supabaseKey } = await getSupabaseConfig();

        // Construct URL with API Key in query param to bypass header stripping
        const endpoint = `${supabaseUrl}/rest/v1/projects?select=id,name,created_at,updated_at&app_name=eq.${APP_NAME}&order=updated_at.desc&apikey=${supabaseKey}`;

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                // Rely ONLY on query param for DB access (RLS disabled)
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

export async function saveProject(projectData, projectName) {
    console.log("Saving project via Raw Fetch (Storage + DB)...");
    try {
        const { supabaseUrl, supabaseKey, accessToken, user } = await getSupabaseConfig();

        // Use native crypto.randomUUID()
        const id = projectData.id || crypto.randomUUID();
        const now = new Date().toISOString();
        const filePath = `${user.id}/${id}.json`;

        // 1. Upload JSON to Storage
        console.log("Uploading to Storage:", filePath);
        const storageEndpoint = `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${filePath}?apikey=${supabaseKey}`;

        const storageResponse = await fetch(storageEndpoint, {
            method: 'POST',
            headers: {
                // Storage needs Auth
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'x-upsert': 'true' // Allow overwriting
            },
            body: JSON.stringify(projectData)
        });

        if (!storageResponse.ok) {
            const errorBody = await storageResponse.text();
            console.error("Supabase Storage upload error:", errorBody);
            throw new Error(`Storage upload failed with ${storageResponse.status}: ${errorBody}`);
        }

        // 2. Insert/Update Metadata in DB
        console.log("Saving Metadata to DB...");
        const payload = {
            id,
            user_id: user.id,
            name: projectName || projectData.name || 'Untitled Project', // Use provided name
            storage_path: filePath, // Storing path instead of data
            app_name: APP_NAME,
            created_at: projectData.created_at || now,
            updated_at: now
        };

        const dbEndpoint = `${supabaseUrl}/rest/v1/projects?apikey=${supabaseKey}`;

        const dbResponse = await fetch(dbEndpoint, {
            method: 'POST',
            headers: {
                // DB access via Anon Key (RLS disabled)
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify(payload)
        });

        if (!dbResponse.ok) {
            const errorBody = await dbResponse.text();
            console.error("Supabase DB save error:", errorBody);
            throw new Error(`DB save failed with ${dbResponse.status}: ${errorBody}`);
        }

        const data = await dbResponse.json();
        return data && data.length > 0 ? data[0] : null;

    } catch (error) {
        console.error("saveProject exception:", error);
        throw error;
    }
}

export async function updateProject(projectId, projectData, projectName) {
    return saveProject({ ...projectData, id: projectId }, projectName);
}

export async function deleteProject(projectId) {
    console.log("Deleting project via Raw Fetch (DB + Storage)...", projectId);
    try {
        const { supabaseUrl, supabaseKey, accessToken } = await getSupabaseConfig();

        // 1. Get storage_path from DB first (or construct it if standard)
        // Ideally we should fetch the path, but standard naming is {user_id}/{id}.json.
        // Let's try to delete from DB first.

        // We actually need the user_id to construct the path, or fetch the record.
        // Let's fetch the record to be safe.
        const fetchEndpoint = `${supabaseUrl}/rest/v1/projects?select=storage_path&id=eq.${projectId}&apikey=${supabaseKey}`;
        const fetchRes = await fetch(fetchEndpoint, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        let storagePath = null;
        if (fetchRes.ok) {
            const rows = await fetchRes.json();
            if (rows.length > 0) storagePath = rows[0].storage_path;
        }

        // 2. Delete from DB
        const dbEndpoint = `${supabaseUrl}/rest/v1/projects?id=eq.${projectId}&apikey=${supabaseKey}`;
        const dbResponse = await fetch(dbEndpoint, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!dbResponse.ok) {
            throw new Error(`DB delete failed with ${dbResponse.status}`);
        }

        // 3. Delete from Storage if path known
        if (storagePath) {
            console.log("Deleting from Storage:", storagePath);
            const storageEndpoint = `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${storagePath}?apikey=${supabaseKey}`;
            // Storage DELETE usually requires specific format or different endpoint for bulk delete, 
            // but single DELETE is DELETE /object/{bucket}/{wildcard}

            const storageResponse = await fetch(storageEndpoint, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!storageResponse.ok) {
                console.warn("Storage delete failed (non-fatal):", await storageResponse.text());
            }
        }

        return true;

    } catch (error) {
        console.error("deleteProject exception:", error);
        throw error;
    }
}

export async function checkUserSession() {
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
    console.log("Loading project via Raw Fetch (Storage)...", projectId);
    try {
        const { supabaseUrl, supabaseKey, accessToken } = await getSupabaseConfig();

        // 1. Get storage_path from DB
        const dbEndpoint = `${supabaseUrl}/rest/v1/projects?select=storage_path&id=eq.${projectId}&apikey=${supabaseKey}`;
        const dbResponse = await fetch(dbEndpoint, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!dbResponse.ok) {
            throw new Error(`DB load failed with ${dbResponse.status}`);
        }

        const rows = await dbResponse.json();
        if (!rows.length) throw new Error("Project not found in DB");

        const storagePath = rows[0].storage_path;

        // 2. Download from Storage
        // Use GET /storage/v1/object/{bucket}/{path} for public, but for private we need Auth.
        // For private download, the endpoint is same but with Auth header.

        const storageEndpoint = `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${storagePath}?apikey=${supabaseKey}`;

        const storageResponse = await fetch(storageEndpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!storageResponse.ok) {
            const errorBody = await storageResponse.text();
            console.error("Supabase loadProject storage error:", errorBody);
            throw new Error(`Storage download failed with ${storageResponse.status}: ${errorBody}`);
        }

        const json = await storageResponse.json();
        return json;

    } catch (error) {
        console.error("loadProject exception:", error);
        throw error;
    }
}
