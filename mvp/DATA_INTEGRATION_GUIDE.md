# 🔗 Data Integration Service - Implementation Guide

## 📋 Overview

The Data Integration Service is a new microservice that extends the AI Voice Agent Platform MVP with advanced data management capabilities. It enables businesses to:

- **Create Custom Databases**: Dynamic database creation with flexible schemas
- **Import Business Data**: Support for Excel, CSV, JSON, PDF, and text files
- **Enable AI-Database Connectivity**: MCP (Model Context Protocol) for agent-database communication
- **Provide Semantic Search**: Vector-based search through business knowledge
- **Manage Agent Bindings**: Configure which agents can access which databases

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  FastAPI Backend│    │Data Integration │
│   (Port 3000)   │◄──►│   (Port 8000)   │◄──►│   (Port 8001)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐             │
                       │   PostgreSQL    │◄────────────┤
                       │   (Port 5432)   │             │
                       └─────────────────┘             │
                                                        │
                       ┌─────────────────┐             │
                       │     Redis       │◄────────────┤
                       │   (Port 6379)   │             │
                       └─────────────────┘             │
                                                        │
                       ┌─────────────────┐             │
                       │     Qdrant      │◄────────────┤
                       │   (Port 6333)   │             │
                       └─────────────────┘             │
                                                        │
                       ┌─────────────────┐             │
                       │     MinIO       │◄────────────┘
                       │   (Port 9000)   │
                       └─────────────────┘

                       ┌─────────────────┐
                       │   MCP Server    │
                       │   (Port 8002)   │ ◄── AI Agents
                       └─────────────────┘
```

## 🚀 Quick Start

### **1. Start the Data Integration Service**

```bash
# Start with data integration profile
docker-compose --profile data-integration up -d

# Or start specific services
docker-compose up -d postgres redis qdrant minio data-integration
```

### **2. Verify Services**

```bash
# Check service health
curl http://localhost:8001/health

# Access service documentation
open http://localhost:8001/docs

# Check vector database
curl http://localhost:6333/health

# Access file storage console
open http://localhost:9001  # MinIO Console
```

### **3. Create Your First Database**

```bash
# Create a business database
curl -X POST "http://localhost:8001/api/v1/databases" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "customer_data",
    "description": "Customer information and support history",
    "schema_definition": {
      "tables": {
        "customers": {
          "fields": {
            "id": "integer",
            "name": "string",
            "email": "string",
            "phone": "string"
          }
        }
      }
    }
  }'
```

## 📊 API Endpoints

### **Database Management**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/databases` | Create new database |
| GET | `/api/v1/databases` | List all databases |
| GET | `/api/v1/databases/{id}` | Get database details |
| PUT | `/api/v1/databases/{id}` | Update database |
| DELETE | `/api/v1/databases/{id}` | Delete database |

### **File Upload & Processing**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/databases/{id}/upload` | Upload data file |
| GET | `/api/v1/databases/{id}/sources` | List data sources |
| GET | `/api/v1/jobs/{id}` | Check processing status |

### **Agent Binding**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/databases/{id}/bind-agent` | Bind agent to database |
| GET | `/api/v1/databases/{id}/bindings` | List agent bindings |
| DELETE | `/api/v1/bindings/{id}` | Remove agent binding |

### **Query & Search**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/query` | Execute database query |
| POST | `/api/v1/search` | Semantic search |
| GET | `/api/v1/databases/{id}/schema` | Get database schema |

## 🔌 MCP (Model Context Protocol) Integration

### **MCP Server Connection**

The MCP server runs on WebSocket port 8002 and provides a standardized interface for AI agents to access business databases.

```javascript
// Connect to MCP server
const ws = new WebSocket('ws://localhost:8002');

// Authenticate agent
ws.send(JSON.stringify({
  operation: 'authenticate',
  agent_id: 'agent-uuid',
  business_id: 'business-uuid',
  request_id: 'req-123'
}));

// Query database
ws.send(JSON.stringify({
  operation: 'query_database',
  database_id: 'db-uuid',
  query: {
    table: 'customers',
    filters: { status: 'active' },
    limit: 10
  },
  request_id: 'req-124'
}));

// Semantic search
ws.send(JSON.stringify({
  operation: 'search_knowledge',
  query: 'customer support issues',
  limit: 5,
  request_id: 'req-125'
}));
```

### **MCP Operations**

| Operation | Description | Parameters |
|-----------|-------------|------------|
| `authenticate` | Authenticate agent | `agent_id`, `business_id` |
| `list_databases` | Get available databases | None |
| `query_database` | Execute structured query | `database_id`, `query` |
| `search_knowledge` | Semantic search | `query`, `database_id?`, `limit?` |
| `get_schema` | Get database schema | `database_id` |
| `execute_query` | Execute raw SQL | `database_id`, `sql` |

