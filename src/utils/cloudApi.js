const API_BASE = 'https://api.dataviz.jp/api';
const APP_NAME = 'rawgraphs';

// Helper to get Auth Token
async function getAuthToken() {
    const globalAuthClient = window.datavizSupabase || window.supabase;
    if (!globalAuthClient || !globalAuthClient.auth) {
        throw new Error("認証クライアントが読み込まれていません。");
    }
    const { data: { session }, error } = await globalAuthClient.auth.getSession();
    if (error || !session || !session.access_token) {
        throw new Error("ログインしてください。");
    }
    return session.access_token;
}

// Helper for API requests
async function fetchApi(endpoint, options = {}) {
    const token = await getAuthToken();

    // Merge headers
    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        let errorMsg = `API Error ${response.status}`;
        try {
            const errorBody = await response.json();
            if (errorBody.detail) errorMsg += `: ${errorBody.detail}`;
            else if (errorBody.error) errorMsg += `: ${errorBody.error}`;
        } catch (e) {
            // fallback if not JSON
            const text = await response.text();
            if (text) errorMsg += `: ${text}`;
        }
        throw new Error(errorMsg);
    }

    return response;
}

// Convert Blob to Base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export async function getProjects() {
    console.log("Fetching projects via API...");
    try {
        const response = await fetchApi(`/projects?app=${APP_NAME}`, {
            method: 'GET'
        });
        const data = await response.json();
        return data.projects || [];
    } catch (error) {
        console.error("getProjects error:", error);
        throw error;
    }
}

export async function saveProject(projectData, projectName, thumbnailBlob = null) {
    console.log("Saving project via API...");
    try {
        let thumbnailBase64 = null;
        if (thumbnailBlob) {
            thumbnailBase64 = await blobToBase64(thumbnailBlob);
        }

        const payload = {
            name: projectName || projectData.name || 'Untitled Project',
            app_name: APP_NAME,
            data: projectData,
            thumbnail: thumbnailBase64
        };

        // If ID exists on the project data (and we are ostensibly updating, but 'saveProject' implies new or overwrite)
        // However, the UI distinguishes Save (New) vs Update.
        // If this function is called for a NEW project, it won't have an ID usually, or we should ignore it if we want a new record?
        // But wait, standard RAWGraphs behavior might just pass the whole object.
        // Let's assume saveProject is for Creating New.
        // If we want to support 'Upsert' logic similar to previous implementation, we need to check if we should correct to updateProject.
        // But typically the caller decides. safely mapping to POST for now.

        const response = await fetchApi('/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        return data.project;

    } catch (error) {
        console.error("saveProject error:", error);
        throw error;
    }
}

export async function updateProject(projectId, projectData, projectName, thumbnailBlob = null) {
    console.log("Updating project via API...", projectId);
    try {
        let thumbnailBase64 = undefined; // undefined means "do not update"
        if (thumbnailBlob) {
            thumbnailBase64 = await blobToBase64(thumbnailBlob);
        }

        const payload = {
            name: projectName,
            data: projectData,
            thumbnail: thumbnailBase64
        };

        const response = await fetchApi(`/projects/${projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        return data.project;

    } catch (error) {
        console.error("updateProject error:", error);
        throw error;
    }
}

export async function deleteProject(projectId) {
    console.log("Deleting project via API...", projectId);
    try {
        await fetchApi(`/projects/${projectId}`, {
            method: 'DELETE'
        });
        return true;
    } catch (error) {
        console.error("deleteProject error:", error);
        throw error;
    }
}

export async function loadProject(projectId) {
    console.log("Loading project via API...", projectId);
    try {
        const response = await fetchApi(`/projects/${projectId}`, {
            method: 'GET'
        });
        // The API returns the JSON data body directly
        const json = await response.json();
        return json;
    } catch (error) {
        console.error("loadProject error:", error);
        throw error;
    }
}

export async function loadThumbnail(projectId) {
    console.log("Loading thumbnail via API...", projectId);
    if (!projectId) return null;

    try {
        // We use fetchApi to handle Auth, but we need the BLOB, not JSON.
        const response = await fetchApi(`/projects/${projectId}/thumbnail`, {
            method: 'GET'
        });

        const blob = await response.blob();
        return URL.createObjectURL(blob);

    } catch (err) {
        console.warn("loadThumbnail error:", err);
        return null;
    }
}

export async function checkUserSession() {
    try {
        const globalAuthClient = window.datavizSupabase || window.supabase;
        if (!globalAuthClient || !globalAuthClient.auth) return null;
        const { data } = await globalAuthClient.auth.getSession();
        return data.session?.user || null;
    } catch {
        return null;
    }
}


