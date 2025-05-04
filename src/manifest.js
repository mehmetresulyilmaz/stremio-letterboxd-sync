const manifest = {
    id: 'org.yourdomain.stremioletterboxdsync',
    version: '0.1.0',
    name: 'Letterboxd Sync',
    description: 'Stremio izleme geçmişinizi Letterboxd ile senkronize edin',
    logo: 'https://your-domain.com/public/logo.png', // Düzenlenecek
    background: 'https://your-domain.com/public/background.jpg', // Düzenlenecek
    types: ['movie'],
    catalogs: [],
    resources: [
        {
            name: 'stream',
            types: ['movie'],
            idPrefixes: ['tt', 'kitsu']
        },
        {
            name: 'meta',
            types: ['movie'],
            idPrefixes: ['tt', 'kitsu']
        }
    ],
    behaviorHints: {
        configurable: true,
        configurationRequired: true
    }
};

module.exports = manifest;