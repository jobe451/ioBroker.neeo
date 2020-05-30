import neeoapi = require("neeo-sdk");

export class NeeoBridge {

	private recipeMap = new Map<string, any>();

	public async getDeviceInfo(): Promise<BrainInfo> {
		console.log("- discover one NEEO Brain...");
		const brain = await neeoapi.discoverOneBrain();
		console.log("- Brain discovered:", brain.name);
		const recipInfo = await this.getReceipInfo(brain);

		return {
			brain: brain,
			recipInfo: recipInfo
		} as BrainInfo;
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