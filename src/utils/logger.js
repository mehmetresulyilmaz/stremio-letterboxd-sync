/**
 * Basit bir loglama modülü
 */
const fs = require('fs');
const path = require('path');
const { format } = require('util');

// Log klasörü
const LOG_DIR = path.join(__dirname, '../../logs');
// Log seviyesi
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Log klasörünü oluştur
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Log dosyası
const logFile = path.join(LOG_DIR, `app-${new Date().toISOString().split('T')[0]}.log`);

// Log seviyeleri
const LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

// Şu anki log seviyesi
const currentLevel = LEVELS[LOG_LEVEL] || LEVELS.info;

/**
 * Log mesajını dosyaya ve konsola yazar
 * @param {string} level - Log seviyesi
 * @param {string} message - Log mesajı
 * @param {Object} [data] - İlave veri
 */
function log(level, message, data = null) {
    if (LEVELS[level] > currentLevel) {
        return;
    }
    
    const timestamp = new Date().toISOString();
    const logMessage = data
        ? `[${timestamp}] [${level.toUpperCase()}] ${message} ${format('%j', data)}\n`
        : `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    // Konsola yaz
    console[level](logMessage);
    
    // Dosyaya yaz
    fs.appendFileSync(logFile, logMessage);
}

module.exports = {
    error: (message, data) => log('error', message, data),
    warn: (message, data) => log('warn', message, data),
    info: (message, data) => log('info', message, data),
    debug: (message, data) => log('debug', message, data)
};