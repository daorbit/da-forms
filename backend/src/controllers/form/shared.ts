import type { Request, Response } from "express";
import { createHash } from "node:crypto";
import * as formService from "../../services/form.service.js";

export function fingerprintOf(req: Request) {
  const ip = req.ip ?? "";
  const ua = req.get("user-agent") ?? "";
  return createHash("sha256").update(`${ip}:${ua}`).digest("hex");
}

export function workspaceIdOf(req: { params: Record<string, string> }) {
  return req.params.workspaceId;
}

export async function loadOwnedForm(req: Request, res: Response) {
  const form = await formService.getForm(req.params.id);
  if (!form || form.workspaceId !== workspaceIdOf(req)) {
    res.status(404).json({ error: "not_found", message: "Form not found" });
    return null;
  }
  return form;
}
