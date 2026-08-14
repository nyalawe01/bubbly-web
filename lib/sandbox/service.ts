import { Sandbox } from '@e2b/code-interpreter';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exit_code: number;
  execution_time_ms: number;
  truncated: boolean;
}

export interface SandboxInstance {
  id: string;
  language: string;
  session?: Sandbox;
}

/**
 * E2B Sandbox Service Implementation
 */
export class SandboxService {
  private activeSandboxes: Map<string, Sandbox> = new Map();
  private apiKey = process.env.E2B_API_KEY || 'e2b_0c62e9d9d6a22391ba327ef8cb9c41e9f66a0950';

  async createSandbox(userId: string, language: string): Promise<SandboxInstance> {
    console.log(`[Sandbox] Creating ${language} sandbox for user ${userId}`);
    
    // In a real app we'd map language to the appropriate E2B sandbox type.
    const sandbox = await Sandbox.create({ apiKey: this.apiKey });
    
    const id = sandbox.sandboxId;
    this.activeSandboxes.set(id, sandbox);

    return {
      id,
      language,
      session: sandbox
    };
  }

  async executeCode(sandboxId: string, code: string): Promise<ExecutionResult> {
    console.log(`[Sandbox] Executing code in ${sandboxId}`);
    
    const sandbox = this.activeSandboxes.get(sandboxId);
    if (!sandbox) {
      throw new Error(`Sandbox ${sandboxId} not found or expired.`);
    }

    const startTime = Date.now();
    
    // E2B execution
    const execution = await sandbox.runCode(code);

    let stdout = "";
    let stderr = "";
    
    if (execution.logs) {
      stdout += execution.logs.stdout.join('\n');
      stderr += execution.logs.stderr.join('\n');
    }
    
    if (execution.results && execution.results.length > 0) {
      stdout += execution.results.map(r => r.text || '').join('\n');
    }
    
    if (execution.error) {
      stderr += `\n${execution.error.name}: ${execution.error.value}\n${execution.error.traceback}`;
    }

    const execution_time_ms = Date.now() - startTime;

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exit_code: execution.error ? 1 : 0,
      execution_time_ms,
      truncated: false
    };
  }

  async installPackage(sandboxId: string, packageName: string): Promise<void> {
    console.log(`[Sandbox] Installing ${packageName} in ${sandboxId}`);
    const sandbox = this.activeSandboxes.get(sandboxId);
    if (!sandbox) throw new Error("Sandbox not found");
    
    // Since process.startAndWait isn't available in standard runCode interface
    await sandbox.runCode(`!pip install ${packageName}`);
  }

  async destroySandbox(sandboxId: string): Promise<void> {
    console.log(`[Sandbox] Destroyed sandbox ${sandboxId}`);
    const sandbox = this.activeSandboxes.get(sandboxId);
    if (sandbox) {
      // In @e2b/code-interpreter, destroying a sandbox is usually .kill()
      await sandbox.kill();
      this.activeSandboxes.delete(sandboxId);
    }
  }
}

