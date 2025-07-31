const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3206;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run(`CREATE TABLE messages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE admin_sessions (
        id TEXT PRIMARY KEY,
        session_token TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Insert default admin session
    const adminToken = uuidv4();
    db.run(`INSERT INTO admin_sessions (id, session_token) VALUES (?, ?)`, 
           [uuidv4(), adminToken]);
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.post('/submit-contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    
    const messageId = uuidv4();
    
    // VULNERABILITY: Stored XSS - No sanitization of user input
    db.run(`INSERT INTO messages (id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)`,
           [messageId, name, email, subject, message], (err) => {
        if (err) {
            console.error('Erreur lors de l\'insertion:', err);
            return res.status(500).json({ error: 'Erreur interne du serveur' });
        }
        res.json({ success: true, message: 'Message envoyé avec succès' });
    });
});

// Route pour la page de login admin (BLOQUÉE - accessible uniquement via XSS)
app.get('/admin-login', (req, res) => {
    // Bloquer l'accès direct - accessible uniquement via exploitation XSS
    return res.status(404).send('Not Found');
});

app.get('/admin', (req, res) => {
    const sessionToken = req.cookies.session;
    
    if (!sessionToken) {
        return res.status(404).send('Not Found');
    }
    
    // Verify admin session
    db.get(`SELECT * FROM admin_sessions WHERE session_token = ?`, [sessionToken], (err, row) => {
        if (err || !row) {
            return res.status(404).send('Not Found');
        }
        
        // Get all messages for admin review
        db.all(`SELECT * FROM messages ORDER BY created_at DESC`, (err, messages) => {
            if (err) {
                console.error('Erreur lors de la récupération des messages:', err);
                return res.status(500).send('Erreur interne du serveur');
            }
            
            res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
        });
    });
});

app.post('/admin-login', (req, res) => {
    const { username, password } = req.body;
    
    // Vérifier si la requête vient d'une exploitation XSS (pas d'accès direct)
    const referer = req.get('Referer');
    if (!referer || !referer.includes('localhost:3206')) {
        return res.status(404).json({ error: 'Not Found' });
    }
    
    // Simple admin authentication (in real app, this would be more secure)
    if (username === 'admin' && password === 'admin123') {
        db.get(`SELECT session_token FROM admin_sessions LIMIT 1`, (err, row) => {
            if (err || !row) {
                return res.status(500).json({ error: 'Erreur d\'authentification' });
            }
            
            res.cookie('session', row.session_token, { 
                httpOnly: false, // VULNERABILITY: Cookie accessible via JavaScript
                secure: false,
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });
            
            res.json({ success: true });
        });
    } else {
        res.status(401).json({ error: 'Identifiants invalides' });
    }
});

// API pour supprimer tous les messages traités
app.post('/delete-all-messages', (req, res) => {
    const sessionToken = req.cookies.session;
    
    // Vérifier l'authentification admin
    if (!sessionToken) {
        return res.status(401).json({ error: 'Non autorisé' });
    }
    
    db.get(`SELECT * FROM admin_sessions WHERE session_token = ?`, [sessionToken], (err, row) => {
        if (err || !row) {
            return res.status(401).json({ error: 'Session invalide' });
        }
        
        // Supprimer tous les messages
        db.run(`DELETE FROM messages`, (err) => {
            if (err) {
                console.error('Erreur lors de la suppression:', err);
                return res.status(500).json({ error: 'Erreur interne du serveur' });
            }
            console.log('🗑️ Tous les messages supprimés de la base de données');
            res.json({ success: true, deleted: true });
        });
    });
});

app.get('/api/messages', (req, res) => {
    const sessionToken = req.cookies.session;
    
    if (!sessionToken) {
        return res.status(401).json({ error: 'Non autorisé' });
    }
    
    db.get(`SELECT * FROM admin_sessions WHERE session_token = ?`, [sessionToken], (err, row) => {
        if (err || !row) {
            return res.status(401).json({ error: 'Session invalide' });
        }
        
        db.all(`SELECT * FROM messages ORDER BY created_at DESC`, (err, messages) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur de base de données' });
            }
            res.json(messages);
        });
    });
});

app.get('/internal-data', (req, res) => {
    const sessionToken = req.cookies.session;
    
    if (!sessionToken) {
        return res.status(404).send('Not Found');
    }
    
    db.get(`SELECT * FROM admin_sessions WHERE session_token = ?`, [sessionToken], (err, row) => {
        if (err || !row) {
            return res.status(404).send('Not Found');
        }
        
        // Serve the internal data page
        res.sendFile(path.join(__dirname, 'public', 'internal-data.html'));
    });
});

// Bot endpoint for automated admin visits
app.get('/bot-trigger', (req, res) => {
    console.log('Bot triggered - visiting admin dashboard');
    res.json({ status: 'Bot visit logged' });
});

// Middleware de gestion d'erreur 404 - toutes les routes inexistantes
app.use('*', (req, res) => {
    res.status(404).send('Not Found');
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);

}); 