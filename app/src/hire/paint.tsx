/* Hire draws each area of the page on its own (menu, header, main area, dialog, and a few inner areas).
   paint() is the React version of `element.innerHTML = ...`: it replaces what is in that area, at once. */
import { Fragment, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { renderToStaticMarkup } from 'react-dom/server';

const roots = new WeakMap<Element, Root>();
let rev = 0;
/** Replace everything inside the element (a selector like "#main" or the element itself) with these screens. */
export function paint(target: string | Element | null, node: ReactNode) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  let r = roots.get(el);
  if (!r) { el.textContent = ''; r = createRoot(el); roots.set(el, r); }
  const root = r;
  rev++;
  flushSync(() => root.render(<Fragment key={rev}>{node}</Fragment>));
}
/** The page text of screens without buttons (for the one place that swaps a small status label in place). */
export const staticHtml = (node: ReactNode) => renderToStaticMarkup(<>{node}</>);
