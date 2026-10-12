const SHEET_RELS = /^xl\/worksheets\/_rels\/[^/]+\.rels$/;
const SHEET_XML = /^xl\/worksheets\/[^/]+\.xml$/;
const NOTE_RELATIONSHIP =
  /<Relationship\b[^>]*?relationships\/(?:comments|vmlDrawing)"[^>]*?(?:\/>|>\s*<\/Relationship>)/g;
const LEGACY_DRAWING = /<legacyDrawing\b[^>]*?(?:\/>|>\s*<\/legacyDrawing>)/g;

export async function withoutCellNotes(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(buffer);
  const names = Object.keys(zip.files);

  await Promise.all(
    names
      .filter((name) => SHEET_RELS.test(name) || SHEET_XML.test(name))
      .map(async (name) => {
        const xml = await zip.file(name)!.async('string');
        const next = xml.replace(SHEET_RELS.test(name) ? NOTE_RELATIONSHIP : LEGACY_DRAWING, '');
        if (next !== xml) zip.file(name, next);
      }),
  );

  return zip.generateAsync({ type: 'arraybuffer' });
}
