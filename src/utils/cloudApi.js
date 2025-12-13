
const APP_NAME = 'rawgraphs';
const BUCKET_NAME = 'user_projects';

// Helper to get a configured Supabase client and the current user
// We perform a hybrid approach:
// 1. Get the Session/User from the existing Global Instance (managed by dataviz-auth-client.js)
// 2. Create a fresh Client using the Library Factory (window.Supabase) to ensure clean headers/keys for DB access
async function getSupabaseAndUser() {
    // 1. Get Session from the Auth Client (Global Instance)
    const globalAuthClient = window.supabase;
    if (!globalAuthClient || !globalAuthClient.auth) {
        throw new Error("認証クライアントが読み込まれていません。ページをリロードしてください。");
    }

    const { data: { session }, error: sessionError } = await globalAuthClient.auth.getSession();
    if (sessionError || !session || !session.user) {
        console.warn("Session check failed:", sessionError);
        throw new Error("ログインしてください。");
    }

    // 2. Prepare Configuration
    // Use Access Token from the active session
    const accessToken = session.access_token;

    // Use Env Vars if available, otherwise fallback to the key found in the global instance (if any)
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://vebhoeiltxspsurqoxvl.supabase.co';
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || globalAuthClient.supabaseKey;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase Configuration Missing (URL or Key). Please check .env or deployment settings.");
    }

    // 3. Create a clean Client using the Library Factory
    // window.Supabase was set in index.html to backup the library before overwrite
    const SupabaseFactory = window.Supabase;

    if (!SupabaseFactory || !SupabaseFactory.createClient) {
        throw new Error("Supabase Library Factory not found. Check index.html loading order.");
    }

    if (!supabaseKey) {
        console.error("Supabase Key is undefined! Check .env or globalAuthClient.");
    }

    const client = SupabaseFactory.createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false, // We manage valid token manually via headers
            autoRefreshToken: false,
        },
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                apikey: supabaseKey
            }
        }
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
