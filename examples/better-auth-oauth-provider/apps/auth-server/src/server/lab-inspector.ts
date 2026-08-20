import { createMiddleware } from 'hono/factory';
import { createTraceId } from '@oauth-lab/protocol';
import { isLoopbackHostname } from '@oauth-lab/protocol/node';

export type LabEvent = {
  traceId: string;
  method: string;
  path: string;
  status: number;
  occurredAt: string;
};

const events: LabEvent[] = [];
const MAX_EVENTS = 100;

export const traceMiddleware = createMiddleware(async (context, next) => {
  const traceId = context.req.header('x-trace-id') ?? createTraceId();
  context.header('x-trace-id', traceId);
  await next();

  events.push({
    traceId,
    method: context.req.method,
    path: new URL(context.req.url).pathname,
    status: context.res.status,
    occurredAt: new Date().toISOString(),
  });
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
});

export function labInspectorEnabled(requestUrl: string): boolean {
  const url = new URL(requestUrl);
  return process.env.OAUTH_LAB_MODE === 'true' && isLoopbackHostname(url.hostname);
}

export function getLabEvents(): readonly LabEvent[] {
  return events;
}
