import {PapiClient, InstalledAddon, Relation, AddonDataScheme, AddonData} from '@pepperi-addons/papi-sdk';
import {Client} from '@pepperi-addons/debug-server';

export const THEMES_TABLE_NAME = 'Themes';
export const CSS_VARIABLES_TABLE_NAME = 'CssVariables';

const DATA_OBJECT_KEY = 'themes';

export interface OldAddonData {
    unPublishedThemeObj: any;
    publishedThemeObj: any;
    publishComment: string;
    webappVariables: any;
}
export interface ThemesMergedData {
    unPublishedThemeObj: any;
    publishedThemeObj: any;
    publishComment: string;
    cssVariables: any;
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

    private async getThemesData() {
        const themesData = await this.papiClient.addons.data.uuid(this.addonUUID).table(THEMES_TABLE_NAME).key(DATA_OBJECT_KEY).get();
        return themesData;
    }

    private async getCssVariables() {
        const cssVarsData = await this.papiClient.addons.data.uuid(this.addonUUID).table(CSS_VARIABLES_TABLE_NAME).key(DATA_OBJECT_KEY).get();
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
    
    /**
     * Install theme addon.
     */
     async createRelationsAndInstallThemes() {
        await this.installTheme();
        await this.upsertSettingsRelation();
        await this.createThemesTablesSchemes();

        await this.upsertThemeDataMigration();
    }

    async getCssVariablesResultObject() {
        let result = {};

        // Old code
        // let webappVariables = {};
        // const installedAddon = await this.papiClient.addons.installedAddons.addonUUID(this.addonUUID).get();

        // if (installedAddon && installedAddon.AdditionalData) {
        //     webappVariables = JSON.parse(installedAddon.AdditionalData).webappVariables;
        // }

        // New code
        result['success'] = true;
        result['resultObject'] = await this.getCssVariables();
        
        return result;
    }
    
    async getMergedData(): Promise<ThemesMergedData> {
        const otherData: any = await this.getThemesData();
        const cssVariables = await this.getCssVariables();

        const res: ThemesMergedData = {
            unPublishedThemeObj: otherData.unPublishedThemeObj,
            publishedThemeObj: otherData.publishedThemeObj,
            publishComment: otherData.publishComment,
            cssVariables: cssVariables
        };

        return res;
    }

    /**
     * Save the theme object into addon additional data and adal.
     */
     async saveTheme(unPublishedThemeObj): Promise<AddonData | null> {
        let res: AddonData | null = null;
        // // Legacy support
        // // ****************************************************************
        // const themesAdditionalData: ThemesMergedData | null = await this.getThemesAdditionalDataFromInstalledAddon();
        
        // if (themesAdditionalData != null) {
        //     themesAdditionalData.unPublishedThemeObj = unPublishedThemeObj;
        //     const addonData: any = {
        //         Addon: {UUID: this.addonUUID},
        //         AdditionalData: JSON.stringify(themesAdditionalData),
        //     };

        //     await this.papiClient.addons.installedAddons.upsert(addonData);
        // }
        // // ****************************************************************

        // Save in the new table.
        const otherData: any = await this.getThemesData();
        otherData.unPublishedThemeObj = unPublishedThemeObj
        
        res = await this.papiClient.addons.data.uuid(this.addonUUID).table(THEMES_TABLE_NAME).upsert(otherData);
            
        return res;
    }

    /**
     * Publish the theme object into addon additional data.
     */
     async publishTheme(mergedData: ThemesMergedData): Promise<ThemesMergedData> {
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
                unPublishedThemeObj: mergedData.unPublishedThemeObj,
                publishedThemeObj: mergedData.publishedThemeObj,
                publishComment: mergedData?.publishComment || ''
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
}

export default MyService;
