import { execSync } from 'child_process';
import path from 'path';

/**
 * Script to generate TypeScript interfaces from OpenAPI/Swagger specs.
 * Requires 'openapi-typescript' package.
 *
 * Usage: npx ts-node scripts/generate-api-types.ts
 */

const SWAGGER_URL = process.env.SWAGGER_URL || 'https://petstore.swagger.io/v2/swagger.json';
const OUTPUT_FILE = path.resolve(__dirname, '../src/api/types.d.ts');

console.log(`Generating types from ${SWAGGER_URL}...`);

try {
  // Command to run openapi-typescript
  // npx openapi-typescript <url> --output <file>
  execSync(`npx openapi-typescript ${SWAGGER_URL} --output ${OUTPUT_FILE}`, { stdio: 'inherit' });
  console.log(`Types generated successfully at ${OUTPUT_FILE}`);
} catch (error) {
  console.error('Failed to generate types. Ensure "openapi-typescript" is installed.');
  console.error('npm install -D openapi-typescript');
  process.exit(1);
}
