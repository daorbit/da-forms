import countryData from './countryData.json';

export interface CountryOption {
  /** The stored answer, e.g. "United Kingdom". */
  value: string;
  /** What the dropdown shows, e.g. "🇬🇧 United Kingdom". */
  label: string;
  /** ISO 3166-1 alpha-2, for anyone exporting to a system that wants codes. */
  code: string;
}

/**
 * The country list: name, ISO alpha-2 code, and flag emoji.
 *
 * Generated from the `world-countries` package rather than typed by hand — 250
 * names is 250 chances to misspell one, and the list does change. The package
 * itself is a devDependency: its data file is 1.4MB of borders, currencies and
 * translations, which put half a megabyte into the bundle for three fields per
 * country. `countryData.json` is the trimmed extract, at 7KB.
 *
 * To refresh it after a package update:
 *   node -e "const c=require('world-countries');require('fs').writeFileSync(
 *     'src/lib/countryData.json',
 *     JSON.stringify(c.map(x=>[x.name.common,x.cca2,x.flag])
 *       .sort((a,b)=>a[0].localeCompare(b[0]))))"
 *
 * The stored value is the common name, not the code: the answer is read by
 * whoever collects the form, and an export column reading "GB" helps nobody.
 */
export const countryOptions: CountryOption[] = (countryData as [string, string, string][]).map(
  ([name, code, flag]) => ({ value: name, label: `${flag} ${name}`, code })
);

/** Just the names, for anything that wants a plain option list. */
export const countryNames: string[] = countryOptions.map((c) => c.value);
