const axios = require('axios');
const NodeCache = require('node-cache');
const logger = require('./logger');
require('dotenv').config();

// TMDB API anahtarı
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Cache nesnesi (30 dakika TTL)
const cache = new NodeCache({ stdTTL: 1800 });

/**
 * IMDb ID'si verilen filmin TMDB verilerini getirir
 * @param {string} imdbId - IMDb ID'si (tt ile başlayan)
 * @returns {Promise<Object|null>} Film verileri
 */
async function getTMDBData(imdbId) {
    // IMDb ID'si değilse işlem yapma
    if (!imdbId.startsWith('tt')) {
        logger.warn(`Geçersiz IMDb ID'si: ${imdbId}`);
        return null;
    }
    
    // Cache'te varsa oradan döndür
    const cacheKey = `tmdb_${imdbId}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
        logger.debug(`Cache'ten TMDB verileri alındı: ${imdbId}`);
        return cachedData;
    }
    
    try {
        // TMDB'den film bilgilerini sorgula
        const response = await axios.get(`${TMDB_BASE_URL}/find/${imdbId}`, {
            params: {
                api_key: TMDB_API_KEY,
                external_source: 'imdb_id'
            }
        });
        
        const movieResults = response.data.movie_results;
        if (!movieResults || movieResults.length === 0) {
            logger.warn(`TMDB'de film bulunamadı: ${imdbId}`);
            return null;
        }
        
        // İlk sonucu al
        const movieId = movieResults[0].id;
        
        // Film detaylarını getir
        const detailsResponse = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
            params: {
                api_key: TMDB_API_KEY,
                append_to_response: 'credits'
            }
        });
        
        // Verileri cache'e ekle
        cache.set(cacheKey, detailsResponse.data);
        
        logger.info(`TMDB'den film verileri alındı: ${imdbId}`);
        return detailsResponse.data;
    } catch (error) {
        logger.error(`TMDB API hatası: ${error.message}`);
        return null;
    }
}

module.exports = {
    getTMDBData
};