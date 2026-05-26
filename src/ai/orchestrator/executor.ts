import { classifyIntent, Intent } from './classifier';
import { routeToAgent, AgentContext } from './router.agent';
import { generateResponse } from './response.generator';
import { getSession, setSession } from '../memory/redis.memory';
import { hrmsApiService } from '../../services/hrms-api.service';
import { leaveAgent } from '../agents/leave.agent';

export async function executeMessage(phone: string, message: string): Promise<string> {
  const session = getSession(phone);

  // Step 1: Identify employee if not yet known
  if (session.employee_id === null) {
    const employee = await hrmsApiService.getEmployeeByPhone(phone);

    if (!employee || !employee.id) {
      return 'Sorry, your number is not registered in the HRMS system.';
    }

    setSession(phone, {
      employee_id: employee.id,
      name: employee.name || employee.first_name || 'there',
    });

    return `Hello ${employee.name || employee.first_name || 'there'}! 👋 I'm your HR assistant. You can ask me about your leave balance, attendance, or salary slip.`;
  }

  // Step 2: Handle multi-turn flow
  const currentSession = getSession(phone);
  if (currentSession.step !== null) {
    return leaveAgent.continueApply(phone, message, currentSession);
  }

  // Step 3: Classify intent
  const intent = await classifyIntent(message);
  console.log('CLASSIFIED INTENT:', JSON.stringify(intent));

  // Step 4: Handle greeting
  if (intent === 'greeting') {
    return `Hello ${currentSession.name || 'there'}! How can I help you today? You can ask about leave, attendance, or salary.`;
  }

  // Step 5: Handle unknown
  if (intent === 'unknown') {
    return "Sorry, I didn't understand that. You can ask about:\n• Leave balance\n• Attendance summary\n• Salary slip";
  }

  // Step 6: Route to agent
  const agentHandler = routeToAgent(intent);
  if (!agentHandler) {
    return "Sorry, I couldn't process that request. Please try again.";
  }

  const ctx: AgentContext = {
    phone,
    employeeId: currentSession.employee_id!,
    employeeName: currentSession.name || 'there',
    message,
  };

  return agentHandler(ctx);
}
