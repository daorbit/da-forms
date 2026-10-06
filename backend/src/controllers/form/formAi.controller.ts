import type { RequestHandler } from "express";
import { generateForm as quantalogGenerate, editForm as quantalogEdit } from "../../lib/quantalog.js";
import { workspaceIdOf } from "./shared.js";

export const generateForm: RequestHandler = async (req, res) => {
  const workspaceId = workspaceIdOf(req);
  const prompt =
    typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  const image =
    typeof req.body?.image === "string" ? req.body.image : undefined;

  if (!prompt && !image) {
    return res
      .status(400)
      .json({
        error: "prompt_required",
        message: "Describe the form you want.",
      });
  }

  const previous =
    req.body?.previous && typeof req.body.previous === "object"
      ? req.body.previous
      : undefined;

  const mode = req.body?.mode === "edit" ? "edit" : "create";

  const result = await quantalogGenerate(workspaceId, prompt, previous, mode, image);

  if (!result.ok) {
    return res.status(result.status).json({
      error: result.code ?? "generation_failed",
      message: result.error,
    });
  }

  res.json(result.form);
};

/**
 * Work out what should change about a form the author is already editing.
 *
 * Distinct from `generateForm` on purpose. A generation answers with a whole
 * form, and dropping one onto a live canvas replaces everything — including the
 * grids and columns the generator's wire shape cannot describe, which is how an
 * edit could come back having quietly flattened the layout and lost the fields
 * inside it. This answers with operations against the ids the builder sent, and
 * the builder applies them to the form it already has.
 */
export const editForm: RequestHandler = async (req, res) => {
  const workspaceId = workspaceIdOf(req);
  const prompt =
    typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";

  if (!prompt) {
    return res.status(400).json({
      error: "prompt_required",
      message: "Describe the change you want.",
    });
  }

  const snapshot = req.body?.snapshot;
  if (!snapshot || typeof snapshot !== "object" || !Array.isArray(snapshot.fields)) {
    return res.status(400).json({
      error: "snapshot_required",
      message: "The form being edited was not sent.",
    });
  }

  const result = await quantalogEdit(workspaceId, prompt, snapshot);

  if (!result.ok) {
    return res.status(result.status).json({
      error: result.code ?? "edit_failed",
      message: result.error,
    });
  }

  res.json({ ops: result.ops, summary: result.summary });
};
