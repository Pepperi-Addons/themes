import {PapiClient, InstalledAddon} from '@pepperi-addons/papi-sdk';
import {Client} from '@pepperi-addons/debug-server';

class MyService {
    papiClient: PapiClient;

    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
        });
    }

    getAddons(): Promise<InstalledAddon[]> {
        return this.papiClient.addons.installedAddons.find({});
    }

    /**
     * Install theme addon.
     */
    async installTheme(): Promise<any> {
        let result: any = {};
        const systemData = {
            Editors: [
                {
                    ParentPackageName: 'Themes',
                    PackageName: 'themes',
                    Description: 'Theme editor',
                },
            ],
        };

        const body = {
            Addon: {UUID: this.client.AddonUUID},
            SystemData: JSON.stringify(systemData),
        };

        try {
            const tmpResult: any = await this.papiClient.addons.installedAddons.upsert(body);
            result['success'] = tmpResult.Status;
            result['resultObject'] = {};
        } catch (error) {
            result['success'] = false;
            result['errorMessage'] = error.message;
            result['resultObject'] = null;
        }

        return result;
    }

    /**
     * Publish the theme object into addon additional data.
     */
    async publishTheme(body): Promise<InstalledAddon> {
        const addonData = body && body.AddonData ? body.AddonData : {};
        return await this.papiClient.addons.installedAddons.upsert(addonData);
    }

    /**
     * Return the css variables from the addon additional data.
     */
    async getCssVariables() {
        let result = {};

        const ADDON_UUID = this.client.AddonUUID; // '95501678-6687-4fb3-92ab-1155f47f839e';

        try {
            let webappVariables = {};
            const installedAddon = await this.papiClient.addons.installedAddons.addonUUID(ADDON_UUID).get();

            if (installedAddon && installedAddon.AdditionalData) {
                webappVariables = JSON.parse(installedAddon.AdditionalData).webappVariables;
            }

            result['success'] = true;
            result['resultObject'] = webappVariables;
        } catch (error) {
            result['success'] = false;
            result['errorMessage'] = error.message;
            result['resultObject'] = null;
        }

        return result;
    }
}

export default MyService;
