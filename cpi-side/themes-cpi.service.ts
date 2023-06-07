import { IClient } from '@pepperi-addons/cpi-node/build/cpi-side/events';
import config from "../addon.config.json";

const CSS_VARIABLES_TABLE_NAME = 'CssVariables';
const DATA_OBJECT_KEY = 'themes';

class ThemesService {
    
    constructor() {}

    private async isSyncInstalled(): Promise<boolean> {
        let isSyncInstalled = false;

        try {
            const res = await pepperi.api.adal.getList({
                addon: 'bb6ee826-1c6b-4a11-9758-40a46acb69c5', // CPI Node addon uuid
                table: 'addons'
            }); 
            
            isSyncInstalled = res?.objects?.length > 0 ? true : false;
        } catch {
            isSyncInstalled = false;
        }

        return isSyncInstalled;
    }

    private async getObjectFromPropertiesPath(obj: any, propertiesPath: any) {
        let result = obj;
        
        if (propertiesPath?.length > 0) {
            const propsNames = propertiesPath.split('.');

            for (let index = 0; index < propsNames.length; index++) {
                result = result[propsNames[index]];
                
                if (result !== undefined && result !== null) {
                    break;
                }
            }
        }
        
        return result;
    }
    
    async getThemeCssVariables(key: string = '', client: IClient | undefined = undefined): Promise<any> {
        let result = {};
        const isSyncInstalled = await this.isSyncInstalled();

        if (isSyncInstalled) {
            const cssVariablesData = await pepperi.api.adal.get({
                addon: config.AddonUUID,
                table: CSS_VARIABLES_TABLE_NAME,
                key: DATA_OBJECT_KEY
            });
            
            if (cssVariablesData.object) {
                result = (cssVariablesData.object).cssVariables || {};
            }
        } else {
            // Get the cssVariables data online if sync isn't installed.
            const temp = await pepperi.papiClient.apiCall("GET", `addons/api/${config.AddonUUID}/themes/css_variables?key=${key}`);
            const tmpRes = temp.ok ? await(temp.json()) : null;

            result = tmpRes.success ? tmpRes.resultObject || {} : {};
        }

        this.getObjectFromPropertiesPath(result, key)

        return result;
    }
}
export default ThemesService;