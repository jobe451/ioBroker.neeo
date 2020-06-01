import neeoapi = require("neeo-sdk");
import {EventEmitter} from "events";

const INTERVALL_POWER_CHECK = 1000*5;


export class NeeoBridge extends EventEmitter {

	private recipeMap = new Map<string, any>();
	private brainInfo: BrainInfo | null;
	private isInitialized = false;

	constructor() {
		super();
		this.brainInfo = null;
	}

	public async init(): Promise<void> {
		if (this.isInitialized) {
			throw new Error("You can't initialize NeeoBridge twice");
		}
		console.log("- discover one NEEO Brain...");
		let brain: any;
		try {
			brain = await neeoapi.discoverOneBrain();
		}
		catch(e) {
			this.emit("error", "neeo inialization error" + e.toString())
			return;
		}
		console.log("- Brain discovered:", brain.name);
		const recipInfo = await this.getReceipInfo(brain);

		this.isInitialized=true,
		this.brainInfo =  {
			brain: brain,
			recipInfo: recipInfo
		};

		setInterval(() => {
			neeoapi.getRecipesPowerState(brain).then((powerOnKeys: Array<string>) => {
				for (const [key, recipe] of this.recipeMap) {
					if (powerOnKeys.includes(key)) {
						if (!recipe.isPoweredOn) {
							recipe.isPoweredOn = true;
							this.emit("powerOn", key);
						}
					}
					else {
						if (recipe.isPoweredOn) {
							recipe.isPoweredOn = false;
							this.emit("powerOff", key);
						}	
					}
				}
			}).catch((e: any) => {
				this.emit("error", "something went wrong during brain-power-check: " + e.toString());
			});
		}, INTERVALL_POWER_CHECK);
	}

	public async getDeviceInfo(): Promise<BrainInfo> {
		if (this.brainInfo === null) {
			throw new Error ("brain not properly initialized");
		}
		return this.brainInfo;
	}
	
	public async powerOn(powerKey: string): Promise<any> {
		return this.recipeMap.get(powerKey).action.powerOn();
	}

	public async powerOff(powerKey: string): Promise<any> {
		const recipe = this.recipeMap.get(powerKey);
		if (recipe.action.powerOff) {
			return recipe.action.powerOff();
		}
		else {
			return Promise.resolve(false);
		}
	}

	private async getReceipInfo(brain: any): Promise<any> {
		const recipInfo = [];
		const recipes = await neeoapi.getRecipes(brain);
		for (const recipe of recipes) {
			
			console.log(recipe);
			this.recipeMap.set(recipe.powerKey, recipe)
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
	}
}

export interface BrainInfo {
	brain: any,
	recipInfo: Array<any>	;
}

/*
new NeeoBridge().getDeviceInfo().then((deviceInfo) => {
	console.log(deviceInfo);
});
*/