// Isolated from ADB execution so multi-device behavior can be tested offline.
export class DeviceManager {
  constructor(list, run, env = process.env) {
    this.list = list;
    this.run = run;
    this.env = env;
    this.selected = undefined;
  }

  async inventory() {
    const connections = await this.list();
    const physical = new Map();
    for (const connection of connections.filter(d => d.state === 'device')) {
      try {
        const read = prop => this.run(['-s', connection.serial, 'shell', `getprop ${prop}`]);
        const [hardwareSerial, model, android] = await Promise.all([
          read('ro.serialno'), read('ro.product.model'), read('ro.build.version.release'),
        ]);
        const id = hardwareSerial && hardwareSerial !== 'unknown' ? hardwareSerial : connection.serial;
        const existing = physical.get(id);
        if (existing) existing.connections.push(connection.serial);
        else physical.set(id, { id, model, android, connections: [connection.serial] });
      } catch {
        connection.error = 'Device became unavailable while reading its identity.';
      }
    }
    return { devices: [...physical.values()], connections, selected: this.selected || null };
  }

  async resolve(selector) {
    const { devices } = await this.inventory();
    if (!devices.length) throw new Error('No authorized phone connected. Use android_discover, android_pair and android_connect, or connect USB and accept debugging permission.');
    if (!selector) {
      if (devices.length === 1) return devices[0];
      throw new Error('Multiple phones connected. Use android_devices then android_select_device, or pass device to each control tool.');
    }
    const exact = devices.filter(d => d.id === selector || d.connections.includes(selector));
    if (exact.length === 1) return exact[0];
    const byModel = devices.filter(d => d.model.toLowerCase() === selector.toLowerCase());
    if (byModel.length === 1) return byModel[0];
    if (byModel.length > 1) throw new Error('More than one phone has that model. Choose its unique id from android_devices.');
    throw new Error('Selected phone is offline or unknown. Use android_devices to choose a connected device.');
  }

  async target(explicit) {
    const chosen = explicit || this.selected || this.env.ANDROID_SERIAL || this.env.ANDROID_HARDWARE_SERIAL;
    return (await this.resolve(chosen)).connections[0];
  }

  async select(selector) {
    const device = await this.resolve(selector);
    this.selected = device.id;
    return device;
  }
}
