// deno-lint-ignore-file
import console from 'node:console';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * DRHLoader for TypeScript.
 * Formats and emits Singer-compliant messages to stdout.
 */
export class DRHLoader {
    constructor() {}

    /**
     * Emits a Singer-compliant SCHEMA message.
     */
    emitSchema(streamName: string, schema: any, keyProperties: string[] = []): void {
        const message = {
            type: 'SCHEMA',
            stream: streamName,
            schema: schema,
            key_properties: keyProperties,
            emitted_at: new Date().toISOString()
        };
        this.write(message);
    }

    /**
     * Emits a Singer-compliant RECORD message.
     */
    emitRecord(streamName: string, record: any): void {
        const message = {
            type: 'RECORD',
            stream: streamName,
            record: record,
            emitted_at: new Date().toISOString()
        };
        this.write(message);
    }

    /**
     * Emits a Singer-compliant STATE message.
     */
    emitState(state: any): void {
        const message = {
            type: 'STATE',
            value: state,
            emitted_at: new Date().toISOString()
        };
        this.write(message);
    }

    /**
     * Standardizes the output to stdout for external capture.
     */
    private write(message: any): void {
        process.stdout.write(JSON.stringify(message) + '\n');
    }
}

/**
 * Helper to load schema files from the local filesystem.
 */
export const getSchema = (tableName: string): any | null => {
    try {
        const fullPath = path.resolve(__dirname, 'schemas', `${tableName}.json`);
        
        if (!fs.existsSync(fullPath)) {
            return null;
        }

        const fileContent = fs.readFileSync(fullPath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`Error loading schema for ${tableName}:`, error);
        return null;
    }
};