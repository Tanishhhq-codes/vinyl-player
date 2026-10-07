<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the browser experience as a client-only React Three Fiber scene because WebGL cannot render during SSR.
- Generate prototype album art and material textures locally to avoid runtime media dependencies.
- Resolve scene material colors from global CSS tokens and keep texture generation in a browser-only utility so the 3D scene and interface share one palette.
- Keep detailed procedural turntable geometry when no downloadable CC0 model is available so the scene has no inaccessible model dependency.
- Keep the artisan lamp in its own scene component and instance repeated platter details to preserve the scene's rendering budget.
- Keep wall, desk, floor, and object controls in the shared saved scene settings so material choices and direct scene interactions stay synchronized.
- Keep WebGL behind a recoverable error boundary with visible loading and context-loss states so unsupported or interrupted rendering never silently blanks the room.
