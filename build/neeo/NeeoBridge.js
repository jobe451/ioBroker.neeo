"use strict";
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
exports.NeeoBridge = void 0;
const neeoapi = require("neeo-sdk");
class NeeoBridge {
    constructor() {
        this.recipeMap = new Map();
    }
    getDeviceInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("- discover one NEEO Brain...");
            const brain = yield neeoapi.discoverOneBrain();
            console.log("- Brain discovered:", brain.name);
            const recipInfo = yield this.getReceipInfo(brain);
            return {
                brain: brain,
                recipInfo: recipInfo
            };
        });
    }
    powerOn(powerKey) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.recipeMap.get(powerKey).action.powerOn();
        });
    }
    powerOff(powerKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const recipe = this.recipeMap.get(powerKey);
            if (recipe.action.powerOff) {
                return recipe.action.powerOff();
            }
            else {
                return Promise.resolve(false);
            }
        });
    }
    getReceipInfo(brain) {
        return __awaiter(this, void 0, void 0, function* () {
            const recipInfo = [];
            const recipes = yield neeoapi.getRecipes(brain);
            for (const recipe of recipes) {
                console.log(recipe);
                this.recipeMap.set(recipe.powerKey, recipe);
                recipInfo.push({
                    name: decodeURIComponent(recipe.detail.devicename),
                    model: decodeURIComponent(recipe.detail.model),
                    manufacturer: decodeURIComponent(recipe.detail.manufacturer),
                    roomname: decodeURIComponent(recipe.detail.roomname),
                    uid: decodeURIComponent(recipe.uid),
                    isPoweredOn: recipe.isPoweredOn,
                    powerKey: recipe.powerKey
                });
            }
            return recipInfo;
        });
    }
}
exports.NeeoBridge = NeeoBridge;
/*
new NeeoBridge().getDeviceInfo().then((deviceInfo) => {
    console.log(deviceInfo);
});
*/ 
//# sourceMappingURL=/opt/iobroker/node_modules/iobroker.neeo/build/neeo/NeeoBridge.js.map