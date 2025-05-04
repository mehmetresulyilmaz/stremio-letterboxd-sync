const { markAsWatched } = require('./api');
const { checkAuthStatus } = require('./auth');
const { getWatchedMovie, getWatchedMoviesSince } = require('../utils/storage');
const logger = require('../utils/logger');

/**
 * Belirli bir filmi Letterboxd'a senkronize et
 * @param {string} id - Film ID'si
 * @param {string} type - İçerik tipi
 * @returns {Promise<Object>} Senkronizasyon sonucu
 */
async function syncToLetterboxd(id, type) {
    // Sadece filmler destekleniyor
    if (type !== 'movie') {
        return { success: false, message: 'Sadece filmler destekleniyor' };
    }
    
    try {
        // Kimlik doğrulama durumunu kontrol et
        const isAuthenticated = await checkAuthStatus();
        
        if (!isAuthenticated) {
            return { 
                success: false, 
                message: 'Letterboxd hesabı bağlı değil veya oturum süresi dolmuş'
            };
        }
        
        // Film bilgilerini al
        const movie = getWatchedMovie(id);
        
        if (!movie) {
            return { 
                success: false, 
                message: 'Film izleme kaydı bulunamadı'
            };
        }
        
        // Filmi Letterboxd'a ekle
        const watchedDate = new Date(movie.watchedAt);
        const result = await markAsWatched(id, watchedDate);
        
        if (result) {
            logger.info(`Film Letterboxd'a senkronize edildi: ${movie.title} (${id})`);
            return {
                success: true,
                message: 'Film başarıyla Letterboxd hesabınıza eklendi',
                movie
            };
        } else {
            throw new Error('Letterboxd API hatası');
        }
    } catch (error) {
        logger.error(`Senkronizasyon hatası: ${error.message}`);
        return {
            success: false,
            message: `Senkronizasyon sırasında hata: ${error.message}`,
            id
        };
    }
}

/**
 * Tüm izleme geçmişini Letterboxd'a senkronize et
 * @param {string} [since] - Başlangıç tarihi (ISO formatında)
 * @returns {Promise<Object>} Senkronizasyon sonucu
 */
async function syncAllToLetterboxd(since = null) {
    try {
        // Kimlik doğrulama durumunu kontrol et
        const isAuthenticated = await checkAuthStatus();
        
        if (!isAuthenticated) {
            return { 
                success: false, 
                message: 'Letterboxd hesabı bağlı değil veya oturum süresi dolmuş'
            };
        }
        
        // İzlenen filmleri al
        const movies = getWatchedMoviesSince(since);
        
        if (movies.length === 0) {
            return {
                success: true,
                message: 'Senkronize edilecek film bulunamadı',
                count: 0
            };
        }
        
        // Her filmi sırayla senkronize et
        const results = {
            success: true,
            total: movies.length,
            synced: 0,
            failed: 0,
            details: []
        };
        
        for (const movie of movies) {
            try {
                // Filmi senkronize et
                const watchedDate = new Date(movie.watchedAt);
                const result = await markAsWatched(movie.id, watchedDate);
                
                if (result) {
                    results.synced++;
                    results.details.push({
                        id: movie.id,
                        title: movie.title,
                        success: true
                    });
                    
                    // İşlemler arasında bekleme süresi (Letterboxd rate-limit için)
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    results.failed++;
                    results.details.push({
                        id: movie.id,
                        title: movie.title,
                        success: false,
                        error: 'API hatası'
                    });
                }
            } catch (error) {
                results.failed++;
                results.details.push({
                    id: movie.id,
                    title: movie.title,
                    success: false,
                    error: error.message
                });
            }
        }
        
        results.message = `${results.synced}/${results.total} film senkronize edildi`;
        
        logger.info(`Toplu senkronizasyon tamamlandı: ${results.message}`);
        return results;
    } catch (error) {
        logger.error(`Toplu senkronizasyon hatası: ${error.message}`);
        return {
            success: false,
            message: `Senkronizasyon sırasında hata: ${error.message}`
        };
    }
}

module.exports = {
    syncToLetterboxd,
    syncAllToLetterboxd
};