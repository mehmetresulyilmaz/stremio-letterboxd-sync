const logger = require('../utils/logger');

/**
 * Katalog bilgilerini işler
 * @param {Object} args - Katalog isteği parametreleri
 * @returns {Promise<Object>} Katalog yanıtı
 */
async function catalogHandler(args) {
    const { type, id } = args;
    
    logger.info(`Katalog isteği: ${type}, ${id}`);
    
    // Bu eklenti bir katalog sunmuyor, sadece izleme takibi yapıyor
    // Bu nedenle boş bir metas listesi dönüyoruz
    return Promise.resolve({ metas: [] });
}

module.exports = catalogHandler;