import { hrmsApiService } from '../../services/hrms-api.service';

export interface ApplyLeaveParams {
  employee_id: number;
  leave_type: string;
  from_date: string;
  to_date: string;
  duration: number;
  reason: string;
}

export async function applyLeaveTool(params: ApplyLeaveParams): Promise<{ success: boolean; message: string; remaining?: number }> {
  const result = await hrmsApiService.applyLeave(params);

  if (result.ok) {
    return {
      success: true,
      message: `✅ Leave applied successfully! Your ${params.leave_type} leave from ${params.from_date} to ${params.to_date} is pending approval.`,
    };
  }

  if (result.status === 400) {
    return {
      success: false,
      message: `❌ Insufficient ${params.leave_type} leave balance. You have only ${result.data?.remaining ?? 0} days remaining.`,
      remaining: result.data?.remaining,
    };
  }

  return { success: false, message: '❌ Failed to apply leave. Please try again later.' };
}
