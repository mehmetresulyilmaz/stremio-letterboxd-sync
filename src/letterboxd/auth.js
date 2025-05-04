const { login, loadCredentials, saveCredentials } = require('./api');
const logger = require('../utils/logger');

/**
 * Kimlik doğrulama durumunu kontrol et
 * @returns {Promise<boolean>} Oturum açık ise true
 */
async function checkAuthStatus() {
    const credentials = loadCredentials();
    
    if (!credentials || !credentials.loggedIn) {
        return false;
    }
    
    // Son giriş 7 günden eski ise yenilenmeli
    const lastLogin = new Date(credentials.lastLogin);
    const now = new Date();
    const daysDiff = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 7) {
        logger.info('Letterboxd oturumu süresi dolmuş, yenileme gerekiyor');
        return false;
    }
    
    return true;
}

/**
 * Oturumu kapat
 * @returns {Promise<boolean>} Başarılı ise true
 */
async function logout() {
    try {
        const credentials = loadCredentials();
        
        if (credentials) {
            // Oturum bilgilerini sil
            saveCredentials({
                ...credentials,
                loggedIn: false,
                cookies: []
            });
        }
        
        logger.info('Letterboxd oturumu kapatıldı');
        return true;
    } catch (error) {
        logger.error(`Letterboxd oturumu kapatılamadı: ${error.message}`);
        return false;
    }
}

/**
 * Kimlik doğrulama ayarlarını güncelle
 * @param {Object} settings - Ayarlar
 * @returns {Promise<boolean>} Başarılı ise true
 */
async function updateAuthSettings(settings) {
    try {
        if (settings.username && settings.password) {
            // Yeni kimlik bilgileriyle giriş yap
            await login(settings.username, settings.password);
            return true;
        }
        
        return false;
    } catch (error) {
        logger.error(`Kimlik ayarları güncellenemedi: ${error.message}`);
        return false;
    }
}

module.exports = {
    checkAuthStatus,
    logout,
    updateAuthSettings
};