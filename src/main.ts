/*
 * Created with @iobroker/create-adapter v1.24.2
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";
import { NeeoBridge } from "./neeo/NeeoBridge";

// Load your modules here, e.g.:
// import * as fs from "fs";

// Augment the adapter.config object with the actual types
// TODO: delete this in the next version
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace ioBroker {
		interface AdapterConfig {
			// Define the shape of your options here (recommended)
			// Or use a catch-all approach
			[key: string]: any;
		}
	}
}

class Neeo extends utils.Adapter {

	private neeoBridge: NeeoBridge;

	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: "neeo",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("objectChange", this.onObjectChange.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
		this.neeoBridge = new NeeoBridge();
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {

		this.setState("info.connection", false, true);

		try {
			await this.neeoBridge.init();
			const deviceInfo = await this.neeoBridge.getDeviceInfo();

			this.log.info("neeo brain found " + deviceInfo.brain.name);
			this.setState("info.connection", true, true);

			await this.setObjectAsync("0", {
				type: "device",
				common: {
					name: "brain",
				},
				native: {},
			});

			await this.setObjectAsync("0.name", {
				type: "state",
				common: {
					name: "name",
					type: "string",
					role: "info",
					read: true,
					write: false,
				},
				native: {},
			});
			await this.setStateAsync("0.name", { val: deviceInfo.brain.name, ack: true });

			for (const receipe of deviceInfo.recipInfo)  {
				this.setUpRecipe(receipe);
			}
		}
		catch (error) {
			this.log.error("neeo initialization failed" + error.toString());
		}

		// in this template all states changes inside the adapters namespace are subscribed
		this.subscribeStates("*");
		this.neeoBridge.on("powerOn", (key) => {
			const nodePath = "0.devices." + key;
			this.setStateAsync(nodePath + ".state", { val: true, ack: true });			
			this.log.info("neeo power on for " + key);
		});
		this.neeoBridge.on("powerOff", (key) => {
			const nodePath = "0.devices." + key;
			this.setStateAsync(nodePath + ".state", { val: false, ack: true });			
			this.log.info("neeo power off for " + key);
		});
		this.neeoBridge.on("error", (error) => {
			this.log.error("neeo error " + error.toString());
		});
	}

	private async setUpRecipe(receipe: any): Promise<void> {
		const nodePath = "0.devices." + receipe.powerKey;

		await this.setObjectAsync(nodePath + ".name", {
			type: "state",
			common: {
				name: "name",
				type: "string",
				role: "info",
				read: true,
				write: false,
			},
			native: {},
		});
		await this.setStateAsync(nodePath + ".name", { val: receipe.name, ack: true });

		await this.setObjectAsync(nodePath + ".state", {
			type: "state",
			common: {
				name: "name",
				type: "boolean",
				role: "switch",
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setStateAsync(nodePath + ".state", { val: receipe.isPoweredOn, ack: true });

		this.log.info("recipe found " + receipe.powerKey + ", " + receipe.name);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 */
	private onUnload(callback: () => void): void {
		try {
			this.log.info("cleaned everything up...");
			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed object changes
	 */
	private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
		if (obj) {
			// The object was changed
			this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
		} else {
			// The object was deleted
			this.log.info(`object ${id} deleted`);
		}
	}

	/**
	 * Is called if a subscribed state changes
	 */
	private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
		if (state) {
			if (state.ack) {
				return;
			}

			const match = id.match(/([^\.]+)\.state$/);
			if (match) {
				if (state.val) {
					this.neeoBridge.powerOn(match[1]).then(() => {
						this.setStateAsync(id, { val: state.val, ack: true });
					});
				}
				else {
					this.neeoBridge.powerOff(match[1]).then(() => {
						this.setStateAsync(id, { val: state.val, ack: true });
					});
				}
			}
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			this.log.info(`state ${id} deleted`);
		}
	}
}

if (module.parent) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Neeo(options);
} else {
	// otherwise start the instance directly
	(() => new Neeo())();
}