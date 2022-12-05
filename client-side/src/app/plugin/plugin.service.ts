import {Injectable} from '@angular/core';
import { PepAddonService, PepHttpService } from '@pepperi-addons/ngx-lib';
import { ThemesMergedData } from './plugin.model';

@Injectable()
export class PluginService {
    addonUUID;

    constructor(public addonService: PepAddonService, public httpService: PepHttpService) {}
    // Additional Data is the object where all the plugin's data should be saved
    getAdditionalData(successFunc, errorFunc) {
        // Old code
        // this.httpService.getPapiApiCall(`/addons/installed_addons/${this.addonUUID}`).subscribe(
        //     (success) => {
        //         if (successFunc) { successFunc(success); }
        //     },
        //     (error) => {
        //         if (errorFunc) { errorFunc(error); }
        //     },
        //     () => {
        //         // Do nothing
        //     }
        // );

        // New code.
        this.addonService.getAddonApiCall(this.addonUUID, 'themes', 'merged_data').subscribe(
            (success) => {
                if (successFunc) { successFunc(success); }
            },
            (error) => {
                if (errorFunc) { errorFunc(error); }
            },
            () => {
                // Do nothing
            }
        );
    }

    saveTheme(themeObj: any, successFunc, errorFunc = null) {
        // Old code
        // this.getAdditionalData(
        //     (res) => {
        //         const additionalData = JSON.parse(res.AdditionalData);
        //         additionalData.unPublishedThemeObj = themeObj;

        //         const body = {
        //             Addon: {UUID: this.addonUUID},
        //             AdditionalData: JSON.stringify(additionalData),
        //         };

        //         this.httpService.postPapiApiCall('/addons/installed_addons', body)
        //             .subscribe(
        //                 (success) => {
        //                     if (successFunc) { successFunc(success); }
        //                 },
        //                 (error) => {
        //                     if (errorFunc) { errorFunc(error); }
        //                 },
        //                 () => {
        //                     // Do nothing
        //                 }
        //             );
        //     },
        //     (error) => {
        //         if (errorFunc) {
        //             errorFunc(error);
        //         }
        //     }
        // );

        // New code.
        this.addonService.postAddonApiCall(this.addonUUID, 'themes', 'save', themeObj).subscribe(
            (success) => {
                if (successFunc) { successFunc(success); }
            },
            (error) => {
                if (errorFunc) { errorFunc(error); }
            },
            () => {
                // Do nothing
            }
        );
    }

    publishTheme(mergedData: ThemesMergedData, successFunc, errorFunc = null) {
        // const body = {
        //     Comment: publishComment,
        //     AddonData: {
        //         Addon: {UUID: this.addonUUID},
        //         AdditionalData: JSON.stringify(additionalData),
        //     },
        // };

        this.addonService.postAddonApiCall(this.addonUUID, 'themes', 'publish', mergedData)
            .subscribe(
                (success) => {
                    if (successFunc) { successFunc(success); }
                },
                (error) => {
                    if (errorFunc) { errorFunc(error); }
                },
                () => {
                    // Do nothing
                }
            );

    }
}
