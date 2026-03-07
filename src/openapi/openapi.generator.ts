import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { openApiInfo, servers, tags, routes } from './openapi.config';

type SchemaObject = Record<string, unknown>;
type OperationObject = Record<string, unknown>;
type PathsObject = Record<string, Record<string, OperationObject>>;

function buildPaths(): PathsObject {
  const paths: PathsObject = {};

  for (const route of routes) {
    if (!paths[route.path]) {
      paths[route.path] = {};
    }

    const responses: Record<string, SchemaObject> = {};
    for (const [status, response] of Object.entries(route.responses)) {
      responses[status] = {
        description: response.description,
        ...(response.schema
          ? { content: { 'application/json': { schema: response.schema } } }
          : {}),
      };
    }

    const operation: OperationObject = {
      summary: route.summary,
      ...(route.description ? { description: route.description } : {}),
      tags: route.tags,
      responses,
    };

    if (route.requestBody) {
      const rawSchema = zodToJsonSchema(route.requestBody, { target: 'openApi3' });
      // Strip the $schema key — not valid inside an OpenAPI schema object
      const { $schema, ...schema } = rawSchema as Record<string, unknown>;
      void $schema;
      operation.requestBody = {
        required: true,
        content: {
          'application/json': { schema },
        },
      };
    }

    paths[route.path][route.method] = operation;
  }

  return paths;
}

function generate() {
  const spec = {
    openapi: '3.0.3',
    info: openApiInfo,
    servers,
    tags,
    paths: buildPaths(),
  };

  const outputDir = join(process.cwd(), 'openapi');
  mkdirSync(outputDir, { recursive: true });

  const outputPath = join(outputDir, 'openapi.json');
  writeFileSync(outputPath, JSON.stringify(spec, null, 2), 'utf-8');

  console.log(`OpenAPI spec generated -> ${outputPath}`);
  console.log(`  ${Object.keys(spec.paths).length} paths documented`);
}

generate();
