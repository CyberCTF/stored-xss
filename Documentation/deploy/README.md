# Law Firm XSS Stored Vulnerability Lab

## Docker Hub

### Pull and Run

```bash
# Pull the image
docker pull securitylab/law-firm-xss-lab:latest

# Run the application
docker run -d -p 3206:3206 --name law-firm-xss-lab securitylab/law-firm-xss-lab:latest

# Access the application
open http://localhost:3206
```

### Using Docker Compose

```bash
# Create docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'
services:
  law-firm-app:
    image: securitylab/law-firm-xss-lab:latest
    ports:
      - "3206:3206"
    restart: unless-stopped
EOF

# Start the application
docker-compose up -d
```

## Access Information

- **Application URL**: http://localhost:3206

- **Admin Dashboard**: http://localhost:3206/admin

## Quick Test

1. Visit http://localhost:3206/contact
2. Submit this XSS payload:
   ```html
   <script>alert('XSS Test')</script>
   ```
3. Login to admin panel and check messages
4. Verify the JavaScript executes

## Support

For issues or questions, please report them through the GitHub repository.

---

**This is a deliberately vulnerable lab designed solely for educational purposes.** 