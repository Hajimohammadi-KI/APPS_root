const ISO_DAY_MS = 86_400_000;

export function addDaysToProjectDate(date: string, days: number) {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export function projectDaysBetween(from: string, to: string) {
  const fromDate = new Date(`${from}T12:00:00Z`);
  const toDate = new Date(`${to}T12:00:00Z`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return 0;
  return Math.round((toDate.getTime() - fromDate.getTime()) / ISO_DAY_MS);
}

export function rescheduleAfterPause(input: {
  planStartDate: string;
  pausedAt: string;
  resumeDate: string;
  calculateEnd: (startDate: string) => string;
}) {
  const pauseDays = Math.max(0, projectDaysBetween(input.pausedAt, input.resumeDate));
  const planStartDate = addDaysToProjectDate(input.planStartDate, pauseDays);
  return {
    pauseDays,
    planStartDate,
    planEndDate: input.calculateEnd(planStartDate),
  };
}
