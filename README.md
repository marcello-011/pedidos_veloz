#
POSTGRES_DB=pedidosveloz
2112
# Mensageria
RABBITMQ_USER=veloz
RABBITMQ_PASS=veloz_rabbit

# Observabilidade
GRAFANA_PASS=admin
```

### URLs do ambiente local

| Serviço | URL |
|---|---|
| API Gateway | http://localhost:8080 |
| RabbitMQ Management | http://localhost:15672 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |

### Testar a API

```bash
# Health check
curl http://localhost:8080/health

# Criar pedido
curl -X POST http://localhost:8080/pedidos \
  -H "Content-Type: application/json" \
  -d '{"cliente_id": "123", "itens": [{"produto_id": "abc", "quantidade": 2}]}'

# Consultar pedido
curl http://localhost:8080/pedidos/{id}
```

### Parar o ambiente

```bash
docker compose down          # Para e remove containers
docker compose down -v       # Para, remove containers E volumes
```

---

## Estrutura do Repositório

```
pedidos-veloz/
├── .github/
│   └── workflows/
│       └── ci-cd.yaml              # Pipeline GitHub Actions
├── services/
│   ├── api-gateway/
│   │   ├── Dockerfile              # Multi-stage (dev + prod)
│   │   ├── main.py
│   │   └── requirements.txt
│   ├── pedidos/
│   │   ├── Dockerfile
│   │   ├── src/
│   │   └── package.json
│   ├── pagamentos/
│   │   └── Dockerfile
│   └── estoque/
│       └── Dockerfile
├── k8s/
│   └── base/
│       ├── namespace.yaml          # Namespace + Pod Security Admission
│       ├── configmap.yaml          # ConfigMap + Secret (placeholders)
│       ├── pedidos-deployment.yaml # Deployment + Service
│       └── hpa.yaml                # HPA + API Gateway Deployment + Ingress
├── terraform/
│   ├── main.tf                     # EKS + VPC + RDS
│   └── variables.tf
├── docker/
│   └── prometheus.yml              # Config Prometheus local
├── docs/
│   ├── relatorio-teorico.docx      # Parte Teórica
│   └── relatorio-pratico.docx      # Parte Prática
├── docker-compose.yml              # Ambiente local completo
├── .env.example
└── README.md
```

---

## Conteinerização

### Boas práticas adotadas

- **Multi-stage build**: estágio de build separado do runtime — imagem final sem ferramentas de compilação
- **Usuário não-root**: `USER velozuser` com UID 1001 em todas as imagens
- **Imagem base mínima**: `node:20-alpine` e `python:3.12-slim` (menor superfície de ataque)
- **Cache de layers**: `COPY package*.json ./` antes do `npm ci` para reutilizar cache
- **`readOnlyRootFilesystem`**: sistema de arquivos somente-leitura em produção
- **Health-check nativo**: `HEALTHCHECK` no Dockerfile para Docker Compose

### Versionamento de imagens

```
ghcr.io/lojaveloz/pedidosveloz/pedidos:sha-a1b2c3d  # imutável por commit
ghcr.io/lojaveloz/pedidosveloz/pedidos:1.2.3         # versão semântica
ghcr.io/lojaveloz/pedidosveloz/pedidos:latest         # ponta do main
```

---

## Kubernetes — Produção

### Aplicar os manifests

```bash
# Configurar kubectl (após terraform apply)
aws eks update-kubeconfig --region us-east-1 --name pedidosveloz-production

# Aplicar em ordem
kubectl apply -f k8s/base/namespace.yaml
kubectl apply -f k8s/base/configmap.yaml
kubectl apply -f k8s/base/

# Verificar status
kubectl get all -n pedidosveloz
kubectl get hpa -n pedidosveloz
```

### Segurança implementada

- **Pod Security Admission** (nível `restricted`) no namespace — bloqueia root, capabilities desnecessárias
- **`readOnlyRootFilesystem: true`** + volume `emptyDir` para `/tmp`
- **`capabilities.drop: ["ALL"]`** em todos os containers
- **`seccompProfile: RuntimeDefault`** para filtragem de syscalls
- **ConfigMaps** para configurações não-sensíveis
- **Secrets** com anotação `external-secrets-operator` para gestão em produção

---

## Pipeline CI/CD

### Fluxo de entrega

```
feature/* push  →  lint + testes
main push       →  lint + testes + build + push + deploy staging
tag v*.*.*      →  lint + testes + build + push + deploy produção
```

### Secrets necessários no GitHub

| Secret | Descrição |
|---|---|
| `KUBE_CONFIG_STAGING` | kubeconfig staging (base64) |
| `KUBE_CONFIG_PROD` | kubeconfig produção (base64) |
| `SLACK_WEBHOOK_URL` | Webhook para notificações |
| `GITHUB_TOKEN` | Automático (push GHCR) |

---

## Observabilidade

### Stack de observabilidade

| Pilar | Ferramenta | Função |
|---|---|---|
| Métricas | Prometheus + Grafana | Dashboards de latência, erros, saturação (RED method) |
| Logs | Loki + Promtail | Logs estruturados (JSON) centralizados e pesquisáveis |
| Traces | OpenTelemetry + Jaeger | Rastreamento distribuído entre serviços |

### Tracing distribuído

Cada serviço é instrumentado com o SDK do OpenTelemetry, que propaga o `trace_id` via HTTP headers (`traceparent`). Isso permite correlacionar uma requisição do API Gateway até o banco de dados, identificando exatamente onde a latência é introduzida.

```
API Gateway (span: 150ms)
  └── Pedidos (span: 120ms)
        ├── Pagamentos (span: 80ms)
        │     └── Gateway Externo (span: 70ms)
        └── Estoque (span: 30ms)
              └── PostgreSQL (span: 15ms)
```

### SLOs (Service Level Objectives) — MVP

- **Disponibilidade:** ≥ 99.5% (permite ~3.6h downtime/mês)
- **Latência P95:** ≤ 500ms para `POST /pedidos`
- **Taxa de erros:** ≤ 0.1%

---

## Estratégia de Deploy

### Rolling Update (padrão adotado)

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1        # 1 pod extra durante o update
    maxUnavailable: 0  # Zero pods indisponíveis
```

**Por que Rolling Update?** É nativo do Kubernetes (zero custo de infraestrutura adicional), garante zero-downtime e permite rollback instantâneo:

```bash
# Reverter para versão anterior em caso de problema
kubectl rollout undo deployment/pedidos -n pedidosveloz

# Verificar histórico de deployments
kubectl rollout history deployment/pedidos -n pedidosveloz
```

**Para o evento promocional**, o pré-aquecimento manual garante capacidade antes do pico:

```bash
# Aumentar réplicas antes do pico previsto
kubectl scale deployment pedidos --replicas=6 -n pedidosveloz
kubectl scale deployment api-gateway --replicas=8 -n pedidosveloz
```

---

## Escalabilidade

### HPA (Horizontal Pod Autoscaler)

| Serviço | minReplicas | maxReplicas | Target CPU |
|---|---|---|---|
| api-gateway | 2 | 15 | 60% |
| pedidos | 2 | 10 | 60% |

### Por que HPA e não VPA?

O VPA (Vertical Pod Autoscaler) ajusta requests/limits de CPU e memória, mas exige restart dos pods para aplicar mudanças — inaceitável durante picos de tráfego. O HPA escala horizontalmente sem restart, sendo mais adequado para workloads HTTP stateless. O VPA pode ser usado complementarmente para **definir os valores ideais de requests/limits** em ambiente de staging, e os valores encontrados são então fixados nos manifests de produção.

---

## Infraestrutura como Código

```bash
cd terraform/

# Inicializar (baixa providers e configura backend S3)
terraform init

# Planejar mudanças (dry-run)
terraform plan -var-file=envs/production.tfvars

# Aplicar infraestrutura
terraform apply -var-file=envs/production.tfvars

# Destruir (cuidado em produção!)
terraform destroy -var-file=envs/production.tfvars
```

### O que o Terraform provisiona

- VPC com subnets públicas e privadas em 3 AZs
- Cluster EKS gerenciado (versão 1.29)
- Node groups com Cluster Autoscaler
- RDS PostgreSQL 16 com Multi-AZ em produção
- State remoto no S3 com lock via DynamoDB

---

## Vídeo Pitch

📺 **[Assista no YouTube]([[https://youtube.com/watch?v=LINK_AQUI]](https://youtu.be/Y0baX1EFFUE))** ← *substituir pelo link real*

Conteúdo do vídeo (≤ 4 minutos):
1. Visão geral da arquitetura e problema resolvido
2. Demonstração do ambiente local (`docker compose up`)
3. Walkthrough do pipeline CI/CD
4. Estratégia de deploy e observabilidade

---

## Referências

- [Google Online Boutique — Referência de E-commerce Cloud-Native](https://github.com/GoogleCloudPlatform/microservices-demo)
- [Documentação oficial Kubernetes](https://kubernetes.io/docs/)
- [12-Factor App Methodology](https://12factor.net/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Terraform AWS EKS Module](https://registry.terraform.io/modules/terraform-aws-modules/eks/aws)
- [Trivy — Container Security Scanner](https://trivy.dev/)
