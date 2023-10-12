import { PapiClient, InstalledAddon, Relation, AddonDataScheme, AddonData, NgComponentRelation, FormDataView, FindOptions } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server';
import { CSS_VARIABLES_TABLE_NAME, DATA_OBJECT_KEY, THEMES_TABLE_NAME, THEME_TABS_RELATION_NAME, ThemesMergedData, THEME_FONT_BODY_FIELD_ID } from 'shared';
import semver from 'semver';
import jwt_decode from "jwt-decode";
// const fs = require('fs');
// const util = require('util');
// import fs from 'fs';
import fetch from 'node-fetch';

export interface OldAddonData {
    unPublishedThemeObj: any;
    publishedThemeObj: any;
    publishComment: string;
    webappVariables: any;
}

export const THEMES_VARIABLES_TABLE_NAME = 'ThemesVariables';

class MyService {
    papiClient: PapiClient;
    addonUUID: string;
    themesBlockName = 'Plugin';

    distId: string;
    distUUID: string;
    wacdbaseurl: string;

    constructor(private client: Client) {
        this.addonUUID = client.AddonUUID;
        
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });

        // Save this data for the migration.
        const decodedToken: any = jwt_decode(client.OAuthAccessToken);
        this.distId = decodedToken["pepperi.distributorid"];
        this.distUUID = decodedToken["pepperi.distributoruuid"].toLowerCase();
        this.wacdbaseurl = decodedToken["pepperi.wacdbaseurl"];
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

    private async upsertRelation(relation): Promise<any> {
        return await this.papiClient.post('/addons/data/relations', relation);
    }

    private async getThemeData(key: string) {
        const themesData = await this.papiClient.addons.data.uuid(this.addonUUID).table(THEMES_TABLE_NAME).key(key).get();
        return themesData;
    }

    private async getPublishedThemesData(key: string) {
        const publishedThemesData = await this.papiClient.addons.data.uuid(this.addonUUID).table(CSS_VARIABLES_TABLE_NAME).key(key).get();
        return publishedThemesData;
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

    private async publishPepperiTheme(mergedData: ThemesMergedData, message: string): Promise<any> {
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

            let themePublishedObj;
            try {
                themePublishedObj = await this.getPublishedThemesData(DATA_OBJECT_KEY);
            } catch {
                if (!themePublishedObj) {
                    themePublishedObj = {
                        Key: DATA_OBJECT_KEY,
                    }
                }
            }

            // Save css variables and other properties.
            themePublishedObj['cssVariables'] = mergedData.cssVariables;
            themePublishedObj['branding'] = mergedData.branding;
            await this.papiClient.addons.data.uuid(this.addonUUID).table(CSS_VARIABLES_TABLE_NAME).upsert(themePublishedObj)

            // Prepare the result.
            res = themePublishedObj;
        }
            
        return res;
    }

    private async publishAddonThemeInternal(addonKey: string, theme: any, message: string): Promise<any> {
        // Save in the new table.
        if (theme) {
            const themeData: any = await this.getThemeData(addonKey);

            // If the objects are different
            if (JSON.stringify(theme) !== JSON.stringify(themeData.publishedThemeObj)) {

                // Save themes published and unpublished.
                const addonThemeData: any = {
                    Key: addonKey,
                    unPublishedThemeObj: theme,
                    publishedThemeObj: theme,
                    publishComment: message || ''
                };

                await this.papiClient.addons.data.uuid(this.addonUUID).table(THEMES_TABLE_NAME).upsert(addonThemeData);
            }
        }
            
        return theme;
    }

    private async publishMergedThemesInternal(addonsThemes: Array<{addonKey: string, theme: any}> = []): Promise<any> {
        let themePublishedObj;

        if (addonsThemes.length > 0) {
            themePublishedObj = await this.getPublishedThemesData(DATA_OBJECT_KEY);
    
            for (let index = 0; index < addonsThemes.length; index++) {
                const addonThemeObj = addonsThemes[index];
                
                // Init the publish object.
                let addonPublishedTheme = addonThemeObj.theme;
        
                // Get the tab relations 
                const tabRelations: NgComponentRelation[] = await this.getRelations(THEME_TABS_RELATION_NAME);
                const currentAddonRelation = tabRelations.find(tr => tr.AddonUUID === addonThemeObj.addonKey);
        
                // Get the data from the addon publish endpoint (in the relation).
                if (currentAddonRelation?.OnPublishEndpoint?.length > 0) {
                    try {
                        addonPublishedTheme = await this.papiClient.get(`${this.client.BaseURL}/addons/api/${addonThemeObj.addonKey}/${currentAddonRelation?.OnPublishEndpoint}`);
                    } catch {
                        // Do nothing
                    }
                }
        
                if (currentAddonRelation?.Name) {
                    themePublishedObj[currentAddonRelation.Name] = addonPublishedTheme;
                }
            }
            
            await this.papiClient.addons.data.uuid(this.addonUUID).table(CSS_VARIABLES_TABLE_NAME).upsert(themePublishedObj)
        }

        return themePublishedObj;
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

    private async saveAddonThemeInternal(themeKey: string, themeObj: any): Promise<AddonData | null> {
        let res: AddonData | null = null;
        let addonTheme;
        
        try {
            addonTheme = await this.getThemeData(themeKey); 
        } catch {
            // Do noting
        }
        
        // Create the object if not exist.
        if (!addonTheme) {
            addonTheme = {
                Key: themeKey,
                publishedThemeObj: null,
                publishComment: '',
            }; 
        }

        // Set the unPublishedThemeObj
        addonTheme['unPublishedThemeObj'] = themeObj;
        
        res = await this.papiClient.addons.data.uuid(this.addonUUID).table(THEMES_TABLE_NAME).upsert(addonTheme);
            
        return res;
    }

    /***********************************************************************************************/
    //                              VarSettings functions
    /************************************************************************************************/
    
    private async upsertVarSettingsRelation(): Promise<void> {
        const title = 'Themes variables'; // The title of the tab in which the fields will appear;
        const dataView: FormDataView = {
            Type: 'Form',
            Context: {
                Object: {
                    Resource: "None",
                    InternalID: 1,
                },
                Name: 'Themes variables data view',
                ScreenSize: 'Tablet',
                Profile: {
                    InternalID: 1,
                    Name: 'MyProfile'
                }
            },
            Fields: [{
                FieldID: THEME_FONT_BODY_FIELD_ID,
                Type: 'TextBox',
                Title: 'External font body options',
                Mandatory: false,
                ReadOnly: false,
                Layout: {
                    Origin: {
                        X: 0,
                        Y: 0
                    },
                    Size: {
                        Width: 1,
                        Height: 0
                    }
                },
                Style: {
                    Alignment: {
                        Horizontal: 'Stretch',
                        Vertical: 'Stretch'
                    }
                }
            }]
        };
        
        // Create new var settings relation.
        const varSettingsRelation: Relation = {
            RelationName: 'VarSettings',
            Name: THEMES_VARIABLES_TABLE_NAME,
            Description: 'Set themes variables from var settings',
            Type: 'AddonAPI',
            AddonUUID: this.addonUUID,
            AddonRelativeURL: '/api/themes_variables',
            Title: title,
            DataView: dataView
        };                

        await this.upsertRelation(varSettingsRelation);
    }

    private async getThemesVariablesInternal(options: FindOptions | undefined = undefined): Promise<any> {
        // Get the themes variables
        let themesVariables;

        try {
            themesVariables = await this.papiClient.addons.data.uuid(this.addonUUID).table(THEMES_VARIABLES_TABLE_NAME).key(THEMES_VARIABLES_TABLE_NAME).get();
        } catch {
            // Declare default.
            themesVariables = { Key: THEMES_VARIABLES_TABLE_NAME };
        }

        return themesVariables;
    }
    
    async saveThemesVariables(varSettingsParams: any) {
        // Save the key on the object for always work on the same object.
        varSettingsParams['Key'] = THEMES_VARIABLES_TABLE_NAME;
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(THEMES_VARIABLES_TABLE_NAME).upsert(varSettingsParams);
    }

    async getThemesVariables(options: FindOptions | undefined = undefined): Promise<any> {
        return await this.getThemesVariablesInternal(options);
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
        await this.upsertVarSettingsRelation();
        await this.createThemesTablesSchemes();

        await this.upsertThemeDataMigration();
    }

    async getCssVariablesResultObject(query: any) {
        let result = {};
        result['success'] = true;
        
        const themePublishedObj = await this.getPublishedThemesData(DATA_OBJECT_KEY);
        result['resultObject'] = themePublishedObj?.cssVariables || {};
        
        return result;
    }
    
    async getPublishedThemeObject(query: any) {
        const themePublishedObj = await this.getPublishedThemesData(DATA_OBJECT_KEY);
        return themePublishedObj;
    }
    
    async getPepperiTheme(query: any): Promise<any> {
        const published = query['published'] === 'true';
        const otherData: any = await this.getThemeData(DATA_OBJECT_KEY);
        return published ? otherData.publishedThemeObj : otherData.unPublishedThemeObj;
    }

    async getAddonsThemes(query: any): Promise<any> {
        const res: any[] = [];
        const published = query['published'] === 'true';

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
                key: at.relation.AddonUUID,
                relation: at.relation,
                addonPublicBaseURL: at.addonPublicBaseURL,
                theme: addonTheme,
            });
        }
        
        return res;
    }

    async getAddonTheme(query: any): Promise<any> {
        const key = query['key'] || '';
        const published = query['published'] === 'true';
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
        let res: any = null;
        const addonTheme = body.Theme;
        const message = body.Message;

        const lowerCaseHeaders = this.getLowerCaseHeaders(header);
        const addonUUID = lowerCaseHeaders["x-pepperi-ownerid"]; // Get the uuid from the X-Pepperi-OwnerID

        // Check if valid
        if (await this.checkIfAddonIsValid(header)) {
            await this.publishAddonThemeInternal(addonUUID, addonTheme, message);
            res = await this.publishMergedThemesInternal([{ addonKey: addonUUID, theme: addonTheme }]);
        }

        return res;
    }

    async publishThemes(body: any): Promise<ThemesMergedData> {
        let res: any = null;
        const themes: Array<ThemesMergedData> = body.Themes;
        const message = body.Message;

        await this.publishPepperiTheme(themes[0], message);
        
        const addonsThemes: Array<{addonKey: string, theme: any}> = [];
        // Publish all the rest of the addons themes.
        for (let index = 1; index < themes.length; index++) {
            const addonTheme = themes[index];
            if (addonTheme.key) {
                await this.publishAddonThemeInternal(addonTheme.key, addonTheme.theme, message);
                addonsThemes.push({ addonKey: addonTheme.key, theme: addonTheme.theme });
            }
        }

        res = await this.publishMergedThemesInternal(addonsThemes);

        return res;
    }

    /***********************************************************************************************/
    /*                                  Migration functions
    /***********************************************************************************************/

    private arrayBufferToBase64(buffer) {
        var binary = '';
        var bytes = [].slice.call(new Uint8Array(buffer));

        bytes.forEach((b) => binary += String.fromCharCode(b));

        return btoa(binary);
    };

    private async getLogoAsset() {
        try {
            // Download old logo
            const url = `${this.wacdbaseurl}/wrntyimages/distributors/${this.distId}.jpg`; // test some logo - 'https://cpapi.pepperi.com/wrntyimages/distributors/117779723.jpg';
            let response = await fetch(url);
            const base64Prefix = 'data:image/jpeg;base64,';
            let buffer;

            if (response?.status === 200) {
                buffer = await response.arrayBuffer();
            } else {
                // Take default logo if something is wrong.
                // const data = await fs.promises.readFile('images/logo.png');
                // buffer = Buffer.from(data);
                response = await fetch(`https://webapp.pepperi.com/V17_16/WebApp_124/assets/images/Pepperi-Logo-HiRes.png`);
                if (response?.status === 200) {
                    buffer = await response.arrayBuffer();
                }
            }
            
            const base64String = this.arrayBufferToBase64(buffer);

            let body = {
                Key: "logo.jpg", 
                Description: "logo",
                MIME: "image/jpeg",
                Sync: "Device",
                URI: base64Prefix + base64String
            }

            // Upload it to the assets.
            const assetsAddonUUID = 'ad909780-0c23-401e-8e8e-f514cc4f6aa2';
            const asset: any = await this.papiClient.addons.api.uuid(assetsAddonUUID).file('api').func('upsert_asset').post('', body);
            return asset ? { key: asset.Key, url: asset.URL } : null;
        } catch (err) {
            // Do nothing
            console.error(`Error in getLogoAsset: ${err}`);
        }

        return null;
    }

    private async getFaviconAsset() {
        try {
            // Take default favicon.
            const response = await fetch(`https://webapp.pepperi.com/favicon.ico`);
            let buffer;
            
            if (response?.status === 200) {
                buffer = await response.arrayBuffer();
            }

            // const data = await fs.promises.readFile('images/favicon.ico');
            // const buffer = Buffer.from(data);
            const base64Prefix = 'data:image/jpeg;base64,';
            const base64String = this.arrayBufferToBase64(buffer);

            let body = {
                Key: "favicon.jpg", 
                Description: "favicon",
                MIME: "image/jpeg",
                Sync: "Device",
                URI: base64Prefix + base64String
            }

            // Upload it to the assets.
            const assetsAddonUUID = 'ad909780-0c23-401e-8e8e-f514cc4f6aa2';
            const asset: any = await this.papiClient.addons.api.uuid(assetsAddonUUID).file('api').func('upsert_asset').post('', body);
            return asset ? { key: asset.Key, url: asset.URL } : null;
        } catch (err) {
            // Do nothing
            console.error(`Error in getFaviconAsset: ${err}`);
        }

        return null;
    }

    private async copyOldFilesToNewLocation() {
        console.log('copyOldFilesToNewLocation - enter');

        try {
            // Download old logo
            const logoAsset = await this.getLogoAsset();
            const faviconAsset = await this.getFaviconAsset();
            
            // Set the assets result in the branding object of the themes published and unpublished.
            if (logoAsset && faviconAsset) {
                const themeData = await this.getThemeData(DATA_OBJECT_KEY);
                
                themeData.unPublishedThemeObj['logoAsset'] = logoAsset;
                themeData.unPublishedThemeObj['faviconAsset'] = faviconAsset;
                
                if (themeData.publishedThemeObj) {
                    themeData.publishedThemeObj['logoAsset'] = logoAsset;
                    themeData.publishedThemeObj['faviconAsset'] = faviconAsset;
                    themeData.publishComment = 'Auto - Copy logo from old place to assets.';
                }
                
                await this.papiClient.addons.data.uuid(this.addonUUID).table(THEMES_TABLE_NAME).upsert(themeData);
    
                // Publish with the new branding object.
                if (themeData.publishedThemeObj) {
                    const themePublishedObj = await this.getPublishedThemesData(DATA_OBJECT_KEY);
                    const branding: any = {
                        logoAssetKey: logoAsset?.key || '',
                        faviconAssetKey: faviconAsset?.key || '',
                    };
                    themePublishedObj['branding'] = branding;
                    await this.papiClient.addons.data.uuid(this.addonUUID).table(CSS_VARIABLES_TABLE_NAME).upsert(themePublishedObj)
                }
            }
        } catch (err) {
            console.error(`Error in copyOldFilesToNewLocation: ${err}`);
            // Do nothing
        }
    }

    private async migrateToV2_0_23(fromVersion) {
        // check if the upgrade is from versions before 2.0.23
        // 2.0.23 is the version that uses the new files
        console.log('semver comperation' + semver.lt(fromVersion, '2.0.23') + ' fromVersion: ' + fromVersion);
        if (fromVersion && semver.lt(fromVersion, '2.0.23')) {
            // Copy the files from the old location to the new one.
            await this.copyOldFilesToNewLocation();
        }
    }

    // migrate from the old cpi node file approach the the new one
    async performMigration(fromVersion, toVersion) {
        await this.migrateToV2_0_23(fromVersion);
    }

}

export default MyService;
