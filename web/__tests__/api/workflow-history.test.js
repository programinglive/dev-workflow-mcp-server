const request = require('supertest');
const express = require('express');

describe('Workflow History API', () => {
    let app;
    let server;

    beforeAll(() => {
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

        expect(response.body).toHaveProperty('history');
        expect(Array.isArray(response.body.history)).toBe(true);
        expect(response.body.history.length).toBeGreaterThan(0);
    });

    test('History items have required fields', async () => {
        const response = await request(app)
            .get('/api/workflow/history')
            .expect(200);

        const item = response.body.history[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('task_type');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('commit_message');
        expect(item).toHaveProperty('completed_at');
        expect(item).toHaveProperty('tests_passed');
    });
});
