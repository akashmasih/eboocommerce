let channel: any = null;

export async function initEventBus(_url: string) {
  // Optional: integrate amqplib when needed
  return channel;
}

export async function publishEvent(_exchange: string, _routingKey: string, _payload: unknown) {
  if (!channel) return;
  // No-op when not initialized
}

export function setEventChannel(ch: any) {
  channel = ch;
}
