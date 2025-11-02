import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

@Injectable()
export class PythonManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PythonManagerService.name);
  private pythonProcess: ChildProcess | null = null;
  private readonly pythonPath: string;
  private readonly aiAgentPath: string;
  private readonly aiAgentPort: number;

  constructor(private readonly configService: ConfigService) {
    this.pythonPath = this.configService.get<string>('PYTHON_PATH') || 'python3.9';
    this.aiAgentPort = this.configService.get<number>('AI_AGENT_PORT') || 8000;
    
    // Path to Python AIAgent relative to backend root
    this.aiAgentPath = path.join(process.cwd(), 'python', 'aiagent', 'api', 'main.py');
  }

  async onModuleInit() {
    this.logger.log('🤖 Initializing Python AIAgent service...');
    
    try {
      await this.startPythonService();
      this.logger.log(`✅ Python AIAgent started successfully on port ${this.aiAgentPort}`);
    } catch (error) {
      this.logger.error('❌ Failed to start Python AIAgent:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('🛑 Stopping Python AIAgent service...');
    await this.stopPythonService();
    this.logger.log('✅ Python AIAgent stopped');
  }

  private async startPythonService(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.log(`Starting Python process: ${this.pythonPath} ${this.aiAgentPath}`);

      // Spawn Python process
      this.pythonProcess = spawn(this.pythonPath, [this.aiAgentPath], {
        cwd: path.join(process.cwd(), 'python', 'aiagent'),
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          AI_AGENT_PORT: this.aiAgentPort.toString(),
          OLLAMA_BASE_URL: this.configService.get<string>('OLLAMA_BASE_URL') || 'http://localhost:11434',
          OLLAMA_MODEL: this.configService.get<string>('OLLAMA_MODEL') || 'medllama2',
        },
      });

      // Handle stdout
      this.pythonProcess.stdout?.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          this.logger.debug(`[Python AIAgent] ${output}`);
        }
      });

      // Handle stderr
      this.pythonProcess.stderr?.on('data', (data) => {
        const error = data.toString().trim();
        if (error && !error.includes('WARNING')) {
          this.logger.warn(`[Python AIAgent Error] ${error}`);
        }
      });

      // Handle process exit
      this.pythonProcess.on('exit', (code, signal) => {
        if (code !== 0 && code !== null) {
          this.logger.error(`Python AIAgent exited with code ${code}, signal: ${signal}`);
        }
        this.pythonProcess = null;
      });

      // Handle process errors
      this.pythonProcess.on('error', (error) => {
        this.logger.error('Python AIAgent process error:', error);
        reject(error);
      });

      // Wait for service to start (check health endpoint)
      this.waitForService()
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }

  private async waitForService(maxAttempts: number = 30): Promise<void> {
    const checkInterval = 1000; // 1 second
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`http://localhost:${this.aiAgentPort}/health`);
        if (response.ok) {
          this.logger.log(`✓ Python AIAgent health check passed (attempt ${attempts + 1})`);
          return;
        }
      } catch (error) {
        // Service not ready yet, continue waiting
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    throw new Error(`Python AIAgent failed to start after ${maxAttempts} attempts`);
  }

  private async stopPythonService(): Promise<void> {
    if (this.pythonProcess) {
      return new Promise((resolve) => {
        const process = this.pythonProcess!;
        
        process.on('exit', () => {
          this.pythonProcess = null;
          resolve();
        });

        // Try graceful shutdown first
        process.kill('SIGTERM');

        // Force kill after 5 seconds if not stopped
        setTimeout(() => {
          if (this.pythonProcess) {
            this.logger.warn('Force killing Python AIAgent process');
            process.kill('SIGKILL');
          }
        }, 5000);
      });
    }
  }

  /**
   * Check if Python service is running
   */
  isRunning(): boolean {
    return this.pythonProcess !== null && !this.pythonProcess.killed;
  }

  /**
   * Get Python service health status
   */
  async getHealthStatus(): Promise<{ running: boolean; healthy: boolean; error?: string }> {
    if (!this.isRunning()) {
      return { running: false, healthy: false, error: 'Python process not running' };
    }

    try {
      const response = await fetch(`http://localhost:${this.aiAgentPort}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        return { running: true, healthy: true };
      } else {
        return { running: true, healthy: false, error: `Health check returned ${response.status}` };
      }
    } catch (error) {
      return { 
        running: true, 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Restart Python service
   */
  async restart(): Promise<void> {
    this.logger.log('🔄 Restarting Python AIAgent service...');
    await this.stopPythonService();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    await this.startPythonService();
    this.logger.log('✅ Python AIAgent service restarted');
  }
}
