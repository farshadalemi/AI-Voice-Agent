# AI Voice Agent Platform - Deployment Guide

## Infrastructure Overview

### Cloud Provider: AWS (Primary)
- **Compute**: EKS (Kubernetes) for container orchestration
- **Database**: RDS PostgreSQL with Multi-AZ deployment
- **Cache**: ElastiCache Redis cluster
- **Storage**: S3 for file storage, EFS for shared storage
- **CDN**: CloudFront for global content delivery
- **Load Balancer**: Application Load Balancer (ALB)

### Alternative: Azure/GCP
- **Azure**: AKS, Azure Database for PostgreSQL, Azure Cache for Redis
- **GCP**: GKE, Cloud SQL PostgreSQL, Memorystore Redis

## Kubernetes Architecture

### Namespaces
```yaml
# Production namespaces
- voice-agent-prod
- voice-agent-monitoring
- voice-agent-ingress

# Staging namespaces  
- voice-agent-staging
```

### Core Services Deployment

#### 1. API Gateway (Kong)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kong-gateway
  namespace: voice-agent-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kong-gateway
  template:
    metadata:
      labels:
        app: kong-gateway
    spec:
      containers:
      - name: kong
        image: kong:3.4
        ports:
        - containerPort: 8000
        - containerPort: 8001
        env:
        - name: KONG_DATABASE
          value: "postgres"
        - name: KONG_PG_HOST
          value: "postgres-service"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

#### 2. Business Management Service
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: business-service
  namespace: voice-agent-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: business-service
  template:
    metadata:
      labels:
        app: business-service
    spec:
      containers:
      - name: business-service
        image: voice-agent/business-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "200m"
```

#### 3. AI Agent Service
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-agent-service
  namespace: voice-agent-prod
spec:
  replicas: 5
  selector:
    matchLabels:
      app: ai-agent-service
  template:
    metadata:
      labels:
        app: ai-agent-service
    spec:
      containers:
      - name: ai-agent
        image: voice-agent/ai-agent:latest
        ports:
        - containerPort: 8080
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-credentials
              key: openai-key
        - name: PINECONE_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-credentials
              key: pinecone-key
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

### Database Configuration

#### PostgreSQL RDS Setup
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier voice-agent-prod \
  --db-instance-class db.r5.xlarge \
  --engine postgres \
  --engine-version 14.9 \
  --master-username voiceagent \
  --master-user-password $DB_PASSWORD \
  --allocated-storage 100 \
  --storage-type gp2 \
  --vpc-security-group-ids sg-12345678 \
  --db-subnet-group-name voice-agent-subnet-group \
  --multi-az \
  --storage-encrypted \
  --backup-retention-period 7 \
  --deletion-protection
```

#### Redis ElastiCache Setup
```bash
# Create Redis cluster
aws elasticache create-replication-group \
  --replication-group-id voice-agent-redis \
  --description "Voice Agent Redis Cluster" \
  --num-cache-clusters 3 \
  --cache-node-type cache.r5.large \
  --engine redis \
  --engine-version 7.0 \
  --security-group-ids sg-87654321 \
  --subnet-group-name voice-agent-cache-subnet
```

### Monitoring & Logging

#### Prometheus & Grafana
```yaml
# Prometheus deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: voice-agent-monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
        - name: storage
          mountPath: /prometheus
      volumes:
      - name: config
        configMap:
          name: prometheus-config
      - name: storage
        persistentVolumeClaim:
          claimName: prometheus-storage
```

#### ELK Stack for Logging
```yaml
# Elasticsearch deployment
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: elasticsearch
  namespace: voice-agent-monitoring
spec:
  serviceName: elasticsearch
  replicas: 3
  selector:
    matchLabels:
      app: elasticsearch
  template:
    metadata:
      labels:
        app: elasticsearch
    spec:
      containers:
      - name: elasticsearch
        image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
        ports:
        - containerPort: 9200
        - containerPort: 9300
        env:
        - name: discovery.type
          value: zen
        - name: ES_JAVA_OPTS
          value: "-Xms1g -Xmx1g"
        volumeMounts:
        - name: data
          mountPath: /usr/share/elasticsearch/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 100Gi
```

### Security Configuration

#### Network Policies
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: voice-agent-network-policy
  namespace: voice-agent-prod
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: voice-agent-ingress
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
```

#### SSL/TLS Configuration
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: tls-secret
  namespace: voice-agent-prod
type: kubernetes.io/tls
data:
  tls.crt: LS0tLS1CRUdJTi... # Base64 encoded certificate
  tls.key: LS0tLS1CRUdJTi... # Base64 encoded private key
```

### CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Build and push Docker images
      run: |
        docker build -t voice-agent/business-service:${{ github.sha }} ./services/business
        docker build -t voice-agent/ai-agent:${{ github.sha }} ./services/ai-agent
        
        aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
        docker push voice-agent/business-service:${{ github.sha }}
        docker push voice-agent/ai-agent:${{ github.sha }}
    
    - name: Deploy to Kubernetes
      run: |
        aws eks update-kubeconfig --name voice-agent-cluster
        kubectl set image deployment/business-service business-service=voice-agent/business-service:${{ github.sha }}
        kubectl set image deployment/ai-agent-service ai-agent=voice-agent/ai-agent:${{ github.sha }}
        kubectl rollout status deployment/business-service
        kubectl rollout status deployment/ai-agent-service
```

### Scaling Configuration

#### Horizontal Pod Autoscaler
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-agent-hpa
  namespace: voice-agent-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-agent-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### Cluster Autoscaler
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
    spec:
      containers:
      - image: k8s.gcr.io/autoscaling/cluster-autoscaler:v1.21.0
        name: cluster-autoscaler
        command:
        - ./cluster-autoscaler
        - --v=4
        - --stderrthreshold=info
        - --cloud-provider=aws
        - --skip-nodes-with-local-storage=false
        - --expander=least-waste
        - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/voice-agent-cluster
```

### Backup & Disaster Recovery

#### Database Backup
```bash
# Automated RDS snapshots
aws rds create-db-snapshot \
  --db-instance-identifier voice-agent-prod \
  --db-snapshot-identifier voice-agent-backup-$(date +%Y%m%d%H%M%S)

# Cross-region backup replication
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier voice-agent-backup-latest \
  --target-db-snapshot-identifier voice-agent-backup-dr \
  --source-region us-east-1 \
  --target-region us-west-2
```

#### Application Data Backup
```bash
# S3 cross-region replication
aws s3api put-bucket-replication \
  --bucket voice-agent-storage \
  --replication-configuration file://replication-config.json
```

### Environment Variables & Secrets

#### Production Secrets
```bash
# Create Kubernetes secrets
kubectl create secret generic db-credentials \
  --from-literal=url="postgresql://user:pass@host:5432/db" \
  --namespace=voice-agent-prod

kubectl create secret generic ai-credentials \
  --from-literal=openai-key="sk-..." \
  --from-literal=pinecone-key="..." \
  --namespace=voice-agent-prod

kubectl create secret generic twilio-credentials \
  --from-literal=account-sid="AC..." \
  --from-literal=auth-token="..." \
  --namespace=voice-agent-prod
```

### Health Checks & Readiness Probes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```
