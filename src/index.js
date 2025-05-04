#!/usr/bin/env node

const { serveHTTP, publishToCentral } = require('stremio-addon-sdk');
const addonInterface = require('./addon');
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 7000;

// CORS ayarları
app.use(cors());
app.use(express.json());

// Statik dosyalar için klasör
app.use('/public', express.static(path.join(__dirname, '../public')));

// Ana sayfa
app.get('/', (req, res) => {
    res.redirect('/configure');
});

// Yapılandırma sayfası
app.get('/configure', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/configure.html'));
});

// Letterboxd yetkilendirme sayfası
app.get('/auth/letterboxd', (req, res) => {
    // Burada Letterboxd'a yönlendirme mantığı olacak
    res.send('Letterboxd yetkilendirme sayfası');
});

// Letterboxd callback
app.get('/auth/letterboxd/callback', (req, res) => {
    // Letterboxd'dan dönen callback işlenecek
    res.send('Yetkilendirme tamamlandı');
});

// API routes
const apiRouter = express.Router();

// İzleme geçmişi senkronizasyonu
apiRouter.post('/sync', (req, res) => {
    // İzlenen içerikleri Letterboxd'a aktarma mantığı
    res.json({ success: true, message: 'Senkronizasyon başlatıldı' });
});

// Kullanıcı ayarları
apiRouter.get('/settings', (req, res) => {
    // Kullanıcı ayarlarını döndürme mantığı
    res.json({ autoSync: true });
});

apiRouter.post('/settings', (req, res) => {
    // Kullanıcı ayarlarını güncelleme mantığı
    res.json({ success: true });
});

// API rotalarını ana uygulamaya ekle
app.use('/api', apiRouter);

// Stremio eklenti SDK'sını başlat
serveHTTP(addonInterface, { port: PORT });

console.log(`Eklenti çalışıyor: http://localhost:${PORT}/manifest.json`);
console.log(`Ayarlar sayfası: http://localhost:${PORT}/configure`);

// İsteğe bağlı: Central'a yayınlama
// NOT: Sadece eklentiniz hazır olduğunda ve paylaşıma uygun olduğunda yapın
if (process.env.PUBLISH === 'true') {
    publishToCentral('https://your-addon-url.com/manifest.json');
}