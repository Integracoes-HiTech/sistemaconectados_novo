import https from 'https';
import http from 'http';

// URLs para testar
const urls = [
    'https://conectadosdigital.com.br/comece-agora',
    'https://conectadosdigital.com.br/comece-agora.html',
    'https://conectadosdigital.com.br/success',
    'https://conectadosdigital.com.br/success.html'
];

function testUrl(url) {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        
        const req = client.request(url, { method: 'HEAD' }, (res) => {
            resolve({
                url,
                status: res.statusCode,
                location: res.headers.location,
                contentType: res.headers['content-type']
            });
        });
        
        req.on('error', (error) => {
            resolve({
                url,
                error: error.message
            });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                url,
                error: 'Timeout'
            });
        });
        
        req.end();
    });
}

async function testarUrls() {
    console.log('🧪 Testando URLs de produção...\n');
    
    for (const url of urls) {
        const result = await testUrl(url);
        
        if (result.error) {
            console.log(`❌ ${result.url}`);
            console.log(`   Erro: ${result.error}\n`);
        } else {
            console.log(`✅ ${result.url}`);
            console.log(`   Status: ${result.status}`);
            if (result.location) {
                console.log(`   Redirect para: ${result.location}`);
            }
            if (result.contentType) {
                console.log(`   Content-Type: ${result.contentType}`);
            }
            console.log('');
        }
    }
    
    console.log('📋 Resumo:');
    console.log('- URLs sem .html devem retornar 200');
    console.log('- URLs com .html devem retornar 301 (redirect)');
    console.log('- Redirects devem apontar para URLs sem .html');
}

testarUrls().catch(console.error);
