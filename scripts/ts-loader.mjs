/**
 * A three-line TypeScript loader.
 *
 * The verification scripts import the real data module rather than a copy of
 * it, which is the only way they can prove what ships. Node can strip the
 * types itself; all this does is tell it that a `.ts` URL is a module.
 */
export async function load(url, context, nextLoad) {
  if (url.endsWith(".ts")) return nextLoad(url, { ...context, format: "module-typescript" });
  return nextLoad(url, context);
}
