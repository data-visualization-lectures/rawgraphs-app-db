
// const API_BASE_URL = 'https://api.dataviz.jp/api/projects';
// For local development, you might want to switch this:
// const API_BASE_URL = 'http://localhost:3000/api/projects';

function getAuthHeader() {
    const session = window.supabase?.auth?.session();
    if (!session?.access_token) {
        return null;
    }
    return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
    };
}

export async function getProjects() {
    // Mock implementation until backend is ready
    console.log('Fetching projects...');
    const headers = getAuthHeader();
    if (!headers) {
        return Promise.reject(new Error('User not logged in'));
    }

    // Real implementation would be:
    // const res = await fetch(`${API_BASE_URL}?app=rawgraphs`, { headers });
    // if (!res.ok) throw new Error(res.statusText);
    // return res.json();

    // Mock Data
    return Promise.resolve([
        {
            id: 'mock-1',
            name: '売上分析2025 (Mock)',
            updated_at: new Date().toISOString(),
        },
        {
            id: 'mock-2',
            name: 'テストプロジェクト (Mock)',
            updated_at: new Date(Date.now() - 86400000).toISOString(),
        }
    ]);
}

export async function saveProject(projectData, name) {
    console.log('Saving project:', name, projectData);
    const headers = getAuthHeader();
    if (!headers) {
        return Promise.reject(new Error('User not logged in'));
    }

    // Real implementation:
    // const res = await fetch(API_BASE_URL, {
    //   method: 'POST',
    //   headers,
    //   body: JSON.stringify({
    //     name,
    //     app_name: 'rawgraphs',
    //     data: projectData
    //   })
    // });
    // if (!res.ok) throw new Error(res.statusText);
    // return res.json();

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ id: 'new-mock-id', name, updated_at: new Date().toISOString() });
        }, 1000);
    });
}

export async function loadProject(id) {
    console.log('Loading project:', id);
    const headers = getAuthHeader();
    if (!headers) {
        return Promise.reject(new Error('User not logged in'));
    }

    // Real implementation:
    // const res = await fetch(`${API_BASE_URL}/${id}`, { headers });
    // if (!res.ok) throw new Error(res.statusText);
    // return res.json();

    // Return dummy project structure (empty for now, just to test flow)
    // In reality this should be the full JSON structure
    return Promise.resolve({});
}

export async function deleteProject(id) {
    console.log('Deleting project:', id);
    // Mock
    return Promise.resolve(true);
}
