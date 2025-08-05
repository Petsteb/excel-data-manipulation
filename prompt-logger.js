const fs = require('fs').promises;
const path = require('path');

class PromptLogger {
  constructor() {
    this.logFile = path.join(__dirname, 'prompt-logs.json');
    this.currentPromptId = null;
    this.startTime = null;
    this.initializeLogFile();
  }

  async initializeLogFile() {
    try {
      await fs.access(this.logFile);
    } catch (error) {
      // File doesn't exist, create it
      await fs.writeFile(this.logFile, JSON.stringify({ logs: [] }, null, 2));
    }
  }

  async readLogs() {
    try {
      const data = await fs.readFile(this.logFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading logs:', error);
      return { logs: [] };
    }
  }

  async writeLogs(data) {
    try {
      await fs.writeFile(this.logFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing logs:', error);
    }
  }

  async startPrompt(promptText) {
    const data = await this.readLogs();
    
    this.currentPromptId = data.logs.length + 1;
    this.startTime = new Date();
    
    const promptEntry = {
      id: this.currentPromptId,
      timestamp: this.startTime.toISOString(),
      prompt: promptText,
      startTime: this.startTime.getTime(),
      endTime: null,
      duration: null,
      tokensUsed: null,
      status: 'in_progress',
      tasks: [],
      errors: []
    };
    
    data.logs.push(promptEntry);
    await this.writeLogs(data);
    
    return this.currentPromptId;
  }

  async updatePrompt(promptId, updates) {
    const data = await this.readLogs();
    const promptIndex = data.logs.findIndex(log => log.id === promptId);
    
    if (promptIndex !== -1) {
      data.logs[promptIndex] = { ...data.logs[promptIndex], ...updates };
      await this.writeLogs(data);
    }
  }

  async endPrompt(promptId, status = 'completed', tokensUsed = null) {
    const endTime = new Date();
    const data = await this.readLogs();
    const promptIndex = data.logs.findIndex(log => log.id === promptId);
    
    if (promptIndex !== -1) {
      const prompt = data.logs[promptIndex];
      const duration = endTime.getTime() - prompt.startTime;
      
      data.logs[promptIndex] = {
        ...prompt,
        endTime: endTime.getTime(),
        duration: duration,
        tokensUsed: tokensUsed,
        status: status,
        durationFormatted: this.formatDuration(duration)
      };
      
      await this.writeLogs(data);
    }
  }

  async addTask(promptId, taskDescription, status = 'pending') {
    const data = await this.readLogs();
    const promptIndex = data.logs.findIndex(log => log.id === promptId);
    
    if (promptIndex !== -1) {
      const taskId = data.logs[promptIndex].tasks.length + 1;
      const task = {
        id: taskId,
        description: taskDescription,
        status: status,
        timestamp: new Date().toISOString()
      };
      
      data.logs[promptIndex].tasks.push(task);
      await this.writeLogs(data);
      return taskId;
    }
  }

  async updateTask(promptId, taskId, status) {
    const data = await this.readLogs();
    const promptIndex = data.logs.findIndex(log => log.id === promptId);
    
    if (promptIndex !== -1) {
      const taskIndex = data.logs[promptIndex].tasks.findIndex(task => task.id === taskId);
      if (taskIndex !== -1) {
        data.logs[promptIndex].tasks[taskIndex].status = status;
        data.logs[promptIndex].tasks[taskIndex].updatedAt = new Date().toISOString();
        await this.writeLogs(data);
      }
    }
  }

  async addError(promptId, errorMessage) {
    const data = await this.readLogs();
    const promptIndex = data.logs.findIndex(log => log.id === promptId);
    
    if (promptIndex !== -1) {
      data.logs[promptIndex].errors.push({
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
      await this.writeLogs(data);
    }
  }

  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  async getStats() {
    const data = await this.readLogs();
    const logs = data.logs;
    
    const stats = {
      totalPrompts: logs.length,
      completedPrompts: logs.filter(log => log.status === 'completed').length,
      failedPrompts: logs.filter(log => log.status === 'failed').length,
      inProgressPrompts: logs.filter(log => log.status === 'in_progress').length,
      totalTasks: logs.reduce((sum, log) => sum + log.tasks.length, 0),
      completedTasks: logs.reduce((sum, log) => 
        sum + log.tasks.filter(task => task.status === 'completed').length, 0
      ),
      totalTokens: logs.reduce((sum, log) => sum + (log.tokensUsed || 0), 0),
      averageDuration: logs.filter(log => log.duration).length > 0 
        ? logs.filter(log => log.duration).reduce((sum, log) => sum + log.duration, 0) / 
          logs.filter(log => log.duration).length 
        : 0,
      totalErrors: logs.reduce((sum, log) => sum + log.errors.length, 0)
    };
    
    stats.averageDurationFormatted = this.formatDuration(stats.averageDuration);
    
    return stats;
  }

  async exportLogs(format = 'json') {
    const data = await this.readLogs();
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      let csv = 'ID,Timestamp,Status,Duration,Tasks,Tokens,Errors,Prompt\n';
      
      data.logs.forEach(log => {
        const row = [
          log.id,
          log.timestamp,
          log.status,
          log.durationFormatted || 'N/A',
          log.tasks.length,
          log.tokensUsed || 'N/A',
          log.errors.length,
          `"${log.prompt.replace(/"/g, '""').substring(0, 100)}..."`
        ].join(',');
        csv += row + '\n';
      });
      
      return csv;
    }
  }
}

// Usage example
const logger = new PromptLogger();

// Example usage:
/*
const promptId = await logger.startPrompt("User wants to modify the Excel merger interface");
await logger.addTask(promptId, "Move uploaded files summary beneath upload section");
await logger.addTask(promptId, "Fix curly bracket error");
await logger.updateTask(promptId, 1, "completed");
await logger.endPrompt(promptId, "completed", 1500);
*/

module.exports = PromptLogger;