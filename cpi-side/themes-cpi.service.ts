import { IClient } from '@pepperi-addons/cpi-node/build/cpi-side/events';
import { ConfigurationObject } from "@pepperi-addons/papi-sdk";
import { THEME_TABS_DATA_PROPERTY, THEME_TABS_DATA_UUID } from 'shared';
import config from "../addon.config.json";

// const CSS_VARIABLES_TABLE_NAME = 'CssVariables';
// const DATA_OBJECT_KEY = 'themes';

class ThemesService {
    
    constructor() {}

    private async isSyncInstalled(): Promise<boolean> {
        let isSyncInstalled = false;

        try {
            const res = await pepperi.api.adal.getList({
                addon: '95501678-6687-4fb3-92ab-1155f47f839e', // Themes addon uuid // 'bb6ee826-1c6b-4a11-9758-40a46acb69c5', // CPI Node addon uuid
                table: 'CssVariables'
            }); 
            
            isSyncInstalled = res?.objects?.length > 0 ? true : false;
        } catch {
            isSyncInstalled = false;
        }

        return isSyncInstalled;
    }

    private getObjectFromPropertiesPath(obj: any, propertiesPath: any): any {
        let result = obj;
        
        if (propertiesPath?.length > 0) {
            const propsNames = propertiesPath.split('.');

            for (let index = 0; index < propsNames.length; index++) {
                result = result ? result[propsNames[index]] : null;
            }
        }
        
        return result;
    }
    
    async getThemePublishedObject(key: string = '', client: IClient | undefined = undefined): Promise<any> {
        let result = {};
        const isSyncInstalled = await this.isSyncInstalled();

        if (isSyncInstalled) {
            // Old code
            // const cssVariablesData = await pepperi.api.adal.get({
            //     addon: config.AddonUUID,
            //     table: CSS_VARIABLES_TABLE_NAME,
            //     key: DATA_OBJECT_KEY
            // });
            
            // if (cssVariablesData.object) {
            //     result = (cssVariablesData.object) || {};
            // }

            // New code
            const configurationObject: ConfigurationObject = await pepperi.addons.configurations.get(THEME_TABS_DATA_UUID);
            result = configurationObject?.Data[THEME_TABS_DATA_PROPERTY] || {};
        } else {
            // Get the cssVariables data online if sync isn't installed.
            const temp = await pepperi.papiClient.apiCall("GET", `addons/api/${config.AddonUUID}/themes/get_published_theme?key=${key}`);
            result = temp.ok ? await(temp.json()) : null;
        }

        result = this.getObjectFromPropertiesPath(result, key);

        return result;
    }
}
export default ThemesService;