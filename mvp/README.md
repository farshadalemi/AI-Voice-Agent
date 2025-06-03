# AI Voice Agent Platform - MVP

## Overview
This is a Minimum Viable Product (MVP) version of the AI Voice Agent Platform designed for fundraising and demonstration purposes. It showcases the core functionality and architecture of the full platform.


![2025-06-03_14-47-38](https://github.com/user-attachments/assets/42726280-aed3-4582-bd4e-30db3586d97c)


![2025-06-03_14-48-00](https://github.com/user-attachments/assets/993e675c-dab2-4bfb-a012-01cd9d769238)



## Features Included in MVP

### Backend (FastAPI)
- Business registration and authentication
- AI agent creation and management
- Mock voice processing pipeline
- Basic analytics and reporting
- Plan management and billing simulation
- RESTful API with OpenAPI documentation

### Frontend (React)
- Business dashboard
- Agent configuration interface
- Analytics visualization
- Plan selection and management
- Responsive design with modern UI

### Database (PostgreSQL)
- Core business entities
- Agent configurations
- Mock conversation data
- Usage tracking
- Subscription management

## Technology Stack

- **Backend**: Python FastAPI
- **Frontend**: React with TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **Containerization**: Docker & Docker Compose
- **Authentication**: JWT tokens
- **API Documentation**: OpenAPI/Swagger

## Quick Start

### Option 1: One-Click Startup (Recommended)

**For Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**For Windows:**
```bash
start.bat
```

### Option 2: Manual Setup

1. **Prerequisites**
   - Docker and Docker Compose
   - Git

2. **Clone and Setup**
   ```bash
   git clone <repository>
   cd mvp
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration if needed
   ```

4. **Start with Docker Compose**
   ```bash
   docker-compose up --build -d
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Database Admin: http://localhost:8080

## 🔐 Login Credentials

### Demo Business Account (Regular User)
- **Email**: `demo@voiceagent.platform`
- **Password**: `Demo1234`
- **Account Type**: Business User
- **Plan**: Starter (automatically assigned to new registrations)

### Database Admin Access (via Adminer)
- **URL**: http://localhost:8080 (when adminer service is running)
- **System**: PostgreSQL
- **Server**: postgres
- **Username**: `voiceagent`
- **Password**: `voiceagent_password`
- **Database**: `voiceagent_db`

### Account Details
The demo business account includes:
- **Business Name**: Demo Business
- **Industry**: Technology
- **Phone**: +1234567890
- **Website**: https://demo.voiceagent.platform
- **Status**: Active (email verified)
- **Subscription**: Starter plan with 100 calls/month, 1 agent, 50MB knowledge base
- **Sample Agent**: None (you can create agents after logging in)

### How to Access
1. **Frontend Application**: http://localhost:3000
   - Use the demo credentials above to log in
   - Navigate through the dashboard, agents, analytics, and settings

2. **Backend API Documentation**: http://localhost:8000/docs
   - Interactive API documentation (Swagger UI)
   - Test endpoints directly from the browser

3. **Database Management**: http://localhost:8080
   - Use the database admin credentials above
   - View and manage all data directly

### Admin Functions
Currently, this is an MVP system with a single business model. You can:
- **Access all data via Adminer** using the database credentials
- **Use the API directly** via the Swagger documentation at http://localhost:8000/docs
- **Register new businesses** through the `/api/v1/auth/register` endpoint

### Notes
- The system automatically assigns new registrations to the "Starter" plan
- Email verification is auto-enabled for MVP purposes
- All external API keys are set to demo values for testing
- The JWT secret key should be changed in production environments

## Project Structure

```
mvp/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core functionality
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   └── main.py         # Application entry point
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utilities
│   ├── package.json
│   └── Dockerfile
├── database/               # Database scripts
│   └── init.sql           # Initial schema
├── docker-compose.yml      # Docker composition
└── .env.example           # Environment template
```

## Demo Scenarios

### 1. Business Registration
- Register a new business account
- Email verification simulation (auto-verified in MVP)
- Automatic starter plan subscription

### 2. Agent Management
- Create AI voice agents with custom configurations
- Configure voice settings and personality traits
- Set agent capabilities and phone numbers
- View agent status and performance

### 3. Voice Call Simulation
- Simulate incoming/outbound calls
- Mock conversation handling with realistic transcripts
- Real-time sentiment analysis
- Customer satisfaction scoring

### 4. Analytics Dashboard
- Call volume metrics and trends
- Agent performance statistics
- Customer satisfaction scores
- Usage tracking and billing information
- Conversation outcomes and insights

### 5. Business Management
- Update business profile and settings
- View subscription details and usage
- Manage API keys (future feature)
- Configure integrations (future feature)

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Business registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Token refresh

### Business Management
- `GET /api/v1/business/profile` - Get business profile
- `PUT /api/v1/business/profile` - Update business profile
- `GET /api/v1/business/plans` - Get available plans
- `POST /api/v1/business/subscribe` - Subscribe to plan

### Agent Management
- `POST /api/v1/agents` - Create new agent
- `GET /api/v1/agents` - List agents
- `GET /api/v1/agents/{id}` - Get agent details
- `PUT /api/v1/agents/{id}` - Update agent
- `DELETE /api/v1/agents/{id}` - Delete agent

### Voice Processing (Mock)
- `POST /api/v1/voice/simulate-call` - Simulate voice call
- `GET /api/v1/voice/conversations` - Get conversations
- `GET /api/v1/voice/analytics` - Get voice analytics

## Development

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

### Database Management
```bash
# Access PostgreSQL
docker exec -it mvp_postgres_1 psql -U voiceagent -d voiceagent_db

# Run migrations (if implemented)
cd backend
alembic upgrade head
```

## Deployment

### Production Deployment
1. Update environment variables for production
2. Build production Docker images
3. Deploy using Docker Compose or Kubernetes
4. Configure SSL/TLS certificates
5. Set up monitoring and logging

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET_KEY` - JWT signing key
- `OPENAI_API_KEY` - OpenAI API key (for demo)
- `TWILIO_ACCOUNT_SID` - Twilio account SID (for demo)
- `TWILIO_AUTH_TOKEN` - Twilio auth token (for demo)

## Limitations (MVP)

This MVP has the following limitations compared to the full platform:
- Mock AI processing (no real voice synthesis/recognition)
- Simplified billing (no real payment processing)
- Basic analytics (limited metrics)
- No real telephony integration
- Single-tenant architecture
- Limited security features
- No advanced AI training capabilities

## Next Steps

After successful fundraising, the full platform development would include:
- Real AI/ML integration (OpenAI, ElevenLabs, etc.)
- Production telephony integration (Twilio, FreeSWITCH)
- Advanced security and compliance features
- Multi-tenant architecture
- Comprehensive analytics and reporting
- Mobile SDKs and advanced integrations
- Scalable infrastructure deployment

## Support

For questions or issues with this MVP:
- Check the API documentation at `/docs`
- Review the logs: `docker-compose logs`
- Contact the development team

## License

This MVP is for demonstration purposes only.
