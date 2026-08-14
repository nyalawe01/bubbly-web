import { NextRequest, NextResponse } from "next/server";
import { SandboxService } from "@/lib/sandbox/service";

// We use a singleton instance for this route to preserve sandboxes in memory.
// Note: In a serverless environment like Vercel, this is stateless between cold starts,
// so E2B handles sandbox state via sandboxID, but we need to re-instantiate CodeInterpreter
// if we lose the map. For this prototype, we'll instantiate it on each call if needed.
const service = new SandboxService();

export async function POST(req: NextRequest) {
  try {
    const { code, language = "python", sandboxId } = await req.json();

    let id = sandboxId;
    if (!id) {
      // Create new sandbox
      const instance = await service.createSandbox("anonymous", language);
      id = instance.id;
    }

    const result = await service.executeCode(id, code);
    
    return NextResponse.json({ success: true, sandboxId: id, result });
  } catch (error: any) {
    console.error("Execution error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
