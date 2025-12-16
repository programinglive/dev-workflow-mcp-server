export class DbAdapter {
    constructor(config = {}) {
        this.config = config;
    }

    async connect() {
        throw new Error("connect() must be implemented by subclass");
    }

    async migrate() {
        throw new Error("migrate() must be implemented by subclass");
    }

    /**
     * @param {string} userId - User identifier
     * @param {string} projectPath - Path/ID of the project
     * @param {Object} entry - Workflow history entry
     */
    async insertHistoryEntry(userId, projectPath, entry) {
        throw new Error("insertHistoryEntry() must be implemented by subclass");
    }

    async updateSummaryForUser(userId, projectPath) {
        throw new Error("updateSummaryForUser() must be implemented by subclass");
    }

    async getSummaryForUser(userId, projectPath) {
        throw new Error("getSummaryForUser() must be implemented by subclass");
    }

    async getHistoryForUser(userId, projectPath, options = {}) {
        throw new Error("getHistoryForUser() must be implemented by subclass");
    }

    async getHistorySummary(userId, projectPath, options = {}) {
        throw new Error("getHistorySummary() must be implemented by subclass");
    }

    async saveState(userId, projectPath, state) {
        throw new Error("saveState() must be implemented by subclass");
    }

    async getState(userId, projectPath) {
        throw new Error("getState() must be implemented by subclass");
    }
}
