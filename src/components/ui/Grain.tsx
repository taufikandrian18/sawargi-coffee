/**
 * Fixed film-grain layer (my-design-taste: feTurbulence ~0.85, low opacity,
 * overlay blend). The noise tile is a CSS background image so the browser
 * rasterises it once instead of re-running the filter on every scroll frame.
 */
export function Grain() {
  return <div aria-hidden="true" data-testid="grain" className="grain" />
}
