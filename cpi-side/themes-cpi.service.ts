import { IClient } from '@pepperi-addons/cpi-node/build/cpi-side/events';

const CSS_VARIABLES_TABLE_NAME = 'CssVariables';
const DATA_OBJECT_KEY = 'themes';

class ThemesService {
    
    constructor() {}

    async getThemeCssVariables(client: IClient | undefined): Promise<any> {
        let res = {};
        const cssVariablesData = await pepperi.api.adal.get({
            addon: '95501678-6687-4fb3-92ab-1155f47f839e',
            table: CSS_VARIABLES_TABLE_NAME,
            key: DATA_OBJECT_KEY
        });
        
        if (cssVariablesData.object) {
            res = (cssVariablesData.object).cssVariables || {};
        }
        
        return res;
    }
}
export default ThemesService;