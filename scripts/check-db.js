import pg from 'pg';
const { Client } = pg;

async function checkSchema() {
    const connectionString = 'postgres://udevworkflow:pdevworkflow@34.50.121.142:5432/devworkflow';
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('Connected to remote DB');

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'workflow_history'
        `);

        console.log('Columns in workflow_history:');
        res.rows.forEach(row => {
            console.log(`- ${row.column_name}: ${row.data_type}`);
        });

        // Check if there is a 'timestamp' column
        const hasTimestamp = res.rows.some(r => r.column_name === 'timestamp');
        if (!hasTimestamp) {
            console.error('❌ Column "timestamp" NOT found!');
        } else {
            console.log('✅ Column "timestamp" exists.');
        }

    } catch (e) {
        console.error('❌ DB Check failed:', e.message);
    } finally {
        await client.end();
    }
    process.exit(0);
}

checkSchema();
