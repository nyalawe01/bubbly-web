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
}

/**
 * Stub implementation of the Sandbox Service.
 * In a real environment, this would integrate with E2B or Piston.
 */
export class SandboxService {
  async createSandbox(userId: string, language: string): Promise<SandboxInstance> {
    console.log(`[Sandbox] Creating ${language} sandbox for user ${userId}`);
    return {
      id: `sandbox-${Date.now()}`,
      language
    };
  }

  async executeCode(sandboxId: string, code: string): Promise<ExecutionResult> {
    console.log(`[Sandbox] Executing code in ${sandboxId}: \n${code}`);
    
    // Mock simple code execution
    const startTime = Date.now();
    let stdout = "";
    let stderr = "";
    let exit_code = 0;

    try {
      if (code.includes("print(")) {
        const matches = code.match(/print\(['"](.+)['"]\)/);
        stdout = matches ? matches[1] + "\n" : "Output...\n";
      } else {
        stdout = "Execution completed.\n";
      }

      if (code.includes("error")) {
        stderr = "NameError: name 'error' is not defined\n";
        exit_code = 1;
      }
    } catch (e: any) {
      stderr = e.message;
      exit_code = 1;
    }

    const execution_time_ms = Date.now() - startTime;

    return {
      stdout,
      stderr,
      exit_code,
      execution_time_ms,
      truncated: false
    };
  }

  async installPackage(sandboxId: string, packageName: string): Promise<void> {
    console.log(`[Sandbox] Installing ${packageName} in ${sandboxId}`);
    return Promise.resolve();
  }

  async destroySandbox(sandboxId: string): Promise<void> {
    console.log(`[Sandbox] Destroyed sandbox ${sandboxId}`);
    return Promise.resolve();
  }
}
