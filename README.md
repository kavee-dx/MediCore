# 🏥 MediCore – AI-Powered Smart Healthcare & Telemedicine Platform

A full-stack microservices-based healthcare platform enabling online doctor consultations, appointment scheduling, real-time video communication, and AI-powered symptom assessment.

---

## 📖 About

MediCore is a comprehensive healthcare telemedicine platform built using modern microservices architecture and containerized with Docker, orchestrated with Kubernetes for production deployment. The platform addresses the growing need for accessible digital healthcare by connecting patients with doctors through secure video consultations, automated appointment booking, prescription management, and AI-driven symptom triage.

The system consists of 10 independent microservices, each with its own dedicated PostgreSQL database, business logic, and REST API endpoints. Services communicate through a centralized API Gateway, enabling independent development, deployment, and horizontal scaling. The entire infrastructure is containerized using Docker and managed through Kubernetes for scalable, resilient production deployments.

This project demonstrates production-grade distributed systems architecture with service isolation, inter-service communication via REST APIs, real-time WebSocket connections for video consultations, cloud-based document storage, and role-based access control for patients, doctors, and administrators.

Key capabilities include online doctor registration with document verification, advanced appointment scheduling with conflict detection, real-time HD video consultations with live chat, secure prescription management, AI-powered symptom assessment, multi-channel notifications, payment processing integration, and comprehensive admin oversight.

---

### 🎯 Problem Statement

Traditional healthcare systems face challenges in:
- Limited accessibility to medical consultations
- Inefficient appointment scheduling processes
- Lack of real-time doctor-patient communication
- Fragmented medical records management
- No intelligent symptom assessment tools

### ✨ Solution

MediCore provides:
- 🏥 24/7 Online Consultations - Connect with doctors anytime, anywhere
- 📅 Smart Scheduling - Automated appointment booking with conflict detection
- 🎥 HD Video Calls - Real-time consultations with screen sharing
- 💊 Digital Prescriptions - Secure prescription management and history
- 🤖 AI Symptom Assessment - Intelligent triage and doctor recommendations
- 🔒 Secure & Compliant - JWT authentication, RBAC, encrypted communications

---

## 🌟 10 Services - Key Features

### 1️⃣ API Gateway Service
- Central routing for all incoming client requests
- URL path-based service discovery
- CORS configuration management
- Request/response logging and monitoring
- Load balancing across service instances
- Rate limiting and DDoS protection
- Health check aggregation for all services

### 2️⃣ Auth Service
- User registration for patients, doctors, and admins
- JWT token generation with role-based claims
- Password hashing with bcryptjs
- Login validation and credential verification
- Token refresh and expiry management
- Doctor verification status checking
- User profile lookup for other services
- Password reset functionality

### 3️⃣ Doctor Service
- Doctor registration with multi-file document upload & verification using Cloudinary
- 3-stage approval workflow (Pending → Approved → Rejected)
- Profile management with real-time updates
- Advanced availability scheduling with automatic conflict detection
- 7-day rolling slot management with timezone-aware IST date handling
- Appointment lifecycle management (Confirm, Reject, Complete)
- Prescription issuance with structured medication records
- Patient report upload and medical document handling
- Public doctor listing with specialty/name search
- Role-based access control for doctor endpoints

### 4️⃣ Patient Service
- Secure patient registration and profile creation
- Profile updates (personal info)
- Patient search and retrieval
- Prescription history access
- Appointment history management
- Patient report viewing
- Cross-service patient ID resolution (UUID format)
- Patient dashboard data aggregation

### 5️⃣ Appointment Service
- Appointment booking with doctor availability validation
- Time slot reservation and locking
- Status workflow management (Pending Payment → Confirmed → Completed)
- Appointment cancellation with reason tracking
- Payment status synchronization with payment service
- Email notification triggers on booking
- Appointment history and retrieval
- Doctor appointment listing
- Patient appointment listing

### 6️⃣ Payment Service
- Payment initiation for appointments
- Transaction record creation and tracking
- Payment status updates (pending, success, failed, refunded)
- Integration with payment gateway
- Payment webhook handling
- Transaction history retrieval
- Payment reconciliation with appointments
- Refund processing

