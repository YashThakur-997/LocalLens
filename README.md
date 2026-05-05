# LocalLens

LocalLens is a full-stack MERN application for finding trusted local services through verified real-world work, photos, videos, and authentic reviews. It uses a modern cloud-native deployment model with separate frontend and backend services, AWS ECS, and Cloudflare-managed SSL/TLS for secure delivery.

## Live Demo

- URL: https://local-lens.app

## Tech Stack

### Frontend

- React (Vite) - fast, modern UI development
- Tailwind CSS - responsive and sleek styling
- Axios - API communication

### Backend

- Node.js & Express - REST API architecture
- MongoDB - flexible NoSQL data storage
- JWT & Bcrypt - secure authentication and password hashing

### Infrastructure & DevOps

- AWS ECS (Fargate) - container orchestration for client and server
- AWS Application Load Balancer (ALB) - path-based routing for `/` and `/api/*`
- Docker & ECR - containerization and private image registry
- Cloudflare - DNS, proxying, SSL/TLS termination, and security

## System Architecture

LocalLens is deployed with a cloud-native, service-oriented setup:

1. Traffic enters through Cloudflare, which provides SSL and proxying.
2. AWS ALB listens on port 443 and routes requests based on path.
3. The frontend React app and backend Express API run as separate ECS services.
4. MongoDB stores application data and user records.

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop
- AWS CLI configured if you plan to work with the cloud deployment

### Local Development

Clone the repository:

```bash
git clone https://github.com/yourusername/local-lens.git
cd local-lens
```

Set up environment variables:

Create a `.env` file in both `client` and `server`.

```env
# client/.env
VITE_API_BASE_URL=http://localhost:5000/api
```

Example server environment variables:

```env
# server/.env
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

Run with Docker Compose:

```bash
docker-compose up --build
```

### Run Without Docker

Start the backend:

```bash
cd server
npm install
npm run dev
```

Start the frontend:

```bash
cd client
npm install
npm run dev
```


## Deployment Notes

- Frontend routes are served from `/`
- Backend API routes are served from `/api/*`
- Cloudflare is used for DNS and SSL/TLS termination
- AWS ALB handles secure routing to the appropriate ECS service

## Project Structure

```text
client/
server/
docker-compose.yml
README.md
```

## Features

- verified worker profiles
- service request and review flows
- media-backed proof of work
- role-aware dashboard experience
- secure authentication and protected routes

## License

This project is licensed under the MIT License.