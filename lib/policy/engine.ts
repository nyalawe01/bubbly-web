export type ActionRisk = 'low' | 'medium' | 'high';

export function evaluateAction(userId: string, actionType: string, payload: any): "approved" | "requires_approval" | "denied" {
  // Determine risk level based on action type
  let risk: ActionRisk = 'low';
  
  if (actionType === 'generate_artifact' || actionType === 'execute_search') {
    risk = 'low'; // purely read/generate
  } else if (actionType === 'notify_user') {
    risk = 'low'; 
  } else if (actionType === 'plugin_action') {
    if (payload?.action === 'import_file') risk = 'low';
    else if (payload?.action === 'create_event') risk = 'medium';
    else if (payload?.action === 'delete_file') risk = 'high';
  } else if (actionType === 'delete_artifact') {
    risk = 'high';
  }

  // In a real system, we'd fetch user preferences for auto-approval.
  // For now, hardcode policy:
  if (risk === 'low') return "approved";
  if (risk === 'medium') return "approved"; // Or requires_approval depending on user setting
  if (risk === 'high') return "requires_approval";

  return "approved";
}
