
const APP_NAME = 'rawgraphs';
const BUCKET_NAME = 'user_projects';

// Helper to get client and session
async function getSupabaseAndUser() {
    const supabase = window.supabase;
    if (!supabase) {
        throw new Error("認証クライアントが読み込まれていません。ページをリロードしてください。");
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) {
        // If getting session fails, try older v1 method just in case or throw
        // But since dataviz-auth-client uses getSession, we assume v2.
        throw new Error("ログインしてください。");
    }

    return { supabase, user: session.user };
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
        console.error('Supabase getProjects error:', error);
        throw new Error('プロジェクト一覧の取得に失敗しました: ' + error.message);
    }

    return data;
}

export async function saveProject(projectData, name) {
    console.log('Saving project to Supabase:', name);
    const { supabase, user } = await getSupabaseAndUser();

    // 1. Create (or separate Update logic later) DB Record
    // We use INSERT. CloudSaveModal implies "Save As" / New creation mostly.
    const { data: dbData, error: dbError } = await supabase
        .from('projects')
        .insert([
            {
                user_id: user.id,
                name: name,
                app_name: APP_NAME
            }
        ])
        .select(); // Required in v2 to get returned data

    if (dbError) {
        console.error('Supabase db insert error:', dbError);
        throw new Error('データベースへの保存に失敗しました: ' + dbError.message);
    }

    const project = dbData[0];
    const projectId = project.id;
    console.log('Project created with ID:', projectId);

    // 2. Upload to Storage
    // Path: user_id/project_id.json
    const filePath = `${user.id}/${projectId}.json`;
    // ProjectData is an Object. Convert to JSON string.
    // Using Blob to ensure proper handling
    const blob = new Blob([JSON.stringify(projectData)], { type: 'application/json' });

    const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, blob, {
            upsert: true,
            contentType: 'application/json'
        });

    if (storageError) {
        console.error('Supabase storage upload error:', storageError);
        // Potential: Delete the DB record if storage fails?
        // For now, throw error.
        throw new Error('ファイルのアップロードに失敗しました: ' + storageError.message);
    }

    return project;
}

export async function loadProject(id) {
    console.log('Loading project from Supabase:', id);
    const { supabase, user } = await getSupabaseAndUser();

    // Path: user_id/project_id.json
    const filePath = `${user.id}/${id}.json`;

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(filePath);

    if (error) {
        console.error('Supabase storage download error:', error);
        throw new Error('プロジェクトデータのダウンロードに失敗しました: ' + error.message);
    }

    // data is a Blob. Convert to Text then JSON.
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
        console.error('Supabase delete error:', dbError);
        throw new Error('プロジェクトの削除に失敗しました: ' + dbError.message);
    }

    // 2. Cleanup Storage (Best effort)
    const filePath = `${user.id}/${id}.json`;
    const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

    if (storageError) {
        console.warn('Storage cleanup failed (non-fatal):', storageError);
    }

    return true;
}
