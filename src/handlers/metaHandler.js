const { getTMDBData } = require('../utils/tmdb');
const logger = require('../utils/logger');

/**
 * Meta bilgilerini işler
 * @param {Object} args - Meta isteği parametreleri
 * @returns {Promise<Object>} Meta yanıtı
 */
async function metaHandler(args) {
    const { type, id } = args;
    
    if (type !== 'movie') {
        return Promise.resolve({ meta: null });
    }
    
    try {
        // TMDB'den film bilgilerini al
        const movieData = await getTMDBData(id);
        if (!movieData) {
            return Promise.resolve({ meta: null });
        }
        
        // Meta bilgilerini döndür
        return Promise.resolve({
            meta: {
                id: movieData.imdb_id || id,
                type: 'movie',
                name: movieData.title,
                poster: movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : null,
                background: movieData.backdrop_path ? `https://image.tmdb.org/t/p/original${movieData.backdrop_path}` : null,
                description: movieData.overview,
                releaseInfo: movieData.release_date ? movieData.release_date.substring(0, 4) : '',
                runtime: movieData.runtime ? `${movieData.runtime} min` : null,
                genres: movieData.genres ? movieData.genres.map(g => g.name) : [],
                imdbRating: movieData.vote_average ? movieData.vote_average : null,
                released: new Date(movieData.release_date).getTime()
            }
        });
    } catch (error) {
        logger.error(`Meta işleme hatası: ${error.message}`);
        return Promise.resolve({ meta: null });
    }
}

module.exports = metaHandler;