const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Letterboxd oturum bilgilerinin saklanacağı dosya
const CREDENTIALS_FILE = path.join(__dirname, '../../data/letterboxd_credentials.json');

/**
 * Letterboxd oturum bilgilerini yükle
 * @returns {Object|null} Oturum bilgileri
 */
function loadCredentials() {
    try {
        if (fs.existsSync(CREDENTIALS_FILE)) {
            const data = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        logger.error(`Letterboxd oturum bilgileri yüklenemedi: ${error.message}`);
        return null;
    }
}

/**
 * Letterboxd oturum bilgilerini kaydet
 * @param {Object} credentials - Oturum bilgileri
 */
function saveCredentials(credentials) {
    try {
        // data klasörünü kontrol et ve oluştur
        const dataDir = path.dirname(CREDENTIALS_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), 'utf8');
        logger.info('Letterboxd oturum bilgileri kaydedildi');
    } catch (error) {
        logger.error(`Letterboxd oturum bilgileri kaydedilemedi: ${error.message}`);
    }
}

/**
 * Letterboxd'a giriş yap
 * @param {string} username - Kullanıcı adı
 * @param {string} password - Şifre
 * @returns {Promise<Object>} Oturum bilgileri
 */
async function login(username, password) {
    try {
        // Önce ana sayfaya istek at, __csrf token'ı al
        const mainPage = await axios.get('https://letterboxd.com/');
        const $ = cheerio.load(mainPage.data);
        const csrfToken = $('input[name="__csrf"]').val();
        
        if (!csrfToken) {
            throw new Error('CSRF token alınamadı');
        }
        
        // Giriş yap
        const loginResponse = await axios.post('https://letterboxd.com/user/login.do', 
            new URLSearchParams({
                __csrf: csrfToken,
                username: username,
                password: password
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': 'https://letterboxd.com/sign-in/'
                },
                maxRedirects: 0,
                validateStatus: status => status >= 200 && status < 400
            }
        );
        
        // Çerezleri al
        const cookies = loginResponse.headers['set-cookie'];
        
        if (!cookies || cookies.length === 0) {
            throw new Error('Oturum çerezleri alınamadı');
        }
        
        // Çerezleri işle
        const sessionCookie = cookies.find(cookie => cookie.includes('lbsession='));
        if (!sessionCookie) {
            throw new Error('Oturum çerezi bulunamadı');
        }
        
        // Oturum bilgilerini kaydet
        const credentials = {
            username,
            cookies: cookies.map(cookie => cookie.split(';')[0]),
            csrfToken,
            loggedIn: true,
            lastLogin: new Date().toISOString()
        };
        
        saveCredentials(credentials);
        
        logger.info(`Letterboxd'a giriş yapıldı: ${username}`);
        return credentials;
    } catch (error) {
        logger.error(`Letterboxd giriş hatası: ${error.message}`);
        throw new Error(`Letterboxd'a giriş yapılamadı: ${error.message}`);
    }
}

/**
 * Film izlendi olarak işaretle
 * @param {string} imdbId - IMDb ID
 * @param {Date} watchedDate - İzleme tarihi
 * @returns {Promise<boolean>} Başarılı ise true
 */
async function markAsWatched(imdbId, watchedDate = new Date()) {
    const credentials = loadCredentials();
    
    if (!credentials || !credentials.loggedIn) {
        throw new Error('Letterboxd oturumu bulunamadı');
    }
    
    try {
        // IMDb ID'sinden Letterboxd film sayfasını bul
        const searchUrl = `https://letterboxd.com/search/films/?q=${imdbId}`;
        const searchResponse = await axios.get(searchUrl, {
            headers: {
                'Cookie': credentials.cookies.join('; ')
            }
        });
        
        const $ = cheerio.load(searchResponse.data);
        const filmUrl = $('.results .film-detail .headline-2 a').attr('href');
        
        if (!filmUrl) {
            throw new Error(`Film bulunamadı: ${imdbId}`);
        }
        
        // Film sayfasını ziyaret et
        const filmPageResponse = await axios.get(`https://letterboxd.com${filmUrl}`, {
            headers: {
                'Cookie': credentials.cookies.join('; ')
            }
        });
        
        const $filmPage = cheerio.load(filmPageResponse.data);
        const csrfToken = $filmPage('input[name="__csrf"]').val();
        
        // Filmi izlendi olarak işaretle
        const markUrl = `https://letterboxd.com${filmUrl.replace(/\/$/, '')}/mark/`;
        const markData = new URLSearchParams({
            __csrf: csrfToken,
            day: watchedDate.getDate(),
            month: watchedDate.getMonth() + 1,
            year: watchedDate.getFullYear(),
            rewatch: 'false'
        });
        
        await axios.post(markUrl, markData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': credentials.cookies.join('; '),
                'Referer': `https://letterboxd.com${filmUrl}`
            }
        });
        
        logger.info(`Film izlendi olarak işaretlendi: ${imdbId}`);
        return true;
    } catch (error) {
        logger.error(`Film izleme kaydı hatası: ${error.message}`);
        return false;
    }
}

module.exports = {
    login,
    markAsWatched,
    loadCredentials,
    saveCredentials
};  