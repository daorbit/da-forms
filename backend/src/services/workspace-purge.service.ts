import { FormModel } from '../models/form.model.js';
import { SubmissionModel } from '../models/submission.model.js';
import { FormViewModel } from '../models/formView.model.js';
import { FormDailyViewModel } from '../models/formDailyView.model.js';
import { UploadModel } from '../models/upload.model.js';
import { AppConnectionModel } from '../models/appConnection.model.js';
import { WorkspaceSettingsModel } from '../models/workspaceSettings.model.js';
import { destroyUploads } from './media.service.js';

export async function purgeWorkspace(workspaceId: string) {
  const forms = await FormModel.find({ workspaceId }).select('_id').lean();
  const formIds = forms.map((f) => f._id);
  const formIdStrings = formIds.map(String);

  const uploads = await UploadModel.find({
    $or: [{ formId: { $in: formIds } }, { workspaceId }],
  });
  const filesDestroyed = await destroyUploads(uploads);

  const [submissions] = await Promise.all([
    SubmissionModel.deleteMany({ formId: { $in: formIds } }),
    FormViewModel.deleteMany({ formId: { $in: formIdStrings } }),
    FormDailyViewModel.deleteMany({ formId: { $in: formIdStrings } }),
    AppConnectionModel.deleteMany({ workspaceId }),
    WorkspaceSettingsModel.deleteMany({ workspaceId }),
  ]);

  await FormModel.deleteMany({ workspaceId });

  return {
    forms: formIds.length,
    submissions: submissions.deletedCount,
    filesDestroyed,
  };
}
