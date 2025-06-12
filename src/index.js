#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 7000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API: Letterboxd login (örnek, gerçek entegrasyon için geliştirin)
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    // Burada gerçek Letterboxd API veya scraping ile doğrulama yapılmalı
    if (username && password) {
        // Demo: Her zaman başarılı
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });
    }
});

// API: Senkronizasyon (örnek)
app.post('/api/sync', (req, res) => {
    // Burada Stremio geçmişini Letterboxd'a aktarma işlemi yapılmalı
    res.json({ success: true, synced: 5 }); // Demo: 5 film aktarıldı
});

// Manifest dosyasını sun
app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/manifest.json'));
});

app.listen(PORT, () => {
    console.log(`Stremio Letterboxd Sync çalışıyor: http://localhost:${PORT}/configure.html`);
});