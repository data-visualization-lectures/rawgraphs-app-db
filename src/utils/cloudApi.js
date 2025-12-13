const APP_NAME = 'rawgraphs';
const BUCKET_NAME = 'user_projects';

// Helper to get a configured Supabase client and the current user
async function getSupabaseAndUser() {
    // 1. Get the Global Instance (managed by dataviz-auth-client.js)
    const globalAuthClient = window.supabase;
    if (!globalAuthClient || !globalAuthClient.auth) {
        throw new Error("認証クライアントが読み込まれていません。ページをリロードしてください。");
    }

    // DEBUG: Inspect the headers and keys of the global client
    console.log('[Debug] Global Client Keys:', {
        supabaseKey: globalAuthClient.supabaseKey,
        headers: globalAuthClient.rest?.headers, // headers might be in rest client or global config
        authHeaders: globalAuthClient.auth?.headers
    });

    // 2. Verify Session
    const { data: { session }, error: sessionError } = await globalAuthClient.auth.getSession();
    if (sessionError || !session || !session.user) {
        console.warn("Session check failed:", sessionError);
        throw new Error("ログインしてください。");
    }

    // 3. Return the global client directly
    return { supabase: globalAuthClient, user: session.user };
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
