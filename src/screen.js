export class ScreenUnavailableError extends Error {}

export function screenshotResult(png) {
  if (png.subarray(0,8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Phone did not return a PNG screenshot.');
  return { content: [{ type: 'image', data: png.toString('base64'), mimeType: 'image/png' }] };
}

export async function readScreenResult(readNodes, capture) {
  let reason;
  try {
    const nodes = await readNodes();
    if (nodes.length) return { content: [{ type: 'text', text: JSON.stringify(nodes, null, 2) }] };
    reason = 'This screen exposes no accessible elements.';
  } catch (error) {
    if (!(error instanceof ScreenUnavailableError)) throw error;
    reason = error.message;
  }
  const image = screenshotResult(await capture());
  return { content: [
    { type: 'text', text: JSON.stringify({ mode: 'screenshot', reason, guidance: 'Use the attached screenshot with android_tap and android_swipe coordinates. Element-by-label tools need an accessible, idle screen. Secure apps may return a black screenshot.' }) },
    ...image.content,
  ] };
}