## 📁 File Processing

### **Supported Formats**

| Format | Extension | Processing Method |
|--------|-----------|-------------------|
| Excel | `.xlsx`, `.xls` | Pandas + openpyxl |
| CSV | `.csv` | Pandas |
| JSON | `.json` | Native JSON parser |
| PDF | `.pdf` | PyPDF2 + text extraction |
| Text | `.txt` | Direct text processing |
| Word | `.docx` | python-docx |

### **Processing Pipeline**

1. **Upload Validation**: File type, size, and security checks
2. **Content Extraction**: Parse and extract text/data
3. **Data Transformation**: Convert to standardized format
4. **Chunking**: Split large documents for vector indexing
5. **Vector Embedding**: Generate embeddings using OpenAI
6. **Database Storage**: Store structured data and metadata
7. **Index Creation**: Add to vector database for search

### **Example File Upload**

```bash
# Upload Excel file
curl -X POST "http://localhost:8001/api/v1/databases/db-uuid/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@customer_data.xlsx" \
  -F "name=Customer Database"
```

## 🔍 Vector Search

### **Semantic Search Features**

- **Similarity Search**: Find content similar to query text
- **Contextual Retrieval**: Get relevant business information
- **Multi-Database Search**: Search across multiple databases
- **Metadata Filtering**: Filter results by source, date, etc.
- **Relevance Scoring**: Ranked results with similarity scores

### **Search Example**

```bash
# Semantic search
curl -X POST "http://localhost:8001/api/v1/search" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "customer complaints about billing",
    "database_ids": ["db-uuid-1", "db-uuid-2"],
    "limit": 10,
    "similarity_threshold": 0.7
  }'
```

## 🔒 Security & Access Control

### **Authentication**
- **JWT Tokens**: Shared authentication with main service
- **Business Isolation**: Strict business_id filtering
- **Agent Verification**: Validate agent ownership

### **File Security**
- **Type Validation**: Whitelist allowed file types
- **Size Limits**: Configurable maximum file sizes
- **Virus Scanning**: Optional malware detection
- **Content Sanitization**: Remove potentially harmful content

### **Database Access**
- **Binding-Based Access**: Agents can only access bound databases
- **Read-Only Queries**: Prevent data modification through MCP
- **Query Timeouts**: Prevent long-running queries
- **Rate Limiting**: Prevent abuse and DoS attacks

## 📈 Monitoring & Observability

### **Health Checks**
```bash
# Service health
curl http://localhost:8001/health

# Database connectivity
curl http://localhost:8001/api/v1/health/database

# Vector database status
curl http://localhost:6333/health
```

### **Metrics**
- **File Processing**: Upload success rate, processing time
- **Query Performance**: Response time, query volume
- **Vector Search**: Search accuracy, index size
- **MCP Connections**: Active connections, message volume

### **Logging**
- **Structured Logging**: JSON format with correlation IDs
- **Request Tracing**: Track requests across services
- **Error Tracking**: Detailed error logs and stack traces
- **Audit Logs**: Track data access and modifications

## 🚀 Deployment

### **Environment Variables**

```bash
# Core Configuration
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
VECTOR_DB_URL=http://qdrant:6333

# AI Configuration
OPENAI_API_KEY=your-openai-key
EMBEDDING_MODEL=text-embedding-ada-002

# File Storage
FILE_STORAGE_PATH=/app/storage
MAX_FILE_SIZE=104857600  # 100MB
SUPPORTED_FORMATS=xlsx,csv,json,pdf,txt,docx

# Security
SECRET_KEY=your-secret-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

### **Production Considerations**

1. **Scaling**: Use load balancers for multiple instances
2. **Storage**: Configure persistent volumes for file storage
3. **Backup**: Regular backups of databases and vector indices
4. **SSL/TLS**: Enable HTTPS for all external endpoints
5. **Monitoring**: Set up Prometheus metrics and alerting

## 🔧 Development

### **Local Development Setup**

```bash
# Clone and setup
git clone <repository>
cd mvp/data-integration-service

# Install dependencies
pip install -r requirements.txt

# Run locally
python main.py

# Run tests
pytest tests/
```

### **Adding New File Processors**

```python
# app/services/processors/custom_processor.py
from app.services.file_processor import BaseProcessor

class CustomProcessor(BaseProcessor):
    def can_process(self, file_type: str) -> bool:
        return file_type in ['custom', 'special']
    
    async def process(self, file_path: str) -> List[Dict]:
        # Custom processing logic
        return processed_data
```

This guide provides everything needed to implement and integrate the Data Integration Service with the existing MVP platform.
