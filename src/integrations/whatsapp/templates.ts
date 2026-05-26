export const templates = {
  welcome: (name: string) =>
    `Hello ${name}! 👋 I'm your HR assistant. You can ask me about your leave balance, attendance, or salary slip.`,

  greeting: (name: string) =>
    `Hello ${name}! How can I help you today? You can ask about leave, attendance, or salary.`,

  notRegistered: () =>
    'Sorry, your number is not registered in the HRMS system.',

  unknown: () =>
    "Sorry, I didn't understand that. You can ask about:\n• Leave balance\n• Attendance summary\n• Salary slip",

  error: () =>
    'Sorry, something went wrong. Please try again later.',
};