### 7️⃣ Telemedicine Service
- Real-time HD video consultations using Agora RTC (WebRTC)
- Secure session-based room generation with unique channels
- Real-time chat during consultations via Socket.io WebSocket
- Screen sharing capabilities
- Media controls (mute, video on/off)
- Session lifecycle management (SCHEDULED → ACTIVE → ENDED)
- Persistent chat history for medical records compliance
- Clinical notes and prescription documentation
- JWT-secured WebSocket authentication
- Session duration calculation and tracking
- Participant status monitoring
- Doctor and patient session history retrieval

### 8️⃣ Notification Service
- Email notification sending (appointment confirmations, reminders)
- SMS notification delivery
- Redis pub/sub for real-time event listening
- Notification queue management
- Template-based email generation
- Appointment booking notifications
- Payment confirmation notifications
- Doctor verification status notifications
- Notification history and tracking
- Retry logic for failed deliveries

### 9️⃣ AI Symptom Service
- Symptom input collection from patients
- AI-powered symptom analysis and pattern matching
- Preliminary diagnosis suggestions
- Doctor specialty recommendation based on symptoms
- Severity assessment and urgency classification
- Healthcare guidance and next-step recommendations
- Symptom history tracking
- Integration with LLM APIs
- Response caching for common symptom patterns

### 🔟 Admin Service
- Doctor verification approval/rejection
- Pending doctor application review
- Document verification (license, ID, certificates)
- User management (activate, suspend, delete accounts)
- Platform analytics and reporting
- System health monitoring
- Audit log management
- Content moderation
- Revenue and transaction oversight
- Notification management
- Configuration management

---

## 🔧 Microservices

| # | Service | Port | Description |
|---|---------|------|-------------|
| 1 | API Gateway | 8080 | Central routing, request management, CORS, rate limiting |
| 2 | Auth Service | 3001 | User registration, JWT authentication, session management |
| 3 | Doctor Service | 3002 | Doctor profiles, availability, prescriptions, reports |
| 4 | Patient Service | 3004 | Patient profiles, medical history, records |
| 5 | Appointment Service | 3003 | Booking engine, scheduling, status management |
| 6 | Payment Service | 3005 | Payment processing, transactions, reconciliation |
| 7 | Telemedicine Service | 3007 | Video consultations, real-time chat, sessions |
| 8 | Notification Service | 3006 | Email, SMS, push notifications via Redis pub/sub |
| 9 | AI Symptom Service | 3008 | AI-powered symptom analysis and triage |
| 10 | Admin Service | 3009 | Platform administration, user management, verification |

---

## 🛠 Technology Stack
### Frontend
- React.js 19 - UI framework with hooks
- Vite 8 - Build tool and dev server
- Tailwind CSS 4 - Utility-first CSS
- Agora RTC SDK NG 4.22 - Video/audio calling
- Socket.io-client 4.8 - Real-time WebSocket

### Backend
- Node.js - JavaScript runtime
- Express.js 5.x - REST API framework
- Socket.io 4.7 - WebSocket server
- Axios 1.6 - HTTP client

### Database
- PostgreSQL 15 - Relational database
- pg 8.20 - PostgreSQL client with connection pooling
- JSONB - Flexible data storage
- UUID - Primary key strategy

### Security
- JWT (jsonwebtoken 9.0) - Token-based authentication
- bcryptjs 3.0 - Password hashing
- RBAC - Role-based access control

### Real-Time Communication
- WebRTC (Agora RTC) - Peer-to-peer video/audio
- Socket.io - WebSocket messaging

### File Storage
- Cloudinary 2.9 - Cloud document storage
- Multer 2.1 - File upload handling

### Containerization & Orchestration
- Docker - Containerization
- Docker Compose - Multi-container setup
- Kubernetes (K8s) - Production orchestration

### Infrastructure
- NGINX - Reverse proxy and frontend serving
- Redis 7 - Caching and pub/sub messaging

### Development Tools
- Git - Version control
- VS Code - Code editor
- Docker CLI - Container management
- kubectl - Kubernetes management
- Postman - API testing

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v15 or higher)
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/kavee-dx/MediCore.git
   cd MediCore
   ```

2. Install dependencies for each service
   ```bash
   # Example for doctor-service
   cd doctor-service
   npm install
   
   # Repeat for other services
   ```

3. Install frontend dependencies
   ```bash
   cd frontend
   npm install
   ```

### Environment Setup

Create `.env` files in each service directory:

```env
# notification-service/.env
PORT=3006
DATABASE_URL=postgresql://user:password@localhost:5432/medicore_notifications
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMS_API_KEY=your-sms-api-key
SMS_API_SECRET=your-sms-api-secret

# payment-service/.env
PORT=3005
DATABASE_URL=postgresql://user:password@localhost:5432/medicore_payments
JWT_SECRET=your-secret-key
APPOINTMENT_SERVICE_URL=http://localhost:3003
NOTIFICATION_SERVICE_URL=http://localhost:3006
PAYMENT_GATEWAY_KEY=your-payment-gateway-key
PAYMENT_GATEWAY_SECRET=your-payment-gateway-secret

# doctor-service/.env
PORT=3002
DATABASE_URL=postgresql://user:password@localhost:5432/medicore_doctor
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ai-symptom-service/.env
PORT=3008
DATABASE_URL=postgresql://user:password@localhost:5432/medicore_ai_symptom
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-api-key
AI_MODEL=gpt-4
AI_TEMPERATURE=0.7

# telemedicine-service/.env
PORT=3007
DATABASE_URL=postgresql://user:password@localhost:5432/medicore_telemedicine
JWT_SECRET=your-secret-key
AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERTIFICATE=your-agora-app-certificate

# frontend/.env
VITE_API_URL=http://localhost:8080
VITE_TELEMEDICINE_URL=http://localhost:3007
```

### Running with Docker (Recommended)

```bash
# Build and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost
# API Gateway: http://localhost:8080
```

### Running Locally

```bash
# Start PostgreSQL
# Create databases for each service

# Start each service in separate terminals
cd auth-service && npm start
cd doctor-service && npm start
cd appointment-service && npm start
cd telemedicine-service && npm start
cd frontend && npm run dev

# Access the application
# Frontend: http://localhost:5173
# API Gateway: http://localhost:8080
```

---

## 📁 Project Structure

```
MediCore/
├── api-gateway/              # Central routing service
│   ├── src/
│   │   ├── index.js
│   │   └── routes.js
│   ├── .env
│   ├── Dockerfile
│   └── package.json
│
├── auth-service/             # Authentication service
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── middleware/
│   ├── .env
│   ├── Dockerfile
│   └── package.json
│
├── doctor-service/           # Doctor management service
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── config/
│   ├── .env
│   ├── Dockerfile
│   └── package.json
│
├── telemedicine-service/     # Video consultation service
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   └── config/
│   ├── .env
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── components/
│   ├── .env
│   ├── Dockerfile
│   └── package.json
│
├── k8s/                      # Kubernetes manifests
│   ├── api-gateway.yaml
│   ├── doctor-service.yaml
│   └── ...
│
├── db/                       # Database initialization scripts
│   └── init.sql
│
├── docker-compose.yml        # Docker Compose configuration
└── README.md
```

---

## 👨‍💻 Project Team

| Team Member | Services |
|-------------|----------|
| Amasha Bollagala | Patient Service, Notification Service |
| Dushani Naveendhya | Appointment Service, Payment Service |
| Kaveesha Divyanjali | Doctor Service, Telemedicine Service |
| Dilshara Thilakarathna | Admin Service, AI Symptom Service |

---

## 🙏 Acknowledgments

We would like to express our sincere gratitude to:

- Our Lecturers - For their invaluable guidance, support, and mentorship throughout the Distributed Systems module
- All Team Members - For their dedication, collaboration, and commitment to building this comprehensive healthcare platform

This project was developed as part of the Year 3 Semester 1 - Distributed Systems module, demonstrating practical implementation of microservices architecture, containerization, and distributed system design patterns.

---

📊 Architecture: 10 Microservices | Docker | Kubernetes

🎯 Impact: Connecting patients with doctors, anytime, anywhere

---

⭐️ Star | 🍴 Fork | 💡 Contribute | 📢 Share

---

<div align="center">

Made with ❤️ by the MediCore Team

<p align="center">
  <sub>© 2026 MediCore. Transforming Healthcare, One Microservice at a Time.</sub>
</p>

</div>
