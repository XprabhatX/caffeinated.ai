console.log('Fetch Models job started...');

const caffeinatedServerURL = 'https://caffeinated-api.vercel.app/';
const openrouterServerURL = 'https://openrouter.ai/api/v1/models';

async function checkServerHealth() {
    try {
        const serverHealthResult = await fetch(caffeinatedServerURL);
        const status = serverHealthResult.status;

        if (status === 200)
            return true;
        return false;
    } catch (error) {
        console.error('Network error: ', error);
    }
}

async function fetchModelsData() {
    try {
        const fetchModelDataURL = new URL(openrouterServerURL);
        fetchModelDataURL.searchParams.append('output_modalities', 'text');

        const data = await fetch(fetchModelDataURL);
        return data.json();
    } catch (error) {
        console.error('Network Error: ', error);
    }
}

try {
    
    // check server health
    const isCaffeinatedServerhealthy = await checkServerHealth();

    if (!isCaffeinatedServerhealthy)
        throw new Error('can not connect to caffeinated server');

    console.log('connected to caffeinated server');

    const data = await fetchModelsData();

    if (!data)
        throw new Error('no data received from openrouter');

    console.log('data received:\n', data);
} catch (error) {
    console.error(error);
}

console.log('Fetch Models job ended...');