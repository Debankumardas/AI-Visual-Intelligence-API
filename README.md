# 👁️ AI Visual Intelligence Platform

An AI-powered **full-stack computer vision platform** that transforms images and videos into structured visual intelligence using deep learning, REST APIs, object detection, object tracking, analytics, authentication, and an interactive React dashboard.

The platform combines **FastAPI, PyTorch, YOLO11n, EfficientNet-B0, React, Vite, Tailwind CSS, SQLite, SQLAlchemy, JWT authentication, OpenCV, Tesseract OCR, Docker, and Nginx** into a unified visual intelligence system.

The project began as an API-first computer vision service and evolved into a complete AI application capable of image analysis, video processing, object tracking, interaction analytics, authenticated user sessions, and dashboard-based visualization.

---

## 🚀 Overview

Traditional computer vision workflows often require users to interact directly with Python scripts, notebooks, model frameworks, or specialized tools.

This project abstracts those complexities behind a structured application layer.

Users interact with the system through a web dashboard while the backend handles:

- Image classification
- Object detection
- Annotated image generation
- Video processing
- Object tracking
- Video analytics
- Track interaction analysis
- JWT authentication
- User preferences
- Database persistence
- Structured API responses

The system follows a modular architecture where the frontend, API layer, authentication, database, AI inference services, video processing, and analytics components are separated.

---

# 🎯 Project Objective

The primary objective is to demonstrate how pretrained computer vision models can be transformed into a complete, maintainable, user-facing AI software platform.

Instead of exposing raw model code directly to users, the platform provides an application workflow:

```text
User
  ↓
React Dashboard
  ↓
FastAPI REST API
  ↓
Request Validation
  ↓
AI Inference
  ↓
Analytics
  ↓
Structured Results
  ↓
Dashboard Visualization

The project therefore combines:

Artificial Intelligence
Computer Vision
Backend Engineering
Frontend Development
Authentication
Database Engineering
Testing
Deployment Architecture
⭐ Complete Project Flow
🧠 Core AI Capabilities
1. Image Classification

The platform uses EfficientNet-B0 through PyTorch/Torchvision for image classification.

The classification pipeline produces:

Top predictions
ImageNet class labels
Confidence scores
Inference timing
Structured JSON responses

Example:

{
  "filename": "sample.jpg",
  "predictions": [
    {
      "label": "golden retriever",
      "confidence": 0.9376
    },
    {
      "label": "Labrador retriever",
      "confidence": 0.0042
    }
  ],
  "inference_time_ms": 42.31
}

The current classifier uses ImageNet classes and is therefore intended as a general-purpose computer vision demonstration rather than a custom domain-specific classifier.

🎯 2. Object Detection

Object detection is powered by YOLO11n.

The detector identifies objects within images and provides:

Object labels
Confidence scores
Bounding-box coordinates
Detection results
Inference information

Example:

{
  "filename": "sample.jpg",
  "content_type": "image/jpeg",
  "detections": [
    {
      "label": "dog",
      "confidence": 0.9342,
      "box": {
        "x1": 52.41,
        "y1": 31.22,
        "x2": 489.72,
        "y2": 421.63
      }
    }
  ]
}

The yolo11n.pt model is included with the project.

🖍️ 3. Annotated Detection

The platform can generate an annotated version of an input image.

The processing pipeline is:

The resulting image visually represents detected objects and their locations.

🔍 4. Combined Image Analysis

The platform can combine image classification and object detection into a single analysis workflow.

This allows an application to obtain both:

What the image represents
Which objects are present

from a unified analysis operation.

🎥 Video Intelligence

The project extends computer vision from individual images to video.

The video processing pipeline supports:

Video uploads
Frame processing
Object detection
Object tracking
Annotated video generation
Detection statistics
Track statistics
Video analytics
Interaction analytics

The general video workflow is:

🎯 Object Tracking

Object detection identifies objects independently in individual frames.

Object tracking adds temporal information by attempting to maintain object identities across multiple frames.

The workflow is:

Video
  ↓
Frame Processing
  ↓
YOLO11n Detection
  ↓
Object Tracking
  ↓
Track IDs
  ↓
Temporal Analytics

This enables the system to analyze:

Total detections
Unique tracked objects
Track statistics
Object interactions
Interaction episodes
📊 Video Analytics

The video analytics layer transforms frame-level detections into higher-level information.

Current analytics include:

Total detections
Unique track IDs
Track statistics
Interaction statistics
Interaction partner counts
Interaction episode counts

The analytics workflow is:

Video
  ↓
Detections
  ↓
Tracked Objects
  ↓
Track Statistics
  ↓
Interaction Analysis
  ↓
Visual Analytics
🕸️ Track Interaction Network

One of the advanced analytics components is the Track Interaction Network.

Tracked objects can be represented as nodes in an interaction network.

For example:

The analytics service can calculate interaction information such as:

Interaction Partner Counts

The number of distinct objects that interacted with each tracked object.

Example:

{
    1: 2,
    2: 2,
    4: 2
}
Interaction Episode Counts

The total number of interaction episodes involving each tracked object.

Example:

{
    1: 5,
    2: 4,
    4: 3
}

This transforms raw object tracking information into higher-level interaction information that can be visualized through the analytics dashboard.

🔐 Authentication

The platform includes JWT-based authentication.

Authentication provides:

User registration
User login
Password hashing
JWT access tokens
Protected API endpoints
Current-user retrieval
Session expiration handling

The authentication workflow is:

Passwords are securely hashed using Argon2 through pwdlib.

JWT configuration is supplied through environment variables rather than being hard-coded into the application.

👤 User Preferences

Authenticated users can maintain application preferences.

The preference system allows application features to be enabled or disabled according to the user's configuration.

The relationship is:

User
 ├── Authentication Information
 └── Application Preferences

This separates security-related information from application-level configuration.

🗄️ Database

The project uses:

SQLite
SQLAlchemy

The database stores persistent application information such as:

Users
User preferences

The database architecture is:

FastAPI
   ↓
Database Dependency
   ↓
SQLAlchemy
   ↓
SQLite

SQLite is appropriate for local development, demonstrations, and portfolio-scale usage.

For a high-concurrency production deployment, PostgreSQL would be a stronger choice.

🖥️ React Dashboard

The project includes a dedicated React frontend.

The frontend is built using:

React
Vite
Tailwind CSS
Axios
Lucide React

The dashboard provides a graphical interface for interacting with the computer vision backend instead of requiring users to manually construct API requests.

📱 Dashboard Components
Dashboard

Provides an overview of visual intelligence activity including:

Images analyzed
Videos processed
Objects detected
Active tracks
Image Analysis

Provides a frontend interface for image-based computer vision operations.

The frontend communicates with the FastAPI backend using REST API requests.

Video Analysis

Provides an interface for:

Video processing
Detection
Tracking
Video analytics

Video results can be passed to the analytics interface for further exploration.

Analytics

The analytics interface presents higher-level information generated from video processing.

This includes:

Detection statistics
Tracking statistics
Interaction information
Interaction network visualization
Settings

The settings interface allows authenticated users to manage application preferences.

🔄 Frontend Authentication Flow

The frontend manages authentication using the JWT access token.

Login Page
    ↓
FastAPI Authentication
    ↓
JWT Token
    ↓
Browser Session
    ↓
Protected API Requests
    ↓
Dashboard

If a protected API request returns a 401 Unauthorized response, the frontend can invalidate the current session and return the user to the login interface.

🏗️ Backend Architecture

The backend follows a modular layered architecture.

The architecture separates:

API Layer

Handles HTTP requests and responses.

Authentication Layer

Handles:

Password hashing
JWT generation
JWT validation
User authentication
Protected routes
Database Layer

Handles:

SQLAlchemy engine
Database sessions
Database initialization
Model Layer

Contains structured application models for:

Predictions
Detections
Analysis
Users
User preferences
Error responses
Service Layer

Contains application logic for:

Model inference
Detection
Annotation
Prediction
Video processing
Video analytics
Video writing
Middleware

Provides request-level infrastructure such as request ID handling.

📁 Project Structure
AI-Visual-Intelligence-API/
│
├── app/
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── analysis.py
│   │   │   ├── detection.py
│   │   │   ├── health.py
│   │   │   ├── prediction.py
│   │   │   ├── utils.py
│   │   │   └── video.py
│   │   │
│   │   └── v1/
│   │       └── router.py
│   │
│   ├── auth/
│   │   ├── dependencies.py
│   │   ├── preferences.py
│   │   ├── routes.py
│   │   ├── schemas.py
│   │   └── security.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── exceptions.py
│   │   └── logging.py
│   │
│   ├── database/
│   │   ├── connection.py
│   │   └── init_db.py
│   │
│   ├── middleware/
│   │   └── request_id.py
│   │
│   ├── models/
│   │   ├── analysis.py
│   │   ├── detection.py
│   │   ├── error.py
│   │   ├── prediction.py
│   │   ├── user.py
│   │   └── user_preferences.py
│   │
│   ├── services/
│   │   ├── annotation_service.py
│   │   ├── detection_service.py
│   │   ├── model_service.py
│   │   ├── prediction_service.py
│   │   ├── video_analytics_service.py
│   │   ├── video_processing_service.py
│   │   ├── video_service.py
│   │   └── video_writer_service.py
│   │
│   └── main.py
│
├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── analytics/
│   │   │   │   └── InteractionNetwork.jsx
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   └── Login.jsx
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Topbar.jsx
│   │   │   │
│   │   │   └── ui/
│   │   │       └── StatCard.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Analytics.jsx
│   │   │   ├── ImageAnalysis.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── VideoAnalysis.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── test/
│   │   │   └── setup.js
│   │   │
│   │   ├── App.jsx
│   │   ├── App.test.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.js
│
├── .dockerignore
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── yolo11n.pt
└── README.md
⚙️ Technology Stack
Category	Technology
Backend Language	Python
Frontend Language	JavaScript
API Framework	FastAPI
ASGI Server	Uvicorn
Frontend	React
Build Tool	Vite
Styling	Tailwind CSS
HTTP Client	Axios
UI Icons	Lucide React
Deep Learning	PyTorch
Image Classification	EfficientNet-B0
Object Detection	YOLO11n
Computer Vision	OpenCV
OCR	Tesseract
Database	SQLite
ORM	SQLAlchemy
Authentication	JWT
Password Hashing	Argon2 / pwdlib
API Documentation	Swagger / OpenAPI
Backend Testing	Pytest
Frontend Testing	Vitest
Frontend Testing Utilities	React Testing Library
Reverse Proxy	Nginx
Containerization	Docker
Orchestration	Docker Compose
🔌 API Endpoints

The backend exposes API functionality for health checks, authentication, image analysis, detection, video processing, and related services.

Core image endpoints include:

Method	Endpoint	Purpose
GET	/	API status
GET	/health	Health check
POST	/predict	Image classification
POST	/detect	Object detection
POST	/detect/annotated	Detection with annotated image
POST	/analyze	Combined image analysis

Authentication endpoints provide user registration, login, current-user retrieval, and preference-related functionality.

Video routes provide video processing and analytics functionality.

For the complete and always-current API contract, use the generated Swagger documentation.

📚 Swagger API Documentation

Once the backend is running, open:

http://127.0.0.1:8000/docs

FastAPI provides an interactive Swagger interface where API requests can be inspected and tested.

Alternative documentation:

http://127.0.0.1:8000/redoc
💻 Local Backend Setup
1. Clone the Repository
git clone https://github.com/Debankumardas/AI-Visual-Intelligence-API.git
cd AI-Visual-Intelligence-API
2. Create a Virtual Environment
python -m venv .venv
3. Activate the Environment

Windows PowerShell:

.venv\Scripts\Activate.ps1
4. Install Dependencies
pip install -r requirements.txt
🔐 Environment Configuration

Create a .env file in the project root.

Example:

JWT_SECRET_KEY=your-strong-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

The JWT secret must be kept private and must not be committed to Git.

For local SQLite configuration:

DATABASE_URL=sqlite:///./app.db
🗄️ Initialize the Database

Run:

python -m app.database.init_db

This creates the required database tables.

▶️ Start the Backend

Run:

uvicorn app.main:app --reload

The backend will be available at:

http://127.0.0.1:8000
🖥️ Frontend Setup

Open a second terminal and navigate to the frontend:

cd frontend

Install dependencies:

npm install

Start the development server:

npm run dev

The frontend will normally be available at:

http://localhost:5173
🔗 Frontend API Configuration

The frontend API client supports the following environment variable:

VITE_API_BASE_URL=http://127.0.0.1:8000

For local development, the React application can communicate directly with the FastAPI backend.

In the containerized architecture, Nginx provides the reverse proxy between the frontend and backend.

🧪 Testing

The project includes automated backend and frontend testing.

Backend Tests

Run:

pytest

The backend test suite covers areas including:

API behavior
Authentication
Protected endpoints
Database functionality
Computer vision services
Video processing
Analytics
Error handling
Frontend Tests

From the frontend directory:

npm test

Frontend tests cover application behavior such as:

Component rendering
Authentication
Session restoration
Session expiration
Dashboard behavior
Navigation
Frontend Linting
npm run lint
Frontend Production Build
npm run build
🐳 Docker Architecture

The project includes Docker configuration for a production-style deployment.

The architecture is:

The Docker setup includes:

Python 3.12 backend
CPU-based PyTorch
YOLO11n
Tesseract OCR
FastAPI
React production build
Nginx
SQLite persistent volume

The intended request path is:

Browser
   ↓
Nginx :80
   ├── React Frontend
   │
   └── /api/* → FastAPI :8000
🚀 Docker Commands

Build and start the complete application:

docker compose up --build

Run in detached mode:

docker compose up -d

Stop the services:

docker compose down

The Docker configuration is included for deployment and reproducibility.

Docker runtime validation requires Docker to be installed and available on the host machine.

🔒 Security Considerations

The project includes several security-oriented mechanisms:

JWT authentication
Argon2 password hashing
Protected API routes
Environment-based secrets
Session expiration handling
Input validation
File type validation
File size validation
Request ID middleware

Sensitive values such as JWT secrets are intentionally kept outside the source code.

For a larger production deployment, additional measures would be recommended:

HTTPS
Rate limiting
Secure secret management
Production database
Security headers
Centralized logging
Monitoring
Role-based authorization
📦 Input Validation

Uploaded images are validated before inference.

Supported image types include:

JPEG
PNG
WebP

The upload pipeline also enforces a maximum image size.

For video processing, configured video formats and video upload limits are used.

The validation workflow is:

Validation occurs before expensive inference so invalid requests can be rejected early.

⚡ CPU-Oriented Design

The project is designed to operate on CPU hardware.

The current development environment does not depend on an NVIDIA GPU.

This makes the system easier to run on standard consumer hardware, although GPU acceleration can significantly improve inference performance for larger workloads.

The project therefore prioritizes:

Lightweight models
Modular inference services
Configurable processing
CPU compatibility
🧱 Engineering Architecture

The project follows a layered architecture rather than placing the entire application inside one file.

                 FastAPI Application
                         │
          ┌──────────────┼──────────────┐
          │              │              │
        Routes        Auth Layer     Middleware
          │              │
          ▼              ▼
      Services       Database
          │
    ┌─────┼───────────────┐
    │     │               │
 Image  Video         Analytics
    │     │               │
    └─────┼───────────────┘
          ▼
       AI Models

This separation improves:

Maintainability
Testing
Reusability
Debugging
Extensibility
📈 Development Evolution

The project evolved through multiple stages.

Stage 1 — Image AI API

Initial capabilities:

Image
 ↓
Classification
 ↓
Detection
 ↓
REST API
Stage 2 — Production-Oriented Backend

Added:

Structured API architecture
Validation
Error handling
Logging
Request IDs
Automated testing
Stage 3 — Video Intelligence

Added:

Video processing
Object detection
Object tracking
Annotated video
Video analytics
Stage 4 — Advanced Analytics

Added:

Track analytics
Interaction analysis
Interaction partner statistics
Interaction episode statistics
Interaction network visualization
Stage 5 — Full-Stack Application

Added:

React dashboard
Authentication
User preferences
Database
Frontend API integration
Session management
Stage 6 — Deployment Architecture

Added:

Dockerfile
Docker Compose
Nginx reverse proxy
Production frontend build
Persistent database volume
🎯 Current Capabilities

The platform brings together:

                 AI VISUAL INTELLIGENCE
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
     Images             Videos           Analytics
       │                  │                  │
       ▼                  ▼                  ▼
Classification        Detection        Track Analysis
Detection             Tracking         Interactions
Annotation            Processing       Networks
       │                  │                  │
       └──────────────────┼──────────────────┘
                          ▼
                    FastAPI Backend
                          │
                 ┌────────┴────────┐
                 ▼                 ▼
           Authentication       Database
                 │                 │
                 └────────┬────────┘
                          ▼
                   React Dashboard
⚠️ Current Limitations

Although the project is designed as a complete portfolio-level computer vision platform, some limitations remain.

AI Model Limitations
EfficientNet-B0 currently performs general ImageNet classification.
YOLO11n is optimized for lightweight inference and may trade accuracy for speed compared with larger detection models.
Hardware Limitations
CPU inference is slower than GPU inference.
Video processing can become computationally expensive for long or high-resolution videos.
Database Limitations
SQLite is suitable for local development and portfolio-scale usage.
High-concurrency production workloads would benefit from PostgreSQL.
Deployment Limitations
Docker configuration is provided for reproducible deployment.
Cloud deployment is not currently included.
A production-scale deployment would require additional infrastructure and monitoring.
🔮 Future Improvements

Possible future development includes:

GPU inference support
PostgreSQL integration
Alembic database migrations
Redis-based background jobs
Asynchronous video processing
Cloud deployment
Advanced role-based access control
API rate limiting
Model benchmarking
Custom-trained computer vision models
Batch inference
Real-time camera streams
WebSocket-based live detection
Advanced video analytics
Production object storage
Scalable inference workers
Monitoring and observability
Performance optimization
🏆 What This Project Demonstrates

This project demonstrates practical skills across multiple areas of modern AI and software engineering.

Artificial Intelligence
Computer vision
Image classification
Object detection
Object tracking
Video analytics
Interaction analysis
Backend Engineering
FastAPI
REST API design
Service-layer architecture
Request validation
Error handling
Middleware
API documentation
Security
JWT authentication
Argon2 password hashing
Protected endpoints
Environment-based secrets
Session management
Database Engineering
SQLite
SQLAlchemy
Database sessions
User persistence
Preference persistence
Frontend Engineering
React
Vite
Tailwind CSS
Axios
Component-based architecture
Dashboard development
Authentication flows
Testing
Pytest
Vitest
React Testing Library
API testing
Authentication testing
Frontend behavior testing
Deployment
Docker
Docker Compose
Nginx
Reverse proxy architecture
Production frontend builds
📌 Key Engineering Principle

The central idea behind the project is:

Raw Visual Data
       ↓
Validation
       ↓
AI Inference
       ↓
Structured Results
       ↓
Analytics
       ↓
REST API
       ↓
React Dashboard
       ↓
User

The project demonstrates how AI models can be transformed from standalone inference scripts into a complete, modular, maintainable, and user-facing software platform.

📚 API Documentation

Interactive API documentation is automatically generated by FastAPI.

After starting the backend:

Swagger:
http://127.0.0.1:8000/docs

ReDoc:
http://127.0.0.1:8000/redoc
👨‍💻 Author

Deban Kumar Das D

BCA — Data Science

GitHub: @Debankumardas

📄 License

This project is intended for educational, learning, research, and portfolio purposes.

⭐ If you find this project useful, consider starring the repository.
