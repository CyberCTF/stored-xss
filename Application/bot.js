const puppeteer = require('puppeteer');

class AdminBot {
    constructor() {
        this.browser = null;
        this.page = null;
        this.adminToken = null;
        this.baseUrl = 'http://localhost:3206';
    }

    async initialize() {
        try {
            console.log('🚀 Initialisation du bot administrateur...');
            
            // Launch browser
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            this.page = await this.browser.newPage();
            
            // Set viewport
            await this.page.setViewport({ width: 1280, height: 720 });

            // Get admin session token
            await this.getAdminSession();
            
            console.log('✅ Bot initialisé avec succès');
            
            // Start the monitoring loop
            this.startMonitoring();
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du bot:', error);
        }
    }

    async getAdminSession() {
        try {
            console.log('🔐 Obtention de la session administrateur...');
            
            // Go to main page first to set referer
            await this.page.goto(`${this.baseUrl}/`);
            
            // Use the login API directly
            const response = await this.page.evaluate(async (baseUrl) => {
                const loginResponse = await fetch(`${baseUrl}/admin-login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: 'admin',
                        password: 'admin123'
                    })
                });
                
                return await loginResponse.json();
            }, this.baseUrl);
            
            if (response.success) {
                // Get admin session cookie
                const cookies = await this.page.cookies();
                const adminCookie = cookies.find(cookie => cookie.name === 'session');
                
                if (adminCookie) {
                    this.adminToken = adminCookie.value;
                    console.log('✅ Session administrateur obtenue');
                } else {
                    throw new Error('Impossible d\'obtenir la session administrateur');
                }
            } else {
                throw new Error('Échec de l\'authentification admin');
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'obtention de la session:', error);
            throw error;
        }
    }

    async startMonitoring() {
        console.log('🔄 Démarrage de la surveillance (toutes les 30 secondes)...');
        
        // Initial visit
        await this.visitAdminDashboard();
        
        // Set up interval for regular visits
        setInterval(async () => {
            await this.visitAdminDashboard();
        }, 30000); // 30 seconds
    }

    async visitAdminDashboard() {
        try {
            console.log('📊 Visite du tableau de bord administrateur...');
            
            // Navigate to admin dashboard
            await this.page.goto(`${this.baseUrl}/admin`);
            
            // Wait for the page to load
            await this.page.waitForSelector('#messagesContainer', { timeout: 10000 });
            
            // Wait a bit for any dynamic content to load
            await this.page.waitForTimeout(2000);
            
            // Check if there are any messages
            const messagesCount = await this.page.evaluate(() => {
                const container = document.getElementById('messagesContainer');
                const messageElements = container.querySelectorAll('.glass.rounded-lg.p-6.border.border-gray-700');
                return messageElements.length;
            });
            
            console.log(`📨 ${messagesCount} message(s) trouvé(s)`);
            
            // Execute any JavaScript in the messages (this is where XSS would trigger)
            const processedMessages = await this.page.evaluate(() => {
                // This simulates the admin viewing messages and any embedded scripts executing
                console.log('Admin reviewing messages...');
                
                const processedIds = [];
                
                // Trigger any potential XSS by accessing message content
                const messageElements = document.querySelectorAll('.glass.rounded-lg.p-6.border.border-gray-700');
                messageElements.forEach((element, index) => {
                    const messageContent = element.querySelector('.text-gray-100.whitespace-pre-wrap');
                    if (messageContent) {
                        console.log(`Reviewing message ${index + 1}:`, messageContent.textContent);
                        
                        // Execute any JavaScript found in the message content
                        const content = messageContent.innerHTML;
                        if (content.includes('<script>')) {
                            console.log('Found JavaScript in message, executing...');
                            // Extract and execute script content
                            const scriptMatch = content.match(/<script>(.*?)<\/script>/s);
                            if (scriptMatch) {
                                try {
                                    // Replace fetch calls to add no-cors mode to avoid CORS issues
                                    let modifiedScript = scriptMatch[1];
                                    // Add no-cors mode to fetch calls
                                    if (modifiedScript.includes('fetch(')) {
                                        // More robust regex to handle different fetch patterns
                                        modifiedScript = modifiedScript.replace(
                                            /fetch\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
                                            'fetch("$1", { mode: "no-cors" })'
                                        );
                                        // Also handle fetch with variables
                                        modifiedScript = modifiedScript.replace(
                                            /fetch\s*\(\s*([^)]+)\s*\)/g,
                                            'fetch($1, { mode: "no-cors" })'
                                        );
                                    }
                                    eval(modifiedScript);
                                    console.log('JavaScript executed successfully');
                                    
                                    // Mark this message for deletion
                                    processedIds.push(index);
                                } catch (error) {
                                    console.error('Error executing JavaScript:', error);
                                }
                            }
                        }
                    }
                });
                
                return processedIds;
            });
            
            // Delete processed messages from database AND DOM
            if (processedMessages.length > 0) {
                console.log(`🗑️ Suppression de ${processedMessages.length} message(s) traité(s) de la base de données et du DOM...`);
                
                // Delete all messages from database
                console.log('🗑️ Suppression de tous les messages de la base de données...');
                await this.page.evaluate(async () => {
                    try {
                        await fetch('/delete-all-messages', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            }
                        });
                    } catch (error) {
                        console.error('Erreur lors de la suppression:', error);
                    }
                });
                
                // Remove from DOM immediately
                await this.page.evaluate((indices) => {
                    const messageElements = document.querySelectorAll('.glass.rounded-lg.p-6.border.border-gray-700');
                    indices.forEach(index => {
                        if (messageElements[index]) {
                            messageElements[index].remove();
                        }
                    });
                }, processedMessages);
            }
            
            // Capture console logs from the page
            this.page.on('console', msg => {
                console.log('🖥️ Browser console:', msg.text());
            });
            
            console.log('✅ Visite du tableau de bord terminée');
            
        } catch (error) {
            console.error('❌ Erreur lors de la visite du tableau de bord:', error);
            
            // Try to re-authenticate if session expired
            if (error.message.includes('timeout') || error.message.includes('401')) {
                console.log('🔄 Tentative de reconnexion...');
                await this.getAdminSession();
            }
        }
    }

    async stop() {
        if (this.browser) {
            await this.browser.close();
            console.log('🛑 Bot arrêté');
        }
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Arrêt du bot...');
    if (global.adminBot) {
        await global.adminBot.stop();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Arrêt du bot...');
    if (global.adminBot) {
        await global.adminBot.stop();
    }
    process.exit(0);
});

// Start the bot
async function startBot() {
    try {
        global.adminBot = new AdminBot();
        await global.adminBot.initialize();
    } catch (error) {
        console.error('❌ Erreur fatale du bot:', error);
        process.exit(1);
    }
}

// Wait a bit for the main server to start
setTimeout(startBot, 5000);

module.exports = AdminBot; 