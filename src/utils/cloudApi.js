
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
        'Authorization': 'Bearer ' + session.access_token,
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

    // Real implementation would be:
    // const res = await fetch(`${API_BASE_URL}?app=rawgraphs`, { headers });
    // if (!res.ok) throw new Error(res.statusText);
    // return res.json();

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

// Mock Data for "loadProject"
const MOCK_PROJECT_DATA = {
    "version": "1.2",
    "userInput": "Id\tSepal Length (cm)\tSepal Width (cm)\tPetal Length (cm)\tPetal Width (cm)\tSpecies\n1\t5.1\t3.5\t1.4\t0.2\tIris Setosa\n2\t4.9\t3.0\t1.4\t0.2\tIris Setosa\n3\t4.7\t3.2\t1.3\t0.2\tIris Setosa\n4\t4.6\t3.1\t1.5\t0.2\tIris Setosa\n5\t5.0\t3.6\t1.4\t0.2\tIris Setosa\n6\t5.4\t3.9\t1.7\t0.4\tIris Setosa\n7\t4.6\t3.4\t1.4\t0.3\tIris Setosa\n8\t5.0\t3.4\t1.5\t0.2\tIris Setosa\n9\t4.4\t2.9\t1.4\t0.2\tIris Setosa\n10\t4.9\t3.1\t1.5\t0.1\tIris Setosa\n11\t5.4\t3.7\t1.5\t0.2\tIris Setosa\n12\t4.8\t3.4\t1.6\t0.2\tIris Setosa\n13\t4.8\t3.0\t1.4\t0.1\tIris Setosa\n14\t4.3\t3.0\t1.1\t0.1\tIris Setosa\n15\t5.8\t4.0\t1.2\t0.2\tIris Setosa\n16\t5.7\t4.4\t1.5\t0.4\tIris Setosa\n17\t5.4\t3.9\t1.3\t0.4\tIris Setosa\n18\t5.1\t3.5\t1.4\t0.3\tIris Setosa\n19\t5.7\t3.8\t1.7\t0.3\tIris Setosa\n20\t5.1\t3.8\t1.5\t0.3\tIris Setosa\n21\t5.4\t3.4\t1.7\t0.2\tIris Setosa\n22\t5.1\t3.7\t1.5\t0.4\tIris Setosa\n23\t4.6\t3.6\t1.0\t0.2\tIris Setosa\n24\t5.1\t3.3\t1.7\t0.5\tIris Setosa\n25\t4.8\t3.4\t1.9\t0.2\tIris Setosa\n26\t5.0\t3.0\t1.6\t0.2\tIris Setosa\n27\t5.0\t3.4\t1.6\t0.4\tIris Setosa\n28\t5.2\t3.5\t1.5\t0.2\tIris Setosa\n29\t5.2\t3.4\t1.4\t0.2\tIris Setosa\n30\t4.7\t3.2\t1.6\t0.2\tIris Setosa\n31\t4.8\t3.1\t1.6\t0.2\tIris Setosa\n32\t5.4\t3.4\t1.5\t0.4\tIris Setosa\n33\t5.2\t4.1\t1.5\t0.1\tIris Setosa\n34\t5.5\t4.2\t1.4\t0.2\tIris Setosa\n35\t4.9\t3.1\t1.5\t0.1\tIris Setosa\n36\t5.0\t3.2\t1.2\t0.2\tIris Setosa\n37\t5.5\t3.5\t1.3\t0.2\tIris Setosa\n38\t4.9\t3.1\t1.5\t0.1\tIris Setosa\n39\t4.4\t3.0\t1.3\t0.2\tIris Setosa\n40\t5.1\t3.4\t1.5\t0.2\tIris Setosa\n41\t5.0\t3.5\t1.3\t0.3\tIris Setosa\n42\t4.5\t2.3\t1.3\t0.3\tIris Setosa\n43\t4.4\t3.2\t1.3\t0.2\tIris Setosa\n44\t5.0\t3.5\t1.6\t0.6\tIris Setosa\n45\t5.1\t3.8\t1.9\t0.4\tIris Setosa\n46\t4.8\t3.0\t1.4\t0.3\tIris Setosa\n47\t5.1\t3.8\t1.6\t0.2\tIris Setosa\n48\t4.6\t3.2\t1.4\t0.2\tIris Setosa\n49\t5.3\t3.7\t1.5\t0.2\tIris Setosa\n50\t5.0\t3.3\t1.4\t0.2\tIris Setosa\n51\t7.0\t3.2\t4.7\t1.4\tIris Versicolor\n52\t6.4\t3.2\t4.5\t1.5\tIris Versicolor\n53\t6.9\t3.1\t4.9\t1.5\tIris Versicolor\n54\t5.5\t2.3\t4.0\t1.3\tIris Versicolor\n55\t6.5\t2.8\t4.6\t1.5\tIris Versicolor\n56\t5.7\t2.8\t4.5\t1.3\tIris Versicolor\n57\t6.3\t3.3\t4.7\t1.6\tIris Versicolor\n58\t4.9\t2.4\t3.3\t1.0\tIris Versicolor\n59\t6.6\t2.9\t4.6\t1.3\tIris Versicolor\n60\t5.2\t2.7\t3.9\t1.4\tIris Versicolor\n61\t5.0\t2.0\t3.5\t1.0\tIris Versicolor\n62\t5.9\t3.0\t4.2\t1.5\tIris Versicolor\n63\t6.0\t2.2\t4.0\t1.0\tIris Versicolor\n64\t6.1\t2.9\t4.7\t1.4\tIris Versicolor\n65\t5.6\t2.9\t3.6\t1.3\tIris Versicolor\n66\t6.7\t3.1\t4.4\t1.4\tIris Versicolor\n67\t5.6\t3.0\t4.5\t1.5\tIris Versicolor\n68\t5.8\t2.7\t4.1\t1.0\tIris Versicolor\n69\t6.2\t2.2\t4.5\t1.5\tIris Versicolor\n70\t5.6\t2.5\t3.9\t1.1\tIris Versicolor\n71\t5.9\t3.2\t4.8\t1.8\tIris Versicolor\n72\t6.1\t2.8\t4.0\t1.3\tIris Versicolor\n73\t6.3\t2.5\t4.9\t1.5\tIris Versicolor\n74\t6.1\t2.8\t4.7\t1.2\tIris Versicolor\n75\t6.4\t2.9\t4.3\t1.3\tIris Versicolor\n76\t6.6\t3.0\t4.4\t1.4\tIris Versicolor\n77\t6.8\t2.8\t4.8\t1.4\tIris Versicolor\n78\t6.7\t3.0\t5.0\t1.7\tIris Versicolor\n79\t6.0\t2.9\t4.5\t1.5\tIris Versicolor\n80\t5.7\t2.6\t3.5\t1.0\tIris Versicolor\n81\t5.5\t2.4\t3.8\t1.1\tIris Versicolor\n82\t5.5\t2.4\t3.7\t1.0\tIris Versicolor\n83\t5.8\t2.7\t3.9\t1.2\tIris Versicolor\n84\t6.0\t2.7\t5.1\t1.6\tIris Versicolor\n85\t5.4\t3.0\t4.5\t1.5\tIris Versicolor\n86\t6.0\t3.4\t4.5\t1.6\tIris Versicolor\n87\t6.7\t3.1\t4.7\t1.5\tIris Versicolor\n88\t6.3\t2.3\t4.4\t1.3\tIris Versicolor\n89\t5.6\t3.0\t4.1\t1.3\tIris Versicolor\n90\t5.5\t2.5\t4.0\t1.3\tIris Versicolor\n91\t5.5\t2.6\t4.4\t1.2\tIris Versicolor\n92\t6.1\t3.0\t4.6\t1.4\tIris Versicolor\n93\t5.8\t2.6\t4.0\t1.2\tIris Versicolor\n94\t5.0\t2.3\t3.3\t1.0\tIris Versicolor\n95\t5.6\t2.7\t4.2\t1.3\tIris Versicolor\n96\t5.7\t3.0\t4.2\t1.2\tIris Versicolor\n97\t5.7\t2.9\t4.2\t1.3\tIris Versicolor\n98\t6.2\t2.9\t4.3\t1.3\tIris Versicolor\n99\t5.1\t2.5\t3.0\t1.1\tIris Versicolor\n100\t5.7\t2.8\t4.1\t1.3\tIris Versicolor\n101\t6.3\t3.3\t6.0\t2.5\tIris Virginica\n102\t5.8\t2.7\t5.1\t1.9\tIris Virginica\n103\t7.1\t3.0\t5.9\t2.1\tIris Virginica\n104\t6.3\t2.9\t5.6\t1.8\tIris Virginica\n105\t6.5\t3.0\t5.8\t2.2\tIris Virginica\n106\t7.6\t3.0\t6.6\t2.1\tIris Virginica\n107\t4.9\t2.5\t4.5\t1.7\tIris Virginica\n108\t7.3\t2.9\t6.3\t1.8\tIris Virginica\n109\t6.7\t2.5\t5.8\t1.8\tIris Virginica\n110\t7.2\t3.6\t6.1\t2.5\tIris Virginica\n111\t6.5\t3.2\t5.1\t2.0\tIris Virginica\n112\t6.4\t2.7\t5.3\t1.9\tIris Virginica\n113\t6.8\t3.0\t5.5\t2.1\tIris Virginica\n114\t5.7\t2.5\t5.0\t2.0\tIris Virginica\n115\t5.8\t2.8\t5.1\t2.4\tIris Virginica\n116\t6.4\t3.2\t5.3\t2.3\tIris Virginica\n117\t6.5\t3.0\t5.5\t1.8\tIris Virginica\n118\t7.7\t3.8\t6.7\t2.2\tIris Virginica\n119\t7.7\t2.6\t6.9\t2.3\tIris Virginica\n120\t6.0\t2.2\t5.0\t1.5\tIris Virginica\n121\t6.9\t3.2\t5.7\t2.3\tIris Virginica\n122\t5.6\t2.8\t4.9\t2.0\tIris Virginica\n123\t7.7\t2.8\t6.7\t2.0\tIris Virginica\n124\t6.3\t2.7\t4.9\t1.8\tIris Virginica\n125\t6.7\t3.3\t5.7\t2.1\tIris Virginica\n126\t7.2\t3.2\t6.0\t1.8\tIris Virginica\n127\t6.2\t2.8\t4.8\t1.8\tIris Virginica\n128\t6.1\t3.0\t4.9\t1.8\tIris Virginica\n129\t6.4\t2.8\t5.6\t2.1\tIris Virginica\n130\t7.2\t3.0\t5.8\t1.6\tIris Virginica\n131\t7.4\t2.8\t6.1\t1.9\tIris Virginica\n132\t7.9\t3.8\t6.4\t2.0\tIris Virginica\n133\t6.4\t2.8\t5.6\t2.2\tIris Virginica\n134\t6.3\t2.8\t5.1\t1.5\tIris Virginica\n135\t6.1\t2.6\t5.6\t1.4\tIris Virginica\n136\t7.7\t3.0\t6.1\t2.3\tIris Virginica\n137\t6.3\t3.4\t5.6\t2.4\tIris Virginica\n138\t6.4\t3.1\t5.5\t1.8\tIris Virginica\n139\t6.0\t3.0\t4.8\t1.8\tIris Virginica\n140\t6.9\t3.1\t5.4\t2.1\tIris Virginica\n141\t6.7\t3.1\t5.6\t2.4\tIris Virginica\n142\t6.9\t3.1\t5.1\t2.3\tIris Virginica\n143\t5.8\t2.7\t5.1\t1.9\tIris Virginica\n144\t6.8\t3.2\t5.9\t2.3\tIris Virginica\n145\t6.7\t3.3\t5.7\t2.5\tIris Virginica\n146\t6.7\t3.0\t5.2\t2.3\tIris Virginica\n147\t6.3\t2.5\t5.0\t1.9\tIris Virginica\n148\t6.5\t3.0\t5.2\t2.0\tIris Virginica\n149\t6.2\t3.4\t5.4\t2.3\tIris Virginica\n150\t5.9\t3.0\t5.1\t1.8\tIris Virginica\n\n\n",
    "userInputFormat": "csv",
    "dataSource": {
        "type": "sample"
    },
    "rawData": [
        ["1", "5.1", "3.5", "1.4", "0.2", "Iris Setosa"],
        ["2", "4.9", "3.0", "1.4", "0.2", "Iris Setosa"],
        ["3", "4.7", "3.2", "1.3", "0.2", "Iris Setosa"],
        ["4", "4.6", "3.1", "1.5", "0.2", "Iris Setosa"],
        ["5", "5.0", "3.6", "1.4", "0.2", "Iris Setosa"],
        ["6", "5.4", "3.9", "1.7", "0.4", "Iris Setosa"],
        ["7", "4.6", "3.4", "1.4", "0.3", "Iris Setosa"],
        ["8", "5.0", "3.4", "1.5", "0.2", "Iris Setosa"],
        ["9", "4.4", "2.9", "1.4", "0.2", "Iris Setosa"],
        ["10", "4.9", "3.1", "1.5", "0.1", "Iris Setosa"],
        ["11", "5.4", "3.7", "1.5", "0.2", "Iris Setosa"],
        ["12", "4.8", "3.4", "1.6", "0.2", "Iris Setosa"],
        ["13", "4.8", "3.0", "1.4", "0.1", "Iris Setosa"],
        ["14", "4.3", "3.0", "1.1", "0.1", "Iris Setosa"],
        ["15", "5.8", "4.0", "1.2", "0.2", "Iris Setosa"],
        ["16", "5.7", "4.4", "1.5", "0.4", "Iris Setosa"],
        ["17", "5.4", "3.9", "1.3", "0.4", "Iris Setosa"],
        ["18", "5.1", "3.5", "1.4", "0.3", "Iris Setosa"],
        ["19", "5.7", "3.8", "1.7", "0.3", "Iris Setosa"],
        ["20", "5.1", "3.8", "1.5", "0.3", "Iris Setosa"],
        ["21", "5.4", "3.4", "1.7", "0.2", "Iris Setosa"],
        ["22", "5.1", "3.7", "1.5", "0.4", "Iris Setosa"],
        ["23", "4.6", "3.6", "1.0", "0.2", "Iris Setosa"],
        ["24", "5.1", "3.3", "1.7", "0.5", "Iris Setosa"],
        ["25", "4.8", "3.4", "1.9", "0.2", "Iris Setosa"],
        ["26", "5.0", "3.0", "1.6", "0.2", "Iris Setosa"],
        ["27", "5.0", "3.4", "1.6", "0.4", "Iris Setosa"],
        ["28", "5.2", "3.5", "1.5", "0.2", "Iris Setosa"],
        ["29", "5.2", "3.4", "1.4", "0.2", "Iris Setosa"],
        ["30", "4.7", "3.2", "1.6", "0.2", "Iris Setosa"],
        ["31", "4.8", "3.1", "1.6", "0.2", "Iris Setosa"],
        ["32", "5.4", "3.4", "1.5", "0.4", "Iris Setosa"],
        ["33", "5.2", "4.1", "1.5", "0.1", "Iris Setosa"],
        ["34", "5.5", "4.2", "1.4", "0.2", "Iris Setosa"],
        ["35", "4.9", "3.1", "1.5", "0.1", "Iris Setosa"],
        ["36", "5.0", "3.2", "1.2", "0.2", "Iris Setosa"],
        ["37", "5.5", "3.5", "1.3", "0.2", "Iris Setosa"],
        ["38", "4.9", "3.1", "1.5", "0.1", "Iris Setosa"],
        ["39", "4.4", "3.0", "1.3", "0.2", "Iris Setosa"],
        ["40", "5.1", "3.4", "1.5", "0.2", "Iris Setosa"],
        ["41", "5.0", "3.5", "1.3", "0.3", "Iris Setosa"],
        ["42", "4.5", "2.3", "1.3", "0.3", "Iris Setosa"],
        ["43", "4.4", "3.2", "1.3", "0.2", "Iris Setosa"],
        ["44", "5.0", "3.5", "1.6", "0.6", "Iris Setosa"],
        ["45", "5.1", "3.8", "1.9", "0.4", "Iris Setosa"],
        ["46", "4.8", "3.0", "1.4", "0.3", "Iris Setosa"],
        ["47", "5.1", "3.8", "1.6", "0.2", "Iris Setosa"],
        ["48", "4.6", "3.2", "1.4", "0.2", "Iris Setosa"],
        ["49", "5.3", "3.7", "1.5", "0.2", "Iris Setosa"],
        ["50", "5.0", "3.3", "1.4", "0.2", "Iris Setosa"],
        ["51", "7.0", "3.2", "4.7", "1.4", "Iris Versicolor"],
        ["52", "6.4", "3.2", "4.5", "1.5", "Iris Versicolor"],
        ["53", "6.9", "3.1", "4.9", "1.5", "Iris Versicolor"],
        ["54", "5.5", "2.3", "4.0", "1.3", "Iris Versicolor"],
        ["55", "6.5", "2.8", "4.6", "1.5", "Iris Versicolor"],
        ["56", "5.7", "2.8", "4.5", "1.3", "Iris Versicolor"],
        ["57", "6.3", "3.3", "4.7", "1.6", "Iris Versicolor"],
        ["58", "4.9", "2.4", "3.3", "1.0", "Iris Versicolor"],
        ["59", "6.6", "2.9", "4.6", "1.3", "Iris Versicolor"],
        ["60", "5.2", "2.7", "3.9", "1.4", "Iris Versicolor"],
        ["61", "5.0", "2.0", "3.5", "1.0", "Iris Versicolor"],
        ["62", "5.9", "3.0", "4.2", "1.5", "Iris Versicolor"],
        ["63", "6.0", "2.2", "4.0", "1.0", "Iris Versicolor"],
        ["64", "6.1", "2.9", "4.7", "1.4", "Iris Versicolor"],
        ["65", "5.6", "2.9", "3.6", "1.3", "Iris Versicolor"],
        ["66", "6.7", "3.1", "4.4", "1.4", "Iris Versicolor"],
        ["67", "5.6", "3.0", "4.5", "1.5", "Iris Versicolor"],
        ["68", "5.8", "2.7", "4.1", "1.0", "Iris Versicolor"],
        ["69", "6.2", "2.2", "4.5", "1.5", "Iris Versicolor"],
        ["70", "5.6", "2.5", "3.9", "1.1", "Iris Versicolor"],
        ["71", "5.9", "3.2", "4.8", "1.8", "Iris Versicolor"],
        ["72", "6.1", "2.8", "4.0", "1.3", "Iris Versicolor"],
        ["73", "6.3", "2.5", "4.9", "1.5", "Iris Versicolor"],
        ["74", "6.1", "2.8", "4.7", "1.2", "Iris Versicolor"],
        ["75", "6.4", "2.9", "4.3", "1.3", "Iris Versicolor"],
        ["76", "6.6", "3.0", "4.4", "1.4", "Iris Versicolor"],
        ["77", "6.8", "2.8", "4.8", "1.4", "Iris Versicolor"],
        ["78", "6.7", "3.0", "5.0", "1.7", "Iris Versicolor"],
        ["79", "6.0", "2.9", "4.5", "1.5", "Iris Versicolor"],
        ["80", "5.7", "2.6", "3.5", "1.0", "Iris Versicolor"],
        ["81", "5.5", "2.4", "3.8", "1.1", "Iris Versicolor"],
        ["82", "5.5", "2.4", "3.7", "1.0", "Iris Versicolor"],
        ["83", "5.8", "2.7", "3.9", "1.2", "Iris Versicolor"],
        ["84", "6.0", "2.7", "5.1", "1.6", "Iris Versicolor"],
        ["85", "5.4", "3.0", "4.5", "1.5", "Iris Versicolor"],
        ["86", "6.0", "3.4", "4.5", "1.6", "Iris Versicolor"],
        ["87", "6.7", "3.1", "4.7", "1.5", "Iris Versicolor"],
        ["88", "6.3", "2.3", "4.4", "1.3", "Iris Versicolor"],
        ["89", "5.6", "3.0", "4.1", "1.3", "Iris Versicolor"],
        ["90", "5.5", "2.5", "4.0", "1.3", "Iris Versicolor"],
        ["91", "5.5", "2.6", "4.4", "1.2", "Iris Versicolor"],
        ["92", "6.1", "3.0", "4.6", "1.4", "Iris Versicolor"],
        ["93", "5.8", "2.6", "4.0", "1.2", "Iris Versicolor"],
        ["94", "5.0", "2.3", "3.3", "1.0", "Iris Versicolor"],
        ["95", "5.6", "2.7", "4.2", "1.3", "Iris Versicolor"],
        ["96", "5.7", "3.0", "4.2", "1.2", "Iris Versicolor"],
        ["97", "5.7", "2.9", "4.2", "1.3", "Iris Versicolor"],
        ["98", "6.2", "2.9", "4.3", "1.3", "Iris Versicolor"],
        ["99", "5.1", "2.5", "3.0", "1.1", "Iris Versicolor"],
        ["100", "5.7", "2.8", "4.1", "1.3", "Iris Versicolor"],
        ["101", "6.3", "3.3", "6.0", "2.5", "Iris Virginica"],
        ["102", "5.8", "2.7", "5.1", "1.9", "Iris Virginica"],
        ["103", "7.1", "3.0", "5.9", "2.1", "Iris Virginica"],
        ["104", "6.3", "2.9", "5.6", "1.8", "Iris Virginica"],
        ["105", "6.5", "3.0", "5.8", "2.2", "Iris Virginica"],
        ["106", "7.6", "3.0", "6.6", "2.1", "Iris Virginica"],
        ["107", "4.9", "2.5", "4.5", "1.7", "Iris Virginica"],
        ["108", "7.3", "2.9", "6.3", "1.8", "Iris Virginica"],
        ["109", "6.7", "2.5", "5.8", "1.8", "Iris Virginica"],
        ["110", "7.2", "3.6", "6.1", "2.5", "Iris Virginica"],
        ["111", "6.5", "3.2", "5.1", "2.0", "Iris Virginica"],
        ["112", "6.4", "2.7", "5.3", "1.9", "Iris Virginica"],
        ["113", "6.8", "3.0", "5.5", "2.1", "Iris Virginica"],
        ["114", "5.7", "2.5", "5.0", "2.0", "Iris Virginica"],
        ["115", "5.8", "2.8", "5.1", "2.4", "Iris Virginica"],
        ["116", "6.4", "3.2", "5.3", "2.3", "Iris Virginica"],
        ["117", "6.5", "3.0", "5.5", "1.8", "Iris Virginica"],
        ["118", "7.7", "3.8", "6.7", "2.2", "Iris Virginica"],
        ["119", "7.7", "2.6", "6.9", "2.3", "Iris Virginica"],
        ["120", "6.0", "2.2", "5.0", "1.5", "Iris Virginica"],
        ["121", "6.9", "3.2", "5.7", "2.3", "Iris Virginica"],
        ["122", "5.6", "2.8", "4.9", "2.0", "Iris Virginica"],
        ["123", "7.7", "2.8", "6.7", "2.0", "Iris Virginica"],
        ["124", "6.3", "2.7", "4.9", "1.8", "Iris Virginica"],
        ["125", "6.7", "3.3", "5.7", "2.1", "Iris Virginica"],
        ["126", "7.2", "3.2", "6.0", "1.8", "Iris Virginica"],
        ["127", "6.2", "2.8", "4.8", "1.8", "Iris Virginica"],
        ["128", "6.1", "3.0", "4.9", "1.8", "Iris Virginica"],
        ["129", "6.4", "2.8", "5.6", "2.1", "Iris Virginica"],
        ["130", "7.2", "3.0", "5.8", "1.6", "Iris Virginica"],
        ["131", "7.4", "2.8", "6.1", "1.9", "Iris Virginica"],
        ["132", "7.9", "3.8", "6.4", "2.0", "Iris Virginica"],
        ["133", "6.4", "2.8", "5.6", "2.2", "Iris Virginica"],
        ["134", "6.3", "2.8", "5.1", "1.5", "Iris Virginica"],
        ["135", "6.1", "2.6", "5.6", "1.4", "Iris Virginica"],
        ["136", "7.7", "3.0", "6.1", "2.3", "Iris Virginica"],
        ["137", "6.3", "3.4", "5.6", "2.4", "Iris Virginica"],
        ["138", "6.4", "3.1", "5.5", "1.8", "Iris Virginica"],
        ["139", "6.0", "3.0", "4.8", "1.8", "Iris Virginica"],
        ["140", "6.9", "3.1", "5.4", "2.1", "Iris Virginica"],
        ["141", "6.7", "3.1", "5.6", "2.4", "Iris Virginica"],
        ["142", "6.9", "3.1", "5.1", "2.3", "Iris Virginica"],
        ["143", "5.8", "2.7", "5.1", "1.9", "Iris Virginica"],
        ["144", "6.8", "3.2", "5.9", "2.3", "Iris Virginica"],
        ["145", "6.7", "3.3", "5.7", "2.5", "Iris Virginica"],
        ["146", "6.7", "3.0", "5.2", "2.3", "Iris Virginica"],
        ["147", "6.3", "2.5", "5.0", "1.9", "Iris Virginica"],
        ["148", "6.5", "3.0", "5.2", "2.0", "Iris Virginica"],
        ["149", "6.2", "3.4", "5.4", "2.3", "Iris Virginica"],
        ["150", "5.9", "3.0", "5.1", "1.8", "Iris Virginica"]
    ],
    "parseError": null,
    "parseOptions": {
        "separator": "\t",
        "thousandsSeparator": ",",
        "decimalsSeparator": ".",
        "locale": "ja",
        "unstackedData": null,
        "unstackedColumns": null
    },
    "dataTypes": {
        "Id": {
            "type": "number",
            "locale": "ja",
            "decimal": ".",
            "group": ",",
            "numerals": [
                "0",
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9"
            ]
        },
        "Sepal Length (cm)": {
            "type": "number",
            "locale": "ja",
            "decimal": ".",
            "group": ",",
            "numerals": [
                "0",
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9"
            ]
        },
        "Sepal Width (cm)": {
            "type": "number",
            "locale": "ja",
            "decimal": ".",
            "group": ",",
            "numerals": [
                "0",
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9"
            ]
        },
        "Petal Length (cm)": {
            "type": "number",
            "locale": "ja",
            "decimal": ".",
            "group": ",",
            "numerals": [
                "0",
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9"
            ]
        },
        "Petal Width (cm)": {
            "type": "number",
            "locale": "ja",
            "decimal": ".",
            "group": ",",
            "numerals": [
                "0",
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9"
            ]
        },
        "Species": "string"
    },
    "chart": "rawgraphs.parallelcoordinates",
    "mapping": {
        "dimensions": {
            "ids": [
                "1",
                "2",
                "3",
                "4"
            ],
            "value": [
                "Sepal Length (cm)",
                "Sepal Width (cm)",
                "Petal Length (cm)",
                "Petal Width (cm)"
            ],
            "isValid": true,
            "mappedType": "number"
        },
        "color": {
            "ids": [
                "5"
            ],
            "value": [
                "Species"
            ],
            "isValid": true,
            "mappedType": "string"
        }
    },
    "visualOptions": {
        "width": 805,
        "height": 600,
        "background": "#FFFFFF",
        "marginTop": 20,
        "marginRight": 20,
        "marginBottom": 20,
        "marginLeft": 20,
        "showLegend": false,
        "legendWidth": 200,
        "orientation": "vertical",
        "strokeWidth": 1,
        "strokeOpacity": 0.5,
        "colorScale": {
            "scaleType": "ordinal",
            "interpolator": "schemeCategory10",
            "userScaleValues": [
                {
                    "range": "#1f77b4",
                    "domain": "Iris Setosa"
                },
                {
                    "range": "#ff7f0e",
                    "domain": "Iris Versicolor"
                },
                {
                    "range": "#2ca02c",
                    "domain": "Iris Virginica"
                }
            ],
            "defaultColor": "#cccccc"
        }
    }
};

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

    // Return valid mock project structure
    return Promise.resolve(MOCK_PROJECT_DATA);
}

export async function deleteProject(id) {
    console.log('Deleting project:', id);
    // Mock
    return Promise.resolve(true);
}
