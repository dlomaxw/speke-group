/**
 * Drops server-built page markup into the tree without an extra box.
 * The markup is assembled in src/lib/site-html.ts with every database
 * value escaped.
 */
export default function Html({ html }: { html: string }) {
  return <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: html }} />;
}
