import axios, { AxiosInstance } from 'axios';

// Data Integration API base URL
const DATA_INTEGRATION_API_URL = process.env.REACT_APP_DATA_INTEGRATION_API_URL || 'http://localhost:8001/api/v1';

// Create axios instance for data integration service
const dataIntegrationApi: AxiosInstance = axios.create({
  baseURL: DATA_INTEGRATION_API_URL,
  timeout: 60000, // Longer timeout for file uploads
});

// Request interceptor to add auth token
dataIntegrationApi.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Types
export interface Database {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  schema_definition: any;
  database_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DataSource {
  id: string;
  database_id: string;
  business_id: string;
  name: string;
  source_type: string;
  file_path?: string;
  file_size?: number;
  file_hash?: string;
  metadata: any;
  processing_status: string;
  processing_error?: string;
  records_count: number;
  created_at: string;
  processed_at?: string;
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  size: number;
  status: string;
  message: string;
}

export interface ProcessingStatus {
  id: string;
  status: string;
  progress: number;
  error?: string;
  records_processed: number;
  started_at: string;
  completed_at?: string;
}

export interface DatabaseCreate {
  name: string;
  description?: string;
  schema_definition?: any;
  database_type?: string;
}

export interface SearchResult {
  query: string;
  results: SearchResultItem[];
  total_count: number;
  execution_time_ms: number;
}

export interface SearchResultItem {
  content: string;
  score: number;
  data_source_id: string;
  metadata: any;
}

export interface QueryResult {
  query_type: string;
  query: string;
  results: any[];
  total_count: number;
  execution_time_ms: number;
}

export interface AgentBinding {
  id: string;
  agent_id: string;
  database_id: string;
  business_id: string;
  binding_config: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSchema {
  tables: any[];
  relationships: any[];
  indexes: any[];
  constraints: any[];
}

export interface MCPConnection {
  id: string;
  agent_id: string;
  agent_name: string;
  connected_at: string;
  last_activity: string;
  status: string;
}

// Data Integration Service
export const dataIntegrationService = {
  // Database Management
  async createDatabase(data: DatabaseCreate): Promise<Database> {
    const response = await dataIntegrationApi.post('/databases', data);
    return response.data;
  },

  async listDatabases(): Promise<Database[]> {
    const response = await dataIntegrationApi.get('/databases');
    return response.data;
  },

  async getDatabase(databaseId: string): Promise<Database> {
    const response = await dataIntegrationApi.get(`/databases/${databaseId}`);
    return response.data;
  },

  async updateDatabase(databaseId: string, data: Partial<DatabaseCreate>): Promise<Database> {
    const response = await dataIntegrationApi.put(`/databases/${databaseId}`, data);
    return response.data;
  },

  async deleteDatabase(databaseId: string): Promise<void> {
    await dataIntegrationApi.delete(`/databases/${databaseId}`);
  },

  // File Management
  async uploadFile(file: File, databaseId: string, description?: string): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('database_id', databaseId);
    if (description) {
      formData.append('description', description);
    }

    const response = await dataIntegrationApi.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload Progress: ${percentCompleted}%`);
        }
      },
    });
    return response.data;
  },

  async listDataSources(databaseId?: string): Promise<DataSource[]> {
    const params = databaseId ? { database_id: databaseId } : {};
    const response = await dataIntegrationApi.get('/files/sources', { params });
    return response.data;
  },

  async getDataSource(sourceId: string): Promise<DataSource> {
    const response = await dataIntegrationApi.get(`/files/sources/${sourceId}`);
    return response.data;
  },

  async getProcessingStatus(sourceId: string): Promise<ProcessingStatus> {
    const response = await dataIntegrationApi.get(`/files/sources/${sourceId}/status`);
    return response.data;
  },

  async deleteDataSource(sourceId: string): Promise<void> {
    await dataIntegrationApi.delete(`/files/sources/${sourceId}`);
  },

  // Search and Query
  async searchData(query: string, databaseId?: string, limit: number = 10, scoreThreshold: number = 0.7): Promise<SearchResult> {
    const response = await dataIntegrationApi.post('/search', {
      query,
      database_id: databaseId,
      limit,
      score_threshold: scoreThreshold,
    });
    return response.data;
  },

  async queryDatabase(query: string, databaseId: string, queryType: string = 'semantic'): Promise<QueryResult> {
    const response = await dataIntegrationApi.post('/query', {
      query_type: queryType,
      query,
      database_id: databaseId,
    });
    return response.data;
  },

  // Agent Binding Management
  async bindAgentToDatabase(databaseId: string, agentId: string, config: any = {}): Promise<AgentBinding> {
    const response = await dataIntegrationApi.post(`/databases/${databaseId}/bind-agent`, {
      agent_id: agentId,
      binding_config: config,
    });
    return response.data;
  },

  async listAgentBindings(databaseId: string): Promise<AgentBinding[]> {
    const response = await dataIntegrationApi.get(`/databases/${databaseId}/bindings`);
    return response.data;
  },

  async removeAgentBinding(bindingId: string): Promise<void> {
    await dataIntegrationApi.delete(`/bindings/${bindingId}`);
  },

  async getDatabaseSchema(databaseId: string): Promise<DatabaseSchema> {
    const response = await dataIntegrationApi.get(`/databases/${databaseId}/schema`);
    return response.data;
  },

  // MCP Server Management
  async getMCPServerStats(): Promise<any> {
    const response = await dataIntegrationApi.get('/mcp/stats');
    return response.data;
  },

  async getMCPConnections(): Promise<MCPConnection[]> {
    const response = await dataIntegrationApi.get('/mcp/connections');
    return response.data;
  },

  async startMCPServer(): Promise<void> {
    await dataIntegrationApi.post('/mcp/start');
  },

  async stopMCPServer(): Promise<void> {
    await dataIntegrationApi.post('/mcp/stop');
  },

  async updateMCPServerConfig(config: any): Promise<void> {
    await dataIntegrationApi.put('/mcp/config', config);
  },

  // WebSocket connection for real-time updates
  createWebSocketConnection(businessId: string): WebSocket {
    const wsUrl = `ws://localhost:8003/ws/${businessId}`;
    return new WebSocket(wsUrl);
  },
};

export default dataIntegrationService;
