import {PapiClient, InstalledAddon, Relation, AddonDataScheme, AddonData, NgComponentRelation} from '@pepperi-addons/papi-sdk';
import {Client} from '@pepperi-addons/debug-server';

export const THEMES_TABLE_NAME = 'Themes';
export const CSS_VARIABLES_TABLE_NAME = 'CssVariables';

const DATA_OBJECT_KEY = 'themes';
const THEME_TABS_RELATION_NAME = 'ThemeTabs';
export interface OldAddonData {
    unPublishedThemeObj: any;
    publishedThemeObj: any;
    publishComment: string;
    webappVariables: any;
}
export interface ThemesMergedData {
    key?: string;
    theme: any;
    cssVariables?: any;
}

export interface ThemePublishData {
    Theme: any;
    PublishComment: string;
}

class MyService {
    papiClient: PapiClient;
    addonUUID: string;
    themesBlockName = 'Plugin';

    constructor(private client: Client) {
        this.addonUUID = client.AddonUUID;
        
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });
    }

    private async createThemesTablesSchemes(): Promise<AddonDataScheme[]> {
        const promises: AddonDataScheme[] = [];

        // Create themes table
        const createThemesTable = await this.papiClient.addons.data.schemes.post({
            Name: THEMES_TABLE_NAME,
            Type: 'data'
        });

        // Create css variables table
        const createCssVarsTable = await this.papiClient.addons.data.schemes.post({
            Name: CSS_VARIABLES_TABLE_NAME,
            Type: 'data',
            SyncData: {
                Sync: true
            }
        });

        promises.push(createThemesTable);
        promises.push(createCssVarsTable);
        return Promise.all(promises);
    }

    private async upsertThemeDataMigration() {
        const themesObjects = await this.papiClient.addons.data.uuid(this.addonUUID).table(THEMES_TABLE_NAME).find();
        const cssVars = await this.papiClient.addons.data.uuid(this.addonUUID).table(CSS_VARIABLES_TABLE_NAME).find();

        if (themesObjects.length === 0 && cssVars.length === 0) {
            const themesAdditionalData: OldAddonData | null = await this.getThemesAdditionalDataFromInstalledAddon();

            if (themesAdditionalData != null) {
                // Insert the css variables.
                const cssVariablesData = {
                    Key: DATA_OBJECT_KEY,
                    cssVariables: themesAdditionalData.webappVariables
                };

                await this.papiClient.addons.data.uuid(this.addonUUID).table(CSS_VARIABLES_TABLE_NAME).upsert(cssVariablesData)

                // Insert the themes published and unpublished.
                const otherData = {
                    Key: DATA_OBJECT_KEY,
                    unPublishedThemeObj: themesAdditionalData.unPublishedThemeObj,
                    publishedThemeObj: themesAdditionalData.publishedThemeObj,
                    publishComment: '',
                };
                await this.papiClient.addons.data.uuid(this.addonUUID).table(THEMES_TABLE_NAME).upsert(otherData);
            }
        }

    }

    private async installTheme(): Promise<any> {
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

        const body:InstalledAddon = {
            Addon: {UUID: this.client.AddonUUID},
            SystemData: JSON.stringify(systemData),
            PublicBaseURL: ""
        };
  
        
        try {
            const tmpResult: any = await this.papiClient.addons.installedAddons.upsert(body);
            result['success'] = tmpResult.Status;
            result['resultObject'] = {};
        } catch (error) {
            // result['success'] = false;
            // result['errorMessage'] = error.message;
            // result['resultObject'] = null;
        }

        return result;
    }

    private async upsertSettingsRelation() {
        const addonBlockRelation: Relation = {
            RelationName: "SettingsBlock",
            GroupName: 'BrandedApp',
            SlugName: 'themes',
            Name: "Themes",
            Description: 'Themes editor',
            Type: "NgComponent",
            SubType: "NG14",
            AddonUUID: this.addonUUID,
            AddonRelativeURL: `file_${this.addonUUID}`,
            ComponentName: `${this.themesBlockName}Component`,
            ModuleName: `${this.themesBlockName}Module`,
            ElementsModule: 'WebComponents',
            ElementName: `settings-element-${this.addonUUID}`,
        }; 
        
        await this.upsertRelation(addonBlockRelation);
    }

    private upsertRelation(relation): Promise<any> {
        return this.papiClient.post('/addons/data/relations', relation);
    }

    private async getThemeData(key: string) {
        const themesData = await this.papiClient.addons.data.uuid(this.addonUUID).table(THEMES_TABLE_NAME).key(key).get();
        return themesData;
    }

    private async getCssVariables(key: string) {
        const cssVarsData = await this.papiClient.addons.data.uuid(this.addonUUID).table(CSS_VARIABLES_TABLE_NAME).key(key).get();
        return cssVarsData.cssVariables;
    }

    private async getThemesAdditionalDataFromInstalledAddon(): Promise<OldAddonData | null> {
        let themesOldData: OldAddonData | null = null;
        const installedAddon = await this.papiClient.addons.installedAddons.addonUUID(this.addonUUID).get();

        if (installedAddon && installedAddon.AdditionalData) {
            themesOldData = JSON.parse(installedAddon.AdditionalData) as OldAddonData;
        }

        return themesOldData;
    }
    
    private getRelations(relationName: string): Promise<any> {
        return this.papiClient.addons.data.relations.find({where: `RelationName=${relationName}`});
    }

    private getInstalledAddon(uuid: string): Promise<InstalledAddon> {
        return this.papiClient.addons.installedAddons.addonUUID(uuid).get();
    }

    private async publishPepperiTheme(mergedData: ThemesMergedData, message: string): Promise<ThemesMergedData> {
        let res: any = null;
        // Legacy support
        // ****************************************************************
        // const addonData = body && body.AddonData ? body.AddonData : {};
        // await this.papiClient.addons.installedAddons.upsert(addonData);
        // ****************************************************************
     
        // Save in the new table.
        if (mergedData) {
            // Save themes published and unpublished.
            const otherData: any = {
                Key: DATA_OBJECT_KEY,
                unPublishedThemeObj: mergedData.theme,
                publishedThemeObj: mergedData.theme,
                publishComment: message || ''
            };

            await this.papiClient.addons.data.uuid(this.addonUUID).table(THEMES_TABLE_NAME).upsert(otherData);
            
            // Save css variables.
            const cssVarsData = {
                Key: DATA_OBJECT_KEY,
                cssVariables: mergedData.cssVariables
            };
            await this.papiClient.addons.data.uuid(this.addonUUID).table(CSS_VARIABLES_TABLE_NAME).upsert(cssVarsData)

            // Prepare the result.
            res = otherData;
            res['cssVariables'] = cssVarsData.cssVariables;
        }
            
        return res;
    }

    private async publishAddonThemeInternal(addonKey: string, addonTheme: ThemesMergedData, message: string): Promise<any> {
        let res: any = null;
        
        // Save in the new table.
        if (addonTheme?.theme) {
            const themeData: any = this.getThemeData(addonKey);

            // If the objects are different
            if (JSON.stringify(addonTheme.theme) !== JSON.stringify(themeData.publishedThemeObj)) {

                // Save themes published and unpublished.
                const addonThemeData: any = {
                    Key: addonKey,
                    unPublishedThemeObj: addonTheme.theme,
                    publishedThemeObj: addonTheme.theme,
                    publishComment: message || ''
                };

                await this.papiClient.addons.data.uuid(this.addonUUID).table(THEMES_TABLE_NAME).upsert(addonThemeData);
                
                // Init the css variables.
                let cssVariables = addonTheme.theme;

                // Get the tab relations 
                const tabRelations: NgComponentRelation[] = await this.getRelations(THEME_TABS_RELATION_NAME);
                const currentAddonRelation = tabRelations.find(tr => tr.AddonUUID === addonKey);

                // Get the data from the addon publish endpoint (in the relation).
                if (currentAddonRelation?.OnPublishEndpoint?.length > 0) {
                    try {
                        cssVariables = await this.papiClient.get(`${this.client.BaseURL}/addons/api/${addonKey}/${currentAddonRelation?.OnPublishEndpoint}`);
                    } catch {
                        // Do nothing
                    }
                }

                // Save the css variables. 
                const cssVarsAddonData = {
                    Key: addonKey,
                    cssVariables: cssVariables
                };

                await this.papiClient.addons.data.uuid(this.addonUUID).table(CSS_VARIABLES_TABLE_NAME).upsert(cssVarsAddonData)
            }

            res = addonTheme.theme;
        }
            
        return res;
    }

	private getLowerCaseHeaders(header: any) 
	{
		const lowerCaseHeaders = {};
		for (const [key, value] of Object.entries(header)) 
		{
			lowerCaseHeaders[key.toLowerCase()] = value;
		}
		return lowerCaseHeaders;
	}

    private async checkIfAddonIsValid(header: any) {
        const lowerCaseHeaders = this.getLowerCaseHeaders(header);

        const addonUUID = lowerCaseHeaders["x-pepperi-ownerid"];
        const res = await this.papiClient.get(`/var/sk/addons/${addonUUID}/validate`);
        return true;
    }

    /***********************************************************************************************/
    /*                                  Public functions
    /***********************************************************************************************/

    async getAvailableTabs(): Promise<any[]> {
        // Get the tab relations 
        const tabRelations: NgComponentRelation[] = await this.getRelations(THEME_TABS_RELATION_NAME);
                
        // Distinct the addons uuid's
        const distinctAddonsUuids = [...new Set(tabRelations.map(obj => obj.AddonUUID))];

        // Get the installed addons (for the relative path and the current version)
        const addonsPromises: Promise<any>[] = [];
        distinctAddonsUuids.forEach((uuid: any) => {
            addonsPromises.push(this.getInstalledAddon(uuid))
        });

        const addons: InstalledAddon[] = await Promise.all(addonsPromises).then(res => res);

        const availableTabs: any[] = [];
        tabRelations.forEach((relation: NgComponentRelation) => {
            const installedAddon: InstalledAddon | undefined = addons.find((ia: InstalledAddon) => ia?.Addon?.UUID === relation?.AddonUUID);
            if (installedAddon) {
                availableTabs.push({
                    relation: relation,
                    addonPublicBaseURL: installedAddon.PublicBaseURL
                });
            }
        });

        return availableTabs;
    }

    async createRelationsAndInstallThemes() {
        await this.installTheme();
        await this.upsertSettingsRelation();
        await this.createThemesTablesSchemes();

        await this.upsertThemeDataMigration();
    }

    async getCssVariablesResultObject(query: any) {
        let result = {};
        const key = query['key'] || DATA_OBJECT_KEY;
        result['success'] = true;
        result['resultObject'] = await this.getCssVariables(key);
        
        return result;
    }
    
    async getPepperiTheme(query: any): Promise<any> {
        const published = query['published'] ?? true;
        const otherData: any = await this.getThemeData(DATA_OBJECT_KEY);
        return published ? otherData.publishedThemeObj : otherData.unPublishedThemeObj;
    }

    async getAddonsThemes(query: any): Promise<any> {
        const res: any[] = [];
        const published = query['published'] ?? true;

        const addonsThemesData = await this.papiClient.addons.data.uuid(this.addonUUID).table(THEMES_TABLE_NAME).find();
        const availableTabs = await this.getAvailableTabs();

        for (let index = 0; index < availableTabs.length; index++) {
            const at = availableTabs[index];
            const element: any = addonsThemesData.find(themeData => themeData.Key === at.relation?.AddonUUID);
            let addonTheme = null;

            if (element) {
                addonTheme = (published ? element.publishedThemeObj : element.unPublishedThemeObj);
            }
            
            res.push({
                key: at.relation.Key,
                relation: at.relation,
                addonPublicBaseURL: at.addonPublicBaseURL,
                theme: addonTheme,
            });
        }
        
        return res;
    }

    async getAddonTheme(query: any): Promise<any> {
        const key = query['key'] || '';
        const published = query['published'] ?? true;
        try {
            const otherData: any = await this.getThemeData(key);
            return published ? otherData.publishedThemeObj : otherData.unPublishedThemeObj;
        } catch {
            return null;
        }
    }

    async savePepperiTheme(themeObj): Promise<AddonData | null> {
        let res: AddonData | null = null;
        
        const otherData: any = await this.getThemeData(DATA_OBJECT_KEY);
        otherData.unPublishedThemeObj = themeObj
        
        res = await this.papiClient.addons.data.uuid(this.addonUUID).table(THEMES_TABLE_NAME).upsert(otherData);
            
        return res;
    }

    private async saveAddonThemeInternal(themeKey: string, themeObj: any): Promise<AddonData | null> {
        let res: AddonData | null = null;
        let addonTheme;
        
        try {
            addonTheme = await this.getThemeData(themeKey); 
        } catch {
            // Do noting
        }
        
        // Create the object if not exist.
        if (!themeObj) {
            addonTheme = {
                Key: themeKey,
                publishedThemeObj: null,
                publishComment: '',
            }; 
        }

        // Set the unPublishedThemeObj
        addonTheme.unPublishedThemeObj = themeObj.Theme;
        
        res = await this.papiClient.addons.data.uuid(this.addonUUID).table(THEMES_TABLE_NAME).upsert(addonTheme);
            
        return res;
    }

    async saveAddonTheme(themeObj, header: any): Promise<AddonData | null> {
        const lowerCaseHeaders = this.getLowerCaseHeaders(header);
        const addonUUID = lowerCaseHeaders["x-pepperi-ownerid"]; // Get the uuid from the X-Pepperi-OwnerID
        
        return this.saveAddonThemeInternal(addonUUID, themeObj);
    }

    async saveAddonThemeFromEditor(body: any): Promise<AddonData | null> {
        if (body.key && body.theme) {
            return this.saveAddonThemeInternal(body.key, body.theme);
        } else {
            return null;
        }
    }

    async publishAddonTheme(body: any, header: any): Promise<any> {
        const addonTheme = body.Theme;
        const message = body.Message;

        const lowerCaseHeaders = this.getLowerCaseHeaders(header);
        const addonUUID = lowerCaseHeaders["x-pepperi-ownerid"]; // Get the uuid from the X-Pepperi-OwnerID

        // Check if valid
        if (await this.checkIfAddonIsValid(header)) {
            return this.publishAddonThemeInternal(addonUUID, addonTheme, message);
        }
    }

    async publishThemes(body: any): Promise<ThemesMergedData> {
        let res: any = null;
        const themes: Array<ThemesMergedData> = body.Themes;
        const message = body.Message;

        await this.publishPepperiTheme(themes[0], message);
        
        // Publish all the rest of the addons themes.
        for (let index = 1; index < themes.length; index++) {
            const addonTheme = themes[index];
            if (addonTheme.key) {
                this.publishAddonThemeInternal(addonTheme.key, addonTheme, message);
            }
        }

        return res;
    }
}

export default MyService;
