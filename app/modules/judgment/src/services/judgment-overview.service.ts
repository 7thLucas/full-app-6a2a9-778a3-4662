import { JudgmentConfigModel } from "../models/config.model";
import { JudgmentSubmissionModel } from "../models/submission.model";
import { IssueModel } from "../models/issue.model";
import { ActionTaskModel } from "../models/task.model";
import { AuditLogModel } from "../models/audit.model";

/**
 * Aggregated compliance posture across every audit configuration. Powers the
 * Audra compliance dashboard (the "live view of risk" north-star surface).
 */
export async function getComplianceOverview() {
  const [configs, submissions, issues, tasks, recentEvents] = await Promise.all([
    JudgmentConfigModel.find({}).sort({ createdAt: -1 }),
    JudgmentSubmissionModel.find({}).sort({ createdAt: -1 }).limit(500),
    IssueModel.find({}).sort({ createdAt: -1 }),
    ActionTaskModel.find({}).sort({ dueDate: 1 }),
    AuditLogModel.find({}).sort({ timestamp: -1 }).limit(25),
  ]);

  const completed = submissions.filter((s) => s.status === "DONE" || s.status === "ERROR");
  const passed = completed.filter((s) => s.result?.verdict === "pass");
  const failed = completed.filter((s) => s.result && s.result.verdict !== "pass");

  const openIssues = issues.filter((i) => i.status === "open");
  const openTasks = tasks.filter((t) => t.status === "open");
  const now = Date.now();
  const overdueTasks = openTasks.filter((t) => new Date(t.dueDate).getTime() < now);

  const totalScored = completed.length;
  const complianceRate = totalScored > 0 ? Math.round((passed.length / totalScored) * 100) : null;

  // Per-config rollup for the dashboard table.
  const byConfig = configs.map((config) => {
    const configSubs = completed.filter((s) => s.configId === config.pluginId);
    const configPass = configSubs.filter((s) => s.result?.verdict === "pass").length;
    const configOpenIssues = openIssues.filter((i) => i.configId === config.pluginId).length;
    return {
      pluginId: config.pluginId,
      name: config.name,
      requirements: Array.isArray(config.criteria) ? config.criteria.length : 0,
      assessments: configSubs.length,
      passRate: configSubs.length > 0 ? Math.round((configPass / configSubs.length) * 100) : null,
      openIssues: configOpenIssues,
      updatedAt: (config as any).updatedAt ?? (config as any).createdAt ?? null,
    };
  });

  return {
    stats: {
      audits: configs.length,
      assessments: totalScored,
      passed: passed.length,
      failed: failed.length,
      complianceRate,
      openIssues: openIssues.length,
      openActions: openTasks.length,
      overdueActions: overdueTasks.length,
    },
    byConfig,
    recentEvents,
  };
}

export async function listIssues() {
  return IssueModel.find({}).sort({ createdAt: -1 });
}

export async function listTasks() {
  return ActionTaskModel.find({}).sort({ dueDate: 1 });
}

export async function listSubmissions(limit = 200) {
  return JudgmentSubmissionModel.find({}).sort({ createdAt: -1 }).limit(limit);
}
