const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Depolama dosyası
const STORAGE_DIR = path.join(__dirname, '../../data');
const WATCHED_MOVIES_FILE = path.join(STORAGE_DIR, 'watched_movies.json');

// Depolama klasörünü oluştur
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// İzlenen filmleri yükle
function loadWatchedMovies() {
    try {
        if (fs.existsSync(WATCHED_MOVIES_FILE)) {
            const data = fs.readFileSync(WATCHED_MOVIES_FILE, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        logger.error(`İzlenen filmler yüklenemedi: ${error.message}`);
        return [];
    }
}

// İzlenen filmleri kaydet
function saveWatchedMovies(movies) {
    try {
        fs.writeFileSync(WATCHED_MOVIES_FILE, JSON.stringify(movies, null, 2), 'utf8');
        logger.info(`${movies.length} film kaydedildi`);
    } catch (error) {
        logger.error(`İzlenen filmler kaydedilemedi: ${error.message}`);
    }
}

/**
 * İzlenen bir filmi kaydet
 * @param {Object} movie - Film bilgileri
 * @returns {Promise<boolean>} Başarılı ise true
 */
async function recordWatchedMovie(movie) {
    try {
        const movies = loadWatchedMovies();
        
        // Film zaten kaydedilmiş mi kontrol et
        const existingIndex = movies.findIndex(m => m.id === movie.id);
        
        if (existingIndex !== -1) {
            // Var olan kaydı güncelle, izleme zamanını yenile
            movies[existingIndex] = {
                ...movies[existingIndex],
                watchedAt: movie.watchedAt
            };
        } else {
            // Yeni kayıt ekle
            movies.push(movie);
        }
        
        // Değişiklikleri kaydet
        saveWatchedMovies(movies);
        
        return true;
    } catch (error) {
        logger.error(`Film kaydedilemedi: ${error.message}`);
        return false;
    }
}

/**
 * Belirli bir tarihten sonra izlenen filmleri getir
 * @param {string} [date] - Başlangıç tarihi (ISO formatında)
 * @returns {Array} İzlenen filmler
 */
function getWatchedMoviesSince(date = null) {
    const movies = loadWatchedMovies();
    
    if (!date) {
        return movies;
    }
    
    const startDate = new Date(date).getTime();
    return movies.filter(movie => {
        const watchedAt = new Date(movie.watchedAt).getTime();
        return watchedAt >= startDate;
    });
}

/**
 * Belirli bir filmin izlenip izlenmediğini kontrol et
 * @param {string} id - Film ID'si
 * @returns {Object|null} İzlendi ise film bilgileri, değilse null
 */
function getWatchedMovie(id) {
    const movies = loadWatchedMovies();
    return movies.find(movie => movie.id === id) || null;
}

module.exports = {
    recordWatchedMovie,
    getWatchedMoviesSince,
    getWatchedMovie
};