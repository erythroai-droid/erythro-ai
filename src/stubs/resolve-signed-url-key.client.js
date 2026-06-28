// Client-only stub for @payloadcms/plugin-cloud-storage's `resolveSignedURLKey`.
//
// The plugin's `utilities` barrel re-exports both client-safe helpers
// (`getFileKey`, used by the Vercel Blob client upload handler that the admin
// importMap references) and the server-only `resolveSignedURLKey`. The latter
// imports the full Payload server bundle (-> undici -> `node:*` builtins),
// which webpack cannot bundle for the browser and which is never executed
// client-side. Tree-shaking does not drop it here, so client builds swap the
// module for this no-op via NormalModuleReplacementPlugin (see next.config.ts).
export const resolveSignedURLKey = () => {
  throw new Error('resolveSignedURLKey is server-only and must not run in the browser')
}
