import { Client } from '@pepperi-addons/debug-server';
import { ThemesService } from "./themes.service";
import semver from 'semver';
import { CSS_VARIABLES_TABLE_NAME, DATA_OBJECT_KEY, THEMES_TABLE_NAME } from 'shared';

export class ThemesUpgradeService extends ThemesService {
    constructor(client: Client) {
        super(client);
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
                    const themePublishedObj = await this.papiClient.addons.data.uuid(this.addonUUID).table(CSS_VARIABLES_TABLE_NAME).key(DATA_OBJECT_KEY).get();
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

    private async copyLegacyColors() {
        console.log('copyLegacyColors - enter');

        try {
            const themeData = await this.getThemeData(DATA_OBJECT_KEY);
            const brandingUIControl = await this.papiClient.get(`/uicontrols?where=Type='Branding'`);
            const uiControlData = brandingUIControl[0] ? JSON.parse(brandingUIControl[0].UIControlData) : null;

            let userLegacyColor = uiControlData?.ControlFields.find(f => f.ApiName === 'BrandingMainColor')?.DefaultValue || '#3f673f';
            let userLegacySecondaryColor = uiControlData?.ControlFields.find(f => f.ApiName === 'BrandingSecondaryColor')?.DefaultValue || '#ffff00';
            
            themeData.unPublishedThemeObj['userLegacyColor'] = userLegacyColor;
            themeData.unPublishedThemeObj['userLegacySecondaryColor'] = userLegacySecondaryColor;
            
            if (themeData.publishedThemeObj) {
                themeData.publishedThemeObj['userLegacyColor'] = userLegacyColor;
                themeData.publishedThemeObj['userLegacySecondaryColor'] = userLegacySecondaryColor;
                themeData.publishComment = 'Auto - Copy colors from UI control to theme.';
            }
            
            await this.papiClient.addons.data.uuid(this.addonUUID).table(THEMES_TABLE_NAME).upsert(themeData);

            // Publish with the new colors data.
            if (themeData.publishedThemeObj) {
                const themePublishedObj = await this.papiClient.addons.data.uuid(this.addonUUID).table(CSS_VARIABLES_TABLE_NAME).key(DATA_OBJECT_KEY).get();
                const header = {
                    useTopHeaderColorLegacy: themePublishedObj.useTopHeaderColorLegacy || themeData.publishedThemeObj.useTopHeaderColorLegacy,
                    userLegacyColor: userLegacyColor,
                    topHeaderColor: themePublishedObj.topHeaderColor || themeData.publishedThemeObj.topHeaderColor,
                    topHeaderStyle: themePublishedObj.topHeaderStyle || themeData.publishedThemeObj.topHeaderStyle,
                }
                themePublishedObj['header'] = header;
                
                await this.papiClient.addons.data.uuid(this.addonUUID).table(CSS_VARIABLES_TABLE_NAME).upsert(themePublishedObj)
            }

        } catch (err) {
            console.error(`Error in copyLegacyColors: ${err}`);
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

    private async migrateToV2_1_12(fromVersion) {
        // check if the upgrade is from versions before 2.1.12
        // 2.1.12 is the version that uses the new files
        // console.log('semver comperation' + semver.lt(fromVersion, '2.1.12') + ' fromVersion: ' + fromVersion);
        if (fromVersion && semver.lt(fromVersion, '2.1.12')) {
            // Copy the legacy colors from the UI control.
            await this.copyLegacyColors();
        }
    }

    // migrate from the old cpi node file approach the the new one
    async performMigration(fromVersion, toVersion, upgrade = true) {
        // Copy old colors
        await this.migrateToV2_1_12(fromVersion);

        if (upgrade) {
            // Copy old logo's
            await this.migrateToV2_0_23(fromVersion);

            // Move to configurations.
            await this.migrateToV2_2_0(fromVersion);
        }
    }

    //*********************************************************************************************
    //*     Upgrade to version 2.2.0 - change to work with configuration instead of ADAL - Begin
    //*********************************************************************************************
    
    private async copyOldDataToConfigurations() {
        // Copy the published data to configuration
        try {
            const themePublishedObj = await this.papiClient.addons.data.uuid(this.addonUUID).table(CSS_VARIABLES_TABLE_NAME).key(DATA_OBJECT_KEY).get();
            await this.publishCssVariablesInternal(themePublishedObj);

            // // Remove the old theme.
            // theme.Hidden = true;
            // await this.papiClient.addons.data.uuid(this.addonUUID).table(CSS_VARIABLES_TABLE_NAME).upsert(theme);
        } catch (error) {
            console.log(error);
        }
    }

    private async migrateToV2_2_0(fromVersion) {
        // check if the upgrade is from versions before 2.2.0
        console.log('semver comperation' + semver.lt(fromVersion, '2.2.0') + ' fromVersion: ' + fromVersion);
        if (fromVersion && semver.lt(fromVersion, '2.2.0')) {
            // Copy all data from publish css variables to configuration and publish it.
            await this.copyOldDataToConfigurations();
            
            // TODO: Should we need this?
            // try {
            //     // Remove the ADAL scheme from the addon ??
            //     await this.removeAdalSchema();
            // } catch (error) {
            //     console.log(error);
            // }
        }
    }

    //*********************************************************************************************
    //*     Upgrade to version 2.2.0 - change to work with configuration instead of ADAL - End
    //*********************************************************************************************
}