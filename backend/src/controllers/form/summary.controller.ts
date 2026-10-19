import type { RequestHandler, Response } from "express";
import { bookingSummary, pipelineSummary } from "../../services/workspaceSummary.service.js";
import { MAX_WINDOW_DAYS, readWindow } from "../../lib/summaryWindow.js";
import { workspaceIdOf } from "./shared.js";

function windowOr400(query: Record<string, unknown>, res: Response) {
  const window = readWindow(query);
  if (!window) {
    res.status(400).json({ error: "invalid_window", message: `from/to must be valid dates at most ${MAX_WINDOW_DAYS} days apart` });
  }
  return window;
}

export const getPipelineSummary: RequestHandler = async (req, res) => {
  const window = windowOr400(req.query, res);
  if (!window) return;
  res.json({ window, ...(await pipelineSummary(workspaceIdOf(req), window)) });
};

export const getBookingSummary: RequestHandler = async (req, res) => {
  const window = windowOr400(req.query, res);
  if (!window) return;
  res.json({ window, ...(await bookingSummary(workspaceIdOf(req), window)) });
};
