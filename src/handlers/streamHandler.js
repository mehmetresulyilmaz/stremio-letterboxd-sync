const { getTMDBData } = require('../utils/tmdb');
const { recordWatchedMovie } = require('../utils/storage');
const logger = require('../utils/logger');

/**
 * Stream bilgilerini işler ve izleme kaydı tutar
 * @param {Object} args - Stream isteği parametreleri
 * @returns {Promise<Object>} Stream yanıtı
 */
async function streamHandler(args) {
    const { type, id } = args;
    
    // Sadece filmler için işlem yapıyoruz
    if (type !== 'movie') {
        return Promise.resolve({ streams: [] });
    }
    
    try {
        // Film bilgilerini al
        const movieData = await getTMDBData(id);
        
        if (movieData) {
            // İzleme kaydı tut
            await recordWatchedMovie({
                id: movieData.imdb_id || id,
                title: movieData.title,
                year: movieData.release_date ? movieData.release_date.substring(0, 4) : null,
                tmdbId: movieData.id,
                watchedAt: new Date().toISOString()
            });
            
            logger.info(`Film izleme kaydı tutuldu: ${movieData.title} (${id})`);
        }
        
        // Bu eklenti gerçek stream sağlamıyor, sadece izleme takibi yapıyor
        // Bu nedenle boş bir stream listesi dönüyoruz
        return Promise.resolve({ streams: [] });
    } catch (error) {
        logger.error(`Stream işleme hatası: ${error.message}`);
        return Promise.resolve({ streams: [] });
    }
}

module.exports = streamHandler;