# Secret Management Integration Guide

> Securely manage sensitive credentials using Azure Key Vault or AWS Secrets Manager

---

## Overview

This guide demonstrates how to integrate enterprise secret management solutions with PTF to avoid storing credentials in `.env` files or code.

**Supported Solutions:**

- Azure Key Vault
- AWS Secrets Manager
- HashiCorp Vault (community)

---

## Azure Key Vault Integration

### Prerequisites

```bash
npm install @azure/keyvault-secrets @azure/identity
```

### Implementation

#### 1. Create Secret Manager Utility

```typescript
// src/utils/AzureSecretManager.ts
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';
import { logger } from './Logger';

export class AzureSecretManager {
  private client: SecretClient;

  constructor(vaultUrl: string) {
    const credential = new DefaultAzureCredential();
    this.client = new SecretClient(vaultUrl, credential);
    logger.info(`[AzureSecretManager] Connected to ${vaultUrl}`);
  }

  async getSecret(secretName: string): Promise<string> {
    const secret = await this.client.getSecret(secretName);
    logger.info(`[AzureSecretManager] Retrieved secret: ${secretName}`);
    return secret.value || '';
  }

  async setSecret(secretName: string, value: string): Promise<void> {
    await this.client.setSecret(secretName, value);
    logger.info(`[AzureSecretManager] Set secret: ${secretName}`);
  }
}
```

#### 2. Usage in Config

```typescript
// src/config/index.ts
import { AzureSecretManager } from '../utils/AzureSecretManager';

const vaultUrl = process.env.AZURE_KEYVAULT_URL!;
const secretManager = new AzureSecretManager(vaultUrl);

export class Config {
  async getDatabasePassword(): Promise<string> {
    return await secretManager.getSecret('database-password');
  }

  async getApiToken(): Promise<string> {
    return await secretManager.getSecret('api-token');
  }
}
```

#### 3. Global Setup Integration

```typescript
// src/global-setup.ts
import { config } from './config';

async function globalSetup() {
  // Retrieve secrets at runtime
  const dbPassword = await config.getDatabasePassword();
  const apiToken = await config.getApiToken();

  // Use in tests
  process.env.DB_PASSWORD = dbPassword;
  process.env.API_TOKEN = apiToken;
}

export default globalSetup;
```

---

## AWS Secrets Manager Integration

### Prerequisites

```bash
npm install @aws-sdk/client-secrets-manager
```

### Implementation

#### 1. Create Secret Manager Utility

```typescript
// src/utils/AwsSecretManager.ts
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { logger } from './Logger';

export class AwsSecretManager {
  private client: SecretsManagerClient;

  constructor(region: string = 'us-east-1') {
    this.client = new SecretsManagerClient({ region });
    logger.info(`[AwsSecretManager] Initialized for region: ${region}`);
  }

  async getSecret(secretName: string): Promise<string> {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await this.client.send(command);
    logger.info(`[AwsSecretManager] Retrieved secret: ${secretName}`);
    return response.SecretString || '';
  }

  async getSecretJson<T = Record<string, unknown>>(secretName: string): Promise<T> {
    const secretString = await this.getSecret(secretName);
    return JSON.parse(secretString) as T;
  }
}
```

#### 2. Usage in Tests

```typescript
import { test } from '@core/fixtures';
import { AwsSecretManager } from '@utils';

test.describe('API Tests', () => {
  let apiCredentials: { username: string; password: string };

  test.beforeAll(async () => {
    const secretManager = new AwsSecretManager('us-east-1');
    apiCredentials = await secretManager.getSecretJson('api-credentials');
  });

  test('authenticate with API', async ({ request }) => {
    const response = await request.post('/api/auth', {
      data: apiCredentials,
    });
    expect(response.ok()).toBeTruthy();
  });
});
```

---

## Environment Configuration

### Azure Key Vault

```bash
# .env (only non-sensitive config)
AZURE_KEYVAULT_URL=https://your-vault.vault.azure.net/
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id

# Secrets stored in Azure Key Vault:
# - database-password
# - api-token
# - sauce-credentials
# - parabank-credentials
```

### AWS Secrets Manager

```bash
# .env (only non-sensitive config)
AWS_REGION=us-east-1

# Secrets stored in AWS Secrets Manager:
# - prod/database-credentials
# - prod/api-tokens
# - test/sauce-credentials
```

---

## Best Practices

### 1. Secret Naming Convention

```
{environment}/{application}/{secret-name}

Examples:
- prod/ptf/database-password
- staging/ptf/api-token
- dev/ptf/sauce-credentials
```

### 2. Access Control

- **Use managed identities** (Azure) or IAM roles (AWS)
- **Principle of least privilege**: Grant only required permissions
- **Rotate secrets regularly**: Set expiration policies

### 3. Caching

```typescript
export class SecretCache {
  private cache = new Map<string, { value: string; expiry: number }>();

  async get(secretName: string, ttlMs = 300000): Promise<string> {
    const cached = this.cache.get(secretName);
    if (cached && Date.now() < cached.expiry) {
      return cached.value;
    }

    const value = await secretManager.getSecret(secretName);
    this.cache.set(secretName, {
      value,
      expiry: Date.now() + ttlMs,
    });

    return value;
  }
}
```

### 4. Error Handling

```typescript
try {
  const secret = await secretManager.getSecret('api-token');
} catch (error) {
  logger.error(`Failed to retrieve secret: ${error.message}`);
  // Fallback to .env for local development
  const fallback = process.env.API_TOKEN;
  if (!fallback) {
    throw new Error('API token not found in vault or .env');
  }
  return fallback;
}
```

---

## CI/CD Integration

### GitHub Actions

```yaml
- name: Configure Azure credentials
  uses: azure/login@v1
  with:
    creds: ${{ secrets.AZURE_CREDENTIALS }}

- name: Run tests
  run: npm test
  env:
    AZURE_KEYVAULT_URL: ${{ secrets.KEYVAULT_URL }}
```

### AWS

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v1
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    aws-region: us-east-1

- name: Run tests
  run: npm test
```

---

## Migration from .env

### Step-by-Step

1. **Identify sensitive values in `.env`**
2. **Upload to secret manager**:

   ```bash
   # Azure CLI
   az keyvault secret set --vault-name your-vault --name api-token --value "xxx"

   # AWS CLI
   aws secretsmanager create-secret --name prod/api-token --secret-string "xxx"
   ```

3. **Update config to use secret manager**
4. **Remove from `.env` and `.env.example`**
5. **Update `.gitignore` to ensure secrets never committed**

---

## Troubleshooting

| Issue                 | Solution                                                 |
| --------------------- | -------------------------------------------------------- |
| Authentication failed | Verify managed identity/IAM role has correct permissions |
| Secret not found      | Check secret name and ensure it exists in vault          |
| Network timeout       | Ensure firewall allows outbound HTTPS to vault endpoint  |
| Rate limiting         | Implement caching to reduce API calls                    |

---

## Additional Resources

- [Azure Key Vault Documentation](https://aka.ms/keyvault)
- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [Best Practices for Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

_Last Updated: January 2026_
