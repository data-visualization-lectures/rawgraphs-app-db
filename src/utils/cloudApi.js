import paraData from '../sample_projects/para.json';
import treeData from '../sample_projects/tree.json';

// const API_BASE_URL = 'https://api.dataviz.jp/api/projects';
// For local development, you might want to switch this:
// const API_BASE_URL = 'http://localhost:3000/api/projects';

function getAuthHeader() {
    // Mock: Always succeed authentication check
    return { 'X-Mock-Auth': 'true' };
    /*
      const session = window.supabase?.auth?.session();
      if (!session?.access_token) {
        return null;
      }
      return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };
    */
}

export async function getProjects() {
    // Mock implementation until backend is ready
    console.log('Fetching projects...');
    const headers = getAuthHeader();
    if (!headers) {
        return Promise.reject(new Error('User not logged in'));
    }

    return Promise.resolve([
        {
            id: 'mock-1', // Corresponds to para.json
            name: 'パラレル (Mock)',
            updated_at: new Date().toISOString(),
        },
        {
            id: 'mock-2', // Corresponds to tree.json
            name: 'ツリー (Mock)',
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

    // Switch based on ID to select the correct mock file
    if (id === 'mock-1') {
        return Promise.resolve(paraData);
    } else if (id === 'mock-2') {
        return Promise.resolve(treeData);
    }

    return Promise.reject(new Error('Project not found'));
}

export async function deleteProject(id) {
    console.log('Deleting project:', id);
    // Mock
    return Promise.resolve(true);
}
