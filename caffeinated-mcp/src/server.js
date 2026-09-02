import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import { connectMongo } from './db/mongo.js';
import { registerTopicTools } from './tools/topics.js';
import { authenticateRequest } from './auth.js';

import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(express.json());

const PORT = 3001;

const createServer = (user) => {
    const server = new McpServer({
        name: 'caffeinated-mcp',
        version: '1.0.0'
    });

    registerTopicTools(server, user);

    return server;
};

app.post(
    '/mcp',
    authenticateRequest,
    async (req, res) => {
        const server = createServer(req.user);

        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined
        });

        res.on('close', () => {
            transport.close();
            server.close();
        });

        try {
            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
        } catch (error) {
            console.error('MCP request failed:', error);

            if (!res.headersSent) {
                res.status(500).json({
                    error: 'Internal server error'
                });
            }
        }
    });

connectMongo()
    .then(() => {
        app.listen(PORT, () => {
            console.log(
                `Caffeinated MCP running on http://127.0.0.1:${PORT}/mcp`
            );
        });
    })
    .catch((error) => {
        console.error(
            'MongoDB connection failed:',
            error
        );

        process.exit(1);
    });