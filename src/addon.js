const { addonBuilder } = require('stremio-addon-sdk');
const manifest = require('./manifest');
const metaHandler = require('./handlers/metaHandler');
const streamHandler = require('./handlers/streamHandler');
const catalogHandler = require('./handlers/catalogHandler');
const { syncToLetterboxd } = require('./letterboxd/sync');
const logger = require('./utils/logger');

// Eklentiyi oluştur
const builder = new addonBuilder(manifest);

// Meta istek işleyicisi
builder.defineMetaHandler(async (args) => {
    logger.info(`Meta isteği alındı: ${JSON.stringify(args)}`);
    return await metaHandler(args);
});

// Stream istek işleyicisi - izleme kaydı burada tutulacak
builder.defineStreamHandler(async (args) => {
    logger.info(`Stream isteği alındı: ${JSON.stringify(args)}`);
    
    try {
        // İzleme kaydını işle
        const streamResponse = await streamHandler(args);
        
        // Eğer bu bir film ise ve izleme kaydı tutulması gerekiyorsa
        if (args.type === 'movie') {
            // Arka planda Letterboxd'a senkronizasyon başlat
            syncToLetterboxd(args.id, args.type)
                .then(result => {
                    logger.info(`Letterboxd senkronizasyonu tamamlandı: ${args.id}`, result);
                })
                .catch(err => {
                    logger.error(`Letterboxd senkronizasyonu başarısız: ${args.id}`, err);
                });
        }
        
        return streamResponse;
    } catch (error) {
        logger.error(`Stream işleme hatası: ${error.message}`);
        return { streams: [] };
    }
});

// Katalog işleyicisi (isteğe bağlı)
builder.defineCatalogHandler(async (args) => {
    logger.info(`Katalog isteği alındı: ${JSON.stringify(args)}`);
    return await catalogHandler(args);
});

module.exports = builder.getInterface();