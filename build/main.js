"use strict";
/*
 * Created with @iobroker/create-adapter v1.24.2
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const NeeoBridge_1 = require("./neeo/NeeoBridge");
class Neeo extends utils.Adapter {
    constructor(options = {}) {
        super(Object.assign(Object.assign({}, options), { name: "neeo" }));
        this.on("ready", this.onReady.bind(this));
        this.on("objectChange", this.onObjectChange.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        // this.on("message", this.onMessage.bind(this));
        this.on("unload", this.onUnload.bind(this));
        this.neeoBridge = new NeeoBridge_1.NeeoBridge();
    }
    /**
     * Is called when databases are connected and adapter received configuration.
     */
    onReady() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setState("info.connection", false, true);
            const deviceInfo = yield this.neeoBridge.getDeviceInfo();
            //		console.log(deviceInfo);
            this.setState("info.connection", true, true);
            yield this.setObjectAsync("0", {
                type: "device",
                common: {
                    name: "brain",
                },
                native: {},
            });
            yield this.setObjectAsync("0.name", {
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
            yield this.setStateAsync("0.name", { val: deviceInfo.brain.name, ack: true });
            for (const receipe of deviceInfo.recipInfo) {
                this.setUpRecipe(receipe);
            }
            // in this template all states changes inside the adapters namespace are subscribed
            this.subscribeStates("*");
        });
    }
    setUpRecipe(receipe) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodePath = "0.devices." + receipe.powerKey;
            yield this.setObjectAsync(nodePath + ".name", {
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
            yield this.setStateAsync(nodePath + ".name", { val: receipe.name, ack: true });
            yield this.setObjectAsync(nodePath + ".state", {
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
            yield this.setStateAsync(nodePath + ".state", { val: receipe.isPoweredOn, ack: true });
        });
    }
    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    onUnload(callback) {
        try {
            this.log.info("cleaned everything up...");
            callback();
        }
        catch (e) {
            callback();
        }
    }
    /**
     * Is called if a subscribed object changes
     */
    onObjectChange(id, obj) {
        if (obj) {
            // The object was changed
            this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
        }
        else {
            // The object was deleted
            this.log.info(`object ${id} deleted`);
        }
    }
    /**
     * Is called if a subscribed state changes
     */
    onStateChange(id, state) {
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
        }
        else {
            this.log.info(`state ${id} deleted`);
        }
    }
}
if (module.parent) {
    // Export the constructor in compact mode
    module.exports = (options) => new Neeo(options);
}
else {
    // otherwise start the instance directly
    (() => new Neeo())();
}
//# sourceMappingURL=/opt/iobroker/node_modules/iobroker.neeo/build/main.js.map