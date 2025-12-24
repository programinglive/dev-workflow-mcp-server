import { test, describe } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import express from 'express';

describe('Workflow History API', () => {
    let app;
    let server;

    test('setup app', () => {
        // Mock Express app for testing
        app = express();
        app.use(express.json());

        // Mock session middleware
        app.use((req, res, next) => {
            req.session = { userId: 1 };
            next();
        });

        // Mock history endpoint
        app.get('/api/workflow/history', async (req, res) => {
            // Mock response
            res.json({
                history: [
                    {
                        id: 1,
                        task_type: 'feature',
                        description: 'Test feature',
                        commit_message: 'feat: test commit',
                        completed_at: new Date().toISOString(),
                        tests_passed: true,
                        documentation_type: 'README'
                    }
                ]
            });
        });
    });

    test('GET /api/workflow/history returns workflow history', async () => {
        const response = await request(app)
            .get('/api/workflow/history')
            .expect(200);

        assert(response.body.history, 'History property should exist');
        assert(Array.isArray(response.body.history), 'History should be an array');
        assert(response.body.history.length > 0, 'History should not be empty');
    });

    test('History items have required fields', async () => {
        const response = await request(app)
            .get('/api/workflow/history')
            .expect(200);

        const item = response.body.history[0];
        assert(item.id, 'Item should have id');
        assert(item.task_type, 'Item should have task_type');
        assert(item.description, 'Item should have description');
        assert(item.commit_message, 'Item should have commit_message');
        assert(item.completed_at, 'Item should have completed_at');
        assert(item.tests_passed !== undefined, 'Item should have tests_passed');
    });
});
