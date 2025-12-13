const APP_NAME = 'rawgraphs';
const BUCKET_NAME = 'user_projects';

// Helper to get a configured Supabase client and the current user
async function getSupabaseAndUser() {
    // 1. Get the Global Instance
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
    // Use the key found in the global client (which we confirmed is correct in logs) or fallback
    const DEFAULT_URL = "https://vebhoeiltxspsurqoxvl.supabase.co";
    const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYmhvZWlsdHhzcHN1cnFveHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAyMjI2MTIsImV4cCI6MjA0NTc5ODYxMn0.sV-Xf6wP_m46D_q-XN0oZfK9NogDqD9xV5sS-n6J8c4";

    // Priority: Env Var > Global Client Key > Hardcoded Default
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || DEFAULT_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || globalAuthClient.supabaseKey || DEFAULT_KEY;

    // 4. Create a fresh Client using the Library Factory
    // This is necessary because globalAuthClient.rest.headers was found to be empty in logs.
    const SupabaseLibrary = window.Supabase;

    if (!SupabaseLibrary || !SupabaseLibrary.createClient) {
        console.error("Supabase Library Factory not found. Falling back to global instance (likely to fail).");
        return { supabase: globalAuthClient, user: session.user };
    }

    // Create a client specifically for this request with explicit headers
    const client = SupabaseLibrary.createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false, // Session is managed by global client
        },
        global: {
            headers: {
                // Authorization: `Bearer ${session.access_token}`, // TEMPORARILY DISABLED: Testing if token is invalid causing 401
                apikey: supabaseKey
            }
        }
    });

    // DEBUG: Verify if the new client actually has the headers we set
    console.log('[Debug] Created Local Client:', {
        url: supabaseUrl,
        keyLength: supabaseKey?.length,
        headers: client.rest?.headers, // Check if 'apikey' is present here
        globalHeaders: client.global?.headers // Check global config
    });

    return { supabase: client, user: session.user };
}

export async function getProjects() {
    console.log('Fetching projects from Supabase...');
    const { supabase } = await getSupabaseAndUser();

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('app_name', APP_NAME)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Supabase getProjects error:', JSON.stringify(error));
        throw new Error('プロジェクト一覧の取得に失敗しました: ' + (error.message || error.code));
    }

    return data;
}

export async function saveProject(projectData, name) {
    console.log('Saving project to Supabase:', name);
    const { supabase, user } = await getSupabaseAndUser();

    // 1. Create/Update DB Record
    const { data: dbData, error: dbError } = await supabase
        .from('projects')
        .insert([
            {
                user_id: user.id,
                name: name,
                app_name: APP_NAME
            }
        ])
        .select();

    if (dbError) {
        console.error('Supabase db insert error:', JSON.stringify(dbError));
        throw new Error('データベースへの保存に失敗しました: ' + dbError.message);
    }

    const project = dbData[0];
    const projectId = project.id;
    console.log('Project created with ID:', projectId);

    // 2. Upload to Storage
    const filePath = `${user.id}/${projectId}.json`;
    const blob = new Blob([JSON.stringify(projectData)], { type: 'application/json' });

    const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, blob, {
            upsert: true,
            contentType: 'application/json'
        });

    if (storageError) {
        console.error('Supabase storage upload error:', JSON.stringify(storageError));
        throw new Error('ファイルのアップロードに失敗しました: ' + storageError.message);
    }

    return project;
}

export async function loadProject(id) {
    console.log('Loading project from Supabase:', id);
    const { supabase, user } = await getSupabaseAndUser();

    const filePath = `${user.id}/${id}.json`;

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(filePath);

    if (error) {
        console.error('Supabase storage download error:', JSON.stringify(error));
        throw new Error('プロジェクトデータのダウンロードに失敗しました: ' + error.message);
    }

    const text = await data.text();
    try {
        const json = JSON.parse(text);
        return json;
    } catch (e) {
        console.error('JSON parse error:', e);
        throw new Error('プロジェクトデータの形式が不正です。');
    }
}

export async function deleteProject(id) {
    console.log('Deleting project:', id);
    const { supabase, user } = await getSupabaseAndUser();

    // 1. Delete from DB
    const { error: dbError } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

    if (dbError) {
        console.error('Supabase delete error:', JSON.stringify(dbError));
        throw new Error('プロジェクトの削除に失敗しました: ' + dbError.message);
    }

    // 2. Cleanup Storage
    const filePath = `${user.id}/${id}.json`;
    const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

    if (storageError) {
        console.warn('Storage cleanup failed (non-fatal):', storageError);
    }

    return true;
}
