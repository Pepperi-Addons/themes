import {Component, ViewEncapsulation, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChild, ElementRef, TemplateRef, ViewContainerRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {PluginService} from './plugin.service';
import {TranslateService} from '@ngx-translate/core';
import { NgComponentRelation } from "@pepperi-addons/papi-sdk";

import { PepCustomizationService, PepLayoutType, PepStyleType, PepAddonService, PepFileService } from "@pepperi-addons/ngx-lib";
import { PepAddonBlockLoaderService, PepRemoteLoaderOptions, PepRemoteLoaderService } from "@pepperi-addons/ngx-lib/remote-loader";
import {
    ThemeData,
    FONT_SIZES_TYPE,
    FONT_BODY_TYPE,
    FONT_TITLE_TYPE,
    ROUNDNESS_TYPE,
    COLORS_TYPE,
    SPACING_SIZE_TYPE,
    SHADOW_OFFSET_TYPE,
    HslColorData,
    STYLE_TYPE,
} from './plugin.model';
import { ThemesMergedData, THEME_FONT_BODY_FIELD_ID } from 'shared';
import { IPepMenuItemClickEvent, PepMenuItem } from '@pepperi-addons/ngx-lib/menu';
import { MatDialogRef } from '@angular/material/dialog';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { BehaviorSubject, lastValueFrom, Observable } from 'rxjs';
import { stringify } from 'querystring';


export interface IAddonTab {
    title: string;
    theme?: any;
}

@Component({
    selector: 'plugin',
    templateUrl: './plugin.component.html',
    styleUrls: ['./plugin.component.scss'],
    providers: [PluginService]
})
export class PluginComponent implements OnInit, OnDestroy {
    readonly TRANSLATION_PREFIX_KEY = 'Themes_Addon_';

    // Menu
    // -----------------------------------------------
    menuOptions: Array<PepMenuItem> = [];
    @ViewChild('importFile', {static: false}) public importFile: ElementRef;

    // Fonts Tab
    // -----------------------------------------------
    fontHeadingOptions = [];
    fontBodyOptions = [];
    fontSizesOptions = [];

    // Styles Tab
    // -----------------------------------------------
    roundnessOptions = [];

    colorsOptions = [];
    colorsWithLegacyOptions = [];
    buttonStylesOptions = [];

    cardFontGutterOptions = [];
    cardShadowOptions = [];

    // General
    // -----------------------------------------------
    showReset = false;

    LEGACY_STRING = ThemeData.LEGACY_STRING;
    protected pepperiTheme = new ThemeData();

    private _tabsSubject: BehaviorSubject<Map<string, IAddonTab>> = new BehaviorSubject<Map<string, any>>(new Map<string, IAddonTab>());
    get tabs$(): Observable<ReadonlyMap<string, IAddonTab>> {
        return this._tabsSubject.asObservable();
    }

    // For load the tabs
    private _tabsRemoteLoaderOptionsMap = new Map<string, PepRemoteLoaderOptions>();
    get tabsRemoteLoaderOptionsMap(): ReadonlyMap<string, any> {
        return this._tabsRemoteLoaderOptionsMap;
    }

    expansionPanelHeaderHeight = '*';

    // publishComment = '';

    imageUrl = '';
    
    @ViewChild('publishModalTemplate', { read: TemplateRef }) publishModalTemplate: TemplateRef<any>;
    private dialogRef: MatDialogRef<any> = null;

    // Data sent from webapp
    @Input() queryParams: any;
    @Input() routerData: any;
    // Events emitters to webapp
    @Output() addEditors: EventEmitter<any> = new EventEmitter<any>();
    @Output() notify: EventEmitter<any> = new EventEmitter<any>();


    assetsHostObject = {
        selectionType: 'single',
        allowedAssetsTypes: 'images',
        inDialog: true
    }

    constructor(
        private pluginService: PluginService,
        private customizationService: PepCustomizationService,
        private dialogService: PepDialogService,
        private addonService: PepAddonService,
        private fileService: PepFileService,
        private translate: TranslateService,
        private remoteLoaderService: PepRemoteLoaderService,
        private routeParams: ActivatedRoute,
        private router: Router,
        private addonBlockLoaderService: PepAddonBlockLoaderService,
        private viewContainerRef: ViewContainerRef
    ) {
        // Parameters sent from query url (syntax: ?parmeterName1=parameterValue1&parmeterName2=parameterValue2&)
        this.routeParams.queryParams.subscribe((queryParams) => {
            this.showReset = queryParams.showReset;
        });
    }

    private paramsToObject(entries) {
        const result = {}
        for(const [key, value] of entries) { // each 'entry' is a [key, value] tupple
          result[key] = value;
        }
        return result;
    }

    getQueryParamsAsObject(): any {
        const queryParamsAsObject = this.paramsToObject(new URLSearchParams(location.search));
        return queryParamsAsObject;
    }

    initOptions() {
        // TODO:
        // this.fontHeadingOptions = Object.keys(FONT_BODY_TYPE).map((key) => {
        //     return {key: FONT_BODY_TYPE[key], value: FONT_BODY_TYPE[key]};
        // });

        this.fontBodyOptions = Object.keys(FONT_BODY_TYPE).map((key) => {
            return {key: FONT_BODY_TYPE[key], value: FONT_BODY_TYPE[key]};
        });
        
        // const urlParams = this.getQueryParamsAsObject();
        // if (urlParams?.hasOwnProperty('fontBodyOptions')) {
        //     const fontsToAddArray = JSON.parse(urlParams['fontBodyOptions']);
        //     fontsToAddArray.forEach(font => {
        //         this.fontBodyOptions.push({key: font, value: font});
        //     });
        // }
        
        this.fontSizesOptions = Object.keys(FONT_SIZES_TYPE).map((key) => {
            return {key: FONT_SIZES_TYPE[key],
            value: this.translate.instant(this.TRANSLATION_PREFIX_KEY + FONT_SIZES_TYPE[key])};
        });

        this.roundnessOptions = Object.keys(ROUNDNESS_TYPE).map((key) => {
            return {
                key: ROUNDNESS_TYPE[key],
                value: this.translate.instant(this.TRANSLATION_PREFIX_KEY + ROUNDNESS_TYPE[key])};
        });

        this.colorsOptions = Object.keys(COLORS_TYPE).map((key) => {
            return {
                key: COLORS_TYPE[key],
                value: this.translate.instant(this.TRANSLATION_PREFIX_KEY + COLORS_TYPE[key])};
        });
        this.colorsWithLegacyOptions = Object.keys(COLORS_TYPE).map((key) => {
            return {
                key: COLORS_TYPE[key],
                value: this.translate.instant(this.TRANSLATION_PREFIX_KEY + COLORS_TYPE[key])};
        });
        this.colorsWithLegacyOptions.unshift({
            key: ThemeData.LEGACY_STRING,
            value: this.translate.instant(this.TRANSLATION_PREFIX_KEY + ThemeData.LEGACY_STRING),
        });

        this.buttonStylesOptions = Object.keys(STYLE_TYPE).map((key) => {
            return {
                key: key,
                value: this.translate.instant(this.TRANSLATION_PREFIX_KEY + STYLE_TYPE[key])
            };
        });

        this.cardFontGutterOptions = Object.keys(SPACING_SIZE_TYPE).map((key) => {
            return {
                key: SPACING_SIZE_TYPE[key],
                value: this.translate.instant(this.TRANSLATION_PREFIX_KEY + SPACING_SIZE_TYPE[key])};
        });
        this.cardShadowOptions = Object.keys(SHADOW_OFFSET_TYPE).map((key) => {
            return {
                key: SHADOW_OFFSET_TYPE[key],
                value: this.translate.instant(this.TRANSLATION_PREFIX_KEY + SHADOW_OFFSET_TYPE[key])};
        });
    }

    ngOnInit() {
        this.translate.get('Themes_Addon_Title').toPromise().finally(
            async () => {
                this.initOptions();
                this.loadMenu();
                await this.loadPepperiThemeObject(false);
                await this.loadTabsThemeData(false);
                await this.loadThemeVariables();
            }
        )
    }

    ngOnDestroy() {

    }

    loadThemeUI() {
        this.changeWebappVariables();
        const domain = this.addonService.getAddonStaticFolder(this.pluginService.addonUUID);
        // Remove the lib name from the path and use this addon assets path.
        const libName = '[LIB_NAME]';
        this.imageUrl = this.fileService.getAssetsImagesPath(domain, 'boat-ride.webp', libName).replace(`${libName}/`, '');
    }

    setColor(hslColorData: HslColorData, value) {
        const sep = value.indexOf(',') > -1 ? ',' : ' ';
        const hsl = value.substr(4).split(')')[0].split(sep);

        if (!hslColorData) {
            hslColorData = new HslColorData();
        }

        hslColorData.hue = hsl[0];
        hslColorData.saturation = hsl[1].substr(0, hsl[1].length).trim();
        hslColorData.lightness = hsl[2].substr(0, hsl[2].length).trim();
    }

    getColor(hslColorData: HslColorData) {
        if (hslColorData) {
            return 'hsl(' + hslColorData.hue + ', ' + hslColorData.saturation + ', ' + hslColorData.lightness + ')';
        } else {
            return '';
        }
    }

    // initPepperiColorComponent(dynamicColor, colorKey, colorLabelKey, hslColor, type = ColorType.AnyColor, showAAComplient = true) {
    //     dynamicColor.inputs = {
    //         key: colorKey,
    //         label: this.translate.instant(PluginComponent.TRANSLATION_PREFIX_KEY + colorLabelKey),
    //         value: HslColorData.getColor(hslColor),
    //         type,
    //         showAAComplient,
    //     };
    //     dynamicColor.outputs = {
    //         valueChanged: (event: any) => {
    //             HslColorData.setColor(hslColor, event.value);
    //             this.onValueChanged();
    //         },
    //     };
    // }

    // initPepperiSelectComponent(dynamicSelect, selectKey, selectLabelKey, selectValue, selectOptions, selectValueChangedCallback) {
    //     dynamicSelect.inputs = {
    //         key: selectKey,
    //         label: this.translate.instant(selectLabelKey),
    //         value: selectValue,
    //         options: selectOptions,
    //         emptyOption: false,
    //     };
    //     dynamicSelect.outputs = {
    //         valueChanged: (event: any) => {
    //             selectValueChangedCallback(event.value);
    //             this.onValueChanged();
    //         },
    //     };
    // }

    loadColorsComponents() {
        // User primary
        // this.initPepperiColorComponent(this.pepperiPrimaryColor, PluginComponent.COLOR_USER_PRIMARY_KEY,
        //  'EditPrimaryColor_Title', this.themeObj.userPrimaryColor);

        // User secondary
        // this.initPepperiColorComponent(this.pepperiSecondaryColor, PluginComponent.COLOR_USER_SECONDARY_KEY,
        //  'EditSecondaryColor_Title', this.themeObj.userSecondaryColor);

        // System primary
        // this.initPepperiColorComponent(
        //     this.pepperiMainColor,
        //     PluginComponent.COLOR_SYSTEM_PRIMARY_KEY,
        //     'EditMainColor_Title',
        //     this.themeObj.systemPrimaryColor,
        //     ColorType.MainColor,
        //     false
        // );

        // System link
        // this.initPepperiColorComponent(this.pepperiLinkColor, PluginComponent.COLOR_SYSTEM_LINK_KEY,
        //     'EditLinkColor_Title', this.themeObj.systemLinkColor);

        // System caution
        // this.initPepperiColorComponent(
        //     this.pepperiCautionColor,
        //     PluginComponent.COLOR_SYSTEM_CAUTION_KEY,
        //     'EditCautionColor_Title',
        //     this.themeObj.systemCautionColor,
        //     ColorType.CautionColor
        // );

        // System success
        // this.initPepperiColorComponent(
        //     this.pepperiSuccessColor,
        //     PluginComponent.COLOR_SYSTEM_SUCCESS_KEY,
        //     'EditSuccessColor_Title',
        //     this.themeObj.systemSuccessColor,
        //     ColorType.SuccessColor
        // );
    }

    onUseSecondaryColorClick(event) {
        this.pepperiTheme.useSecondaryColor = !this.pepperiTheme.useSecondaryColor;
        this.onValueChanged();
        event.stopPropagation();
        return false;
    }

    changeWebappVariables() {
        const themeVariables = this.convertToCssVariables(this.pepperiTheme);
        this.customizationService.setThemeVariables(themeVariables);
    }

    convertToCssVariables(themeObj) {
        const themeVariables = {};

        // Convert colors.
        this.convertColorsToWebappVariables(themeObj, themeVariables);

        // Convert fonts.
        this.convertFontsToWebappVariables(themeObj, themeVariables);

        // Convert styles.
        this.convertStylesToWebappVariables(themeObj, themeVariables);

        // Convert assign.
        this.convertAssignToWebappVariables(themeObj, themeVariables);

        return themeVariables;
    }

    convertColorsToWebappVariables(themeObj, themeVariables) {
        this.convertColorToWebappVariables(themeVariables, PepCustomizationService.COLOR_USER_PRIMARY_KEY,
            themeObj.userPrimaryColor);
        this.convertColorToWebappVariables(
            themeVariables,
            PepCustomizationService.COLOR_USER_SECONDARY_KEY,
            themeObj.useSecondaryColor ? themeObj.userSecondaryColor : themeObj.userPrimaryColor
        );
        this.convertColorToWebappVariables(themeVariables, PepCustomizationService.COLOR_SYSTEM_PRIMARY_KEY,
            themeObj.systemPrimaryColor);
        this.convertColorToWebappVariables(themeVariables, PepCustomizationService.COLOR_TEXT_LINK_KEY,
            themeObj.systemLinkColor);
        this.convertColorToWebappVariables(themeVariables, PepCustomizationService.COLOR_SYSTEM_CAUTION_KEY,
            themeObj.systemCautionColor);
        this.convertColorToWebappVariables(themeVariables, PepCustomizationService.COLOR_SYSTEM_SUCCESS_KEY,
            themeObj.systemSuccessColor);
    }

    convertColorToWebappVariables(themeVariables, colorKey, colorObj: HslColorData) {
        themeVariables[colorKey + '-h'] = colorObj.hue;
        themeVariables[colorKey + '-s'] = colorObj.saturation;
        themeVariables[colorKey + '-l'] = colorObj.lightness;
    }

    convertFontsToWebappVariables(themeObj, themeVariables) {
        themeVariables[PepCustomizationService.FONT_FAMILY_TITLE_KEY] = themeObj.headingFont;
        themeVariables[PepCustomizationService.FONT_FAMILY_BODY_KEY] = themeObj.bodyFont;

        this.setFontSizes(themeVariables, themeObj.fontSizes);
    }

    setFontSizes(themeVariables, wantedSize) {
        // For now we removed this options and the default for all is medium by Yonatan.B-K request.
        // if (wantedSize === FONT_SIZES_TYPE.Small) {
        //     themeVariables[PepCustomizationService.FONT_SIZE_2XS_KEY] = '0.325' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.FONT_SIZE_XS_KEY] = '0.55' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.FONT_SIZE_SM_KEY] = '0.675' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.FONT_SIZE_MD_KEY] = '0.8' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.FONT_SIZE_LG_KEY] = '0.925' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.FONT_SIZE_XL_KEY] = '1.05' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.FONT_SIZE_2XL_KEY] = '1.3' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.LINE_HEIGHT_2XS_KEY] = '0.45' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.LINE_HEIGHT_XS_KEY] = '0.8' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.LINE_HEIGHT_SM_KEY] = '1.05' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.LINE_HEIGHT_MD_KEY] = '1.3' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.LINE_HEIGHT_LG_KEY] = '1.55' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.LINE_HEIGHT_XL_KEY] = '1.8' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.LINE_HEIGHT_2XL_KEY] = '2.05' + PepCustomizationService.REM_STRING;
        // } else if (wantedSize === FONT_SIZES_TYPE.Medium) {
            themeVariables[PepCustomizationService.FONT_SIZE_2XS_KEY] = '0.625' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.FONT_SIZE_XS_KEY] = '0.75' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.FONT_SIZE_SM_KEY] = '0.875' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.FONT_SIZE_MD_KEY] = '1' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.FONT_SIZE_LG_KEY] = '1.125' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.FONT_SIZE_XL_KEY] = '1.25' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.FONT_SIZE_2XL_KEY] = '1.5' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.LINE_HEIGHT_2XS_KEY] = '0.75' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.LINE_HEIGHT_XS_KEY] = '1' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.LINE_HEIGHT_SM_KEY] = '1.25' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.LINE_HEIGHT_MD_KEY] = '1.5' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.LINE_HEIGHT_LG_KEY] = '1.75' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.LINE_HEIGHT_XL_KEY] = '2' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.LINE_HEIGHT_2XL_KEY] = '2.25' + PepCustomizationService.REM_STRING;
        // } else if (wantedSize === FONT_SIZES_TYPE.Large) {
        //     themeVariables[PepCustomizationService.FONT_SIZE_2XS_KEY] = '0.925' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.FONT_SIZE_XS_KEY] = '0.95' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.FONT_SIZE_SM_KEY] = '1.075' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.FONT_SIZE_MD_KEY] = '1.2' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.FONT_SIZE_LG_KEY] = '1.325' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.FONT_SIZE_XL_KEY] = '1.45' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.FONT_SIZE_2XL_KEY] = '1.7' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.LINE_HEIGHT_2XS_KEY] = '0.875' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.LINE_HEIGHT_XS_KEY] = '1.2' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.LINE_HEIGHT_SM_KEY] = '1.45' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.LINE_HEIGHT_MD_KEY] = '1.7' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.LINE_HEIGHT_LG_KEY] = '1.95' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.LINE_HEIGHT_XL_KEY] = '2.2' + PepCustomizationService.REM_STRING;
        //     themeVariables[PepCustomizationService.LINE_HEIGHT_2XL_KEY] = '2.45' + PepCustomizationService.REM_STRING;
        // }
    }

    convertStylesToWebappVariables(themeObj, themeVariables) {
        this.setRoundnessSizes(themeVariables, themeObj.roundnessSizes);
    }

    setRoundnessSizes(themeVariables, wantedSize) {
        if (wantedSize === ROUNDNESS_TYPE.None) {
            themeVariables[PepCustomizationService.BORDER_RADIUS_SM_KEY] = '0' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.BORDER_RADIUS_MD_KEY] = '0' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.BORDER_RADIUS_LG_KEY] = '0' + PepCustomizationService.REM_STRING;
        } else if (wantedSize === ROUNDNESS_TYPE.Slight) {
            themeVariables[PepCustomizationService.BORDER_RADIUS_SM_KEY] = '0.0625' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.BORDER_RADIUS_MD_KEY] = '0.125' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.BORDER_RADIUS_LG_KEY] = '0.25' + PepCustomizationService.REM_STRING;
        } else if (wantedSize === ROUNDNESS_TYPE.Regular) {
            themeVariables[PepCustomizationService.BORDER_RADIUS_SM_KEY] = '0.125' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.BORDER_RADIUS_MD_KEY] = '0.25' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.BORDER_RADIUS_LG_KEY] = '0.5' + PepCustomizationService.REM_STRING;
        } else if (wantedSize === ROUNDNESS_TYPE.Maximal) {
            themeVariables[PepCustomizationService.BORDER_RADIUS_SM_KEY] = '0.25' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.BORDER_RADIUS_MD_KEY] = '0.5' + PepCustomizationService.REM_STRING;
            themeVariables[PepCustomizationService.BORDER_RADIUS_LG_KEY] = '0.75' + PepCustomizationService.REM_STRING;
        }
    }

    convertAssignToWebappVariables(themeObj, themeVariables) {
        this.setStyleButtonColor(themeVariables, PepCustomizationService.COLOR_STRONG_KEY,
            themeObj.strongButtonColor, themeObj.useSecondaryColor);
        this.setStyleButtonColor(themeVariables, PepCustomizationService.COLOR_REGULAR_KEY,
            themeObj.weakButtonColor, themeObj.useSecondaryColor);
        this.setStyleButtonColor(themeVariables, PepCustomizationService.COLOR_WEAK_KEY,
            themeObj.weakButtonColor, themeObj.useSecondaryColor);

        // Legacy code (this is now implemented in application header addon).
        if (this.pepperiTheme.useTopHeaderColorLegacy) {
            themeVariables[PepCustomizationService.COLOR_TOP_HEADER_KEY + '-h'] = '';
            themeVariables[PepCustomizationService.COLOR_TOP_HEADER_KEY + '-s'] = '';
            themeVariables[PepCustomizationService.COLOR_TOP_HEADER_KEY + '-l'] = '';
        } else {
            this.setStyleButtonColor(themeVariables, PepCustomizationService.COLOR_TOP_HEADER_KEY,
                themeObj.topHeaderColor, themeObj.useSecondaryColor);
        }
        themeVariables[PepCustomizationService.STYLE_TOP_HEADER_KEY] = themeObj.topHeaderStyle;
        // Legacy end here.
        
        this.setStyleButtonColor(themeVariables, PepCustomizationService.COLOR_QS_KEY,
            themeObj.qsButtonColor, themeObj.useSecondaryColor);
        themeVariables[PepCustomizationService.STYLE_QS_KEY] = themeObj.qsButtonStyle;

        // themeVariables[PepCustomizationService.CARD_FONT_SIZE_KEY] = themeObj.cardFontSize;
        this.setSpacing(themeVariables, themeObj.cardGutterSize);
        this.setShadow(themeVariables, themeObj.cardShadow);
    }

    setStyleButtonColor(themeVariables, colorKey, wantedColor, useSecondaryColor) {
        let referenceColorKey = PepCustomizationService.COLOR_SYSTEM_PRIMARY_KEY;

        if (wantedColor === COLORS_TYPE.SystemPrimary) {
            referenceColorKey = PepCustomizationService.COLOR_SYSTEM_PRIMARY_KEY;
        } else if (wantedColor === COLORS_TYPE.SystemPrimaryInvert) {
            referenceColorKey = PepCustomizationService.COLOR_SYSTEM_PRIMARY_INVERT_KEY;
        } else if (wantedColor === COLORS_TYPE.UserPrimary) {
            referenceColorKey = PepCustomizationService.COLOR_USER_PRIMARY_KEY;
        } else if (wantedColor === COLORS_TYPE.UserSecondary) {
            referenceColorKey = useSecondaryColor ?
                PepCustomizationService.COLOR_USER_SECONDARY_KEY :
                PepCustomizationService.COLOR_USER_PRIMARY_KEY;
        }

        themeVariables[colorKey + '-h'] = 'var(' + referenceColorKey + '-h)';
        themeVariables[colorKey + '-s'] = 'var(' + referenceColorKey + '-s)';
        themeVariables[colorKey + '-l'] = 'var(' + referenceColorKey + '-l)';
    }

    setSpacing(themeVariables, wantedSpacing) {
        let referenceSpacingKey = PepCustomizationService.SPACING_SIZE_XS_KEY;

        if (wantedSpacing === SPACING_SIZE_TYPE.Smaller) {
            referenceSpacingKey = PepCustomizationService.SPACING_SIZE_2XS_KEY;
        } else if (wantedSpacing === SPACING_SIZE_TYPE.Small) {
            referenceSpacingKey = PepCustomizationService.SPACING_SIZE_XS_KEY;
        } else if (wantedSpacing === SPACING_SIZE_TYPE.Regular) {
            referenceSpacingKey = PepCustomizationService.SPACING_SIZE_SM_KEY;
        }
        // else if (wantedSpacing === SPACING_SIZE_TYPE.Big) {
        //     referenceSpacingKey = PepCustomizationService.SPACING_SIZE_MD_KEY;
        // } else if (wantedSpacing === SPACING_SIZE_TYPE.Bigger) {
        //     referenceSpacingKey = PepCustomizationService.SPACING_SIZE_LG_KEY;
        // }

        themeVariables[PepCustomizationService.CARD_SPACEING_KEY] = 'var(' + referenceSpacingKey + ')';
    }

    setShadow(themeVariables, wantedShadow) {
        let referenceShadowKey = PepCustomizationService.SHADOW_MD_OFFSET_KEY;

        if (wantedShadow === SHADOW_OFFSET_TYPE.None) {
            referenceShadowKey = PepCustomizationService.SHADOW_NONE_OFFSET_KEY;
        } else if (wantedShadow === SHADOW_OFFSET_TYPE.XS) {
            referenceShadowKey = PepCustomizationService.SHADOW_XS_OFFSET_KEY;
        } else if (wantedShadow === SHADOW_OFFSET_TYPE.Small) {
            referenceShadowKey = PepCustomizationService.SHADOW_SM_OFFSET_KEY;
        } else if (wantedShadow === SHADOW_OFFSET_TYPE.Medium) {
            referenceShadowKey = PepCustomizationService.SHADOW_MD_OFFSET_KEY;
        }
        // else if (wantedShadow === SHADOW_OFFSET_TYPE.Large) {
        //     referenceShadowKey = PepCustomizationService.SHADOW_LG_OFFSET_KEY;
        // } else if (wantedShadow === SHADOW_OFFSET_TYPE.XL) {
        //     referenceShadowKey = PepCustomizationService.SHADOW_XL_OFFSET_KEY;
        // }

        themeVariables[PepCustomizationService.CARD_SHADOW_OFFSET_KEY] = 'var(' + referenceShadowKey + ')';
    }

    tabClick($event) {
        // Implement: Tab navigate function
    }

    async onValueChanged() {
        await lastValueFrom(this.pluginService.savePepperiTheme(this.pepperiTheme));
        this.changeWebappVariables();
    }

    async onAddonThemeValueChange(event: { tabKey: string, theme: any }) {
        const tabKey = event.tabKey;
        const theme = event.theme;

        // Save the current addon theme.
        const res = await lastValueFrom(this.pluginService.saveAddonTheme(tabKey, theme));

        // Update the map to be updated.
        const currentTab = this._tabsSubject.value.get(tabKey);
        currentTab.theme = theme;
        this._tabsSubject.value.set(tabKey, currentTab);
    }

    loadMenu() {
        this.menuOptions = [
            { key: 'Import', text: this.translate.instant(this.TRANSLATION_PREFIX_KEY + 'Import')},
            { key: 'Export', text: this.translate.instant(this.TRANSLATION_PREFIX_KEY + 'Export')},
        ];
    }

    onMenuItemClicked(event: IPepMenuItemClickEvent) {
        if (event.source.key === 'Import') {
            this.importFile.nativeElement.click();
        } else if (event.source.key === 'Export') {
            this.exportToJsonFile();
        }
    }

    readFile(file: File) {
        return new Promise((resolve) => {
            const fr = new FileReader();
            fr.onload = (e) => {
                resolve(e.target.result);
            };
            fr.readAsText(file);
        });
    }

    importFromJsonFile(files: FileList) {
        if (files.length > 0) {
            this.readFile(files[0]).then(async (content: string) => {
                try {
                    // Init the input file value.
                    this.importFile.nativeElement.value = '';

                    // Check for validation if needed.
                    this.pepperiTheme = JSON.parse(content);
                    await lastValueFrom(this.pluginService.savePepperiTheme(this.pepperiTheme));
                    this.loadThemeUI();
                } catch (ex) {
                    // alert('ex when trying to parse json = ' + ex);
                }
            });
        }
    }

    exportToJsonFile() {
        const dataStr = JSON.stringify(this.pepperiTheme);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = 'theme.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    async loadPepperiThemeObject(publishedObject: boolean) {
        // Get pepperi theme
        this.pepperiTheme = await lastValueFrom(this.pluginService.getPepperiTheme(publishedObject));

        if (!this.pepperiTheme) {
            this.pepperiTheme = new ThemeData();
        }

        // Set the default values for the logo's if needed.
        // if (!this.pepperiTheme.hasOwnProperty('logoSrc')) {
        //     this.pepperiTheme.logoSrc = '/assets/images/Pepperi-Logo-HiRes.png';
        // }
        // if (!this.pepperiTheme.hasOwnProperty('faviconSrc')) {
        //     this.pepperiTheme.faviconSrc = '/assets/favicon.ico';
        // }

        this.loadThemeUI();
    }

    async loadThemeVariables() {
        const settings = await lastValueFrom(this.pluginService.getPepperiThemeVariables());

        // Load all the fonts body from settings.
        if (settings?.hasOwnProperty(THEME_FONT_BODY_FIELD_ID)) {
            const fontsToAddArray = settings[THEME_FONT_BODY_FIELD_ID].split(';');
            fontsToAddArray.forEach(font => {
                if (this.pepperiTheme?.bodyFont !== font && !this.fontBodyOptions.some(font => font.key === font)) {
                    this.fontBodyOptions.push({key: font, value: font});
                }
            });
        }
        
    }

    private getRemoteEntryByType(remoteBasePath: string, relation: NgComponentRelation) {
        // For devTabs gets the remote entry from the query params.
        const devTabs = this.pluginService.devTabs;
        if (devTabs.has(relation.ModuleName)) {
            return devTabs.get(relation.ModuleName);
        } else if (devTabs.has(relation.ComponentName)) {
            return devTabs.get(relation.ComponentName);
        } else {
            return `${remoteBasePath}${relation.AddonRelativeURL}.js`;
        }
    }

    private getRemoteLoaderOptions(data: any) {
        const remoteEntry = this.getRemoteEntryByType(data.addonPublicBaseURL, data.relation);
        const remoteLoaderOptions = this.remoteLoaderService.getRemoteLoaderOptions({
            relation: data.relation,
            addonPublicBaseURL: data.addonPublicBaseURL
        }, remoteEntry);

        return remoteLoaderOptions;
    }

    async loadTabsThemeData(publishedObject: boolean) {
        // Get the rest tabs (addons themes).
        const availableTabs = await lastValueFrom(this.pluginService.getAddonsThemes(publishedObject));
        const tabs = new Map<string, IAddonTab>();
        this._tabsRemoteLoaderOptionsMap.clear();

        for (let index = 0; index < availableTabs.length; index++) {
            const availableTab = availableTabs[index];
            
            const relation: NgComponentRelation = availableTab?.relation;
            const addonPublicBaseURL = availableTab?.addonPublicBaseURL;

            if (relation && addonPublicBaseURL) {
                this._tabsRemoteLoaderOptionsMap.set(availableTab.key, this.getRemoteLoaderOptions(availableTab));
                
                // Set the tabs (themes map)
                tabs.set(availableTab.key, {
                    title: relation.Description || relation.Name,
                    theme: availableTab.theme
                });
            }
        }

        // Set the subject for update all the lisiners (tabs)
        this._tabsSubject.next(tabs);
    }

    async resetPlugin() {
        // Reset all saved UI data
        await this.loadPepperiThemeObject(true);
        await lastValueFrom(this.pluginService.savePepperiTheme(this.pepperiTheme));
        
        await this.loadTabsThemeData(true);

        // Reset all the tabs that has changes to the value before the changes. (for all addons array)
        this._tabsSubject.value.forEach(async (value: IAddonTab, key: string) => {
            const theme = value.theme || null;
            await lastValueFrom(this.pluginService.saveAddonTheme(key, theme));
        });
    }

    raisePublishCommentDialog() {
        this.dialogRef = this.dialogService.openDialog(this.publishModalTemplate);
        
        // TODO:
        // const data = new DialogData();
        
        // const boundPublishThemeCallback = this.publishTheme.bind(this);
        // const publishButton = {
        //     title: this.translate.instant(this.TRANSLATION_PREFIX_KEY + 'Publish'),
        //     callback: boundPublishThemeCallback,
        //     className: 'pepperi-button md strong',
        // };

        // data.title = this.translate.instant(PluginComponent.TRANSLATION_PREFIX_KEY + 'PublishDialog_Title');
        // data.contentType = DialogDataType.TextArea;
        // data.actionButtons = [publishButton];
        // data.contentData = {
        //     key: 'publishComment',
        //     value: '',
        // };

        // this.addonService.openDialog(data, 'pepperi-modalbox', '16rem', '0', '100vw', '100vh');
    }
    
    async publishTheme(comment: string) {
        const tabsData: Array<any> = [];
        // Publish the saved object.
        const pepperiTheme = new ThemesMergedData();

        pepperiTheme.theme = this.pepperiTheme;
        pepperiTheme.cssVariables = this.convertToCssVariables(this.pepperiTheme);

        // *********************************************************************
        //      Convert to other Properties (not css variables) - START
        // *********************************************************************

        // Convert legacy colors.
        pepperiTheme.header = {
            useTopHeaderColorLegacy: this.pepperiTheme.useTopHeaderColorLegacy,
            userLegacyColor: this.pepperiTheme.userLegacyColor,
            topHeaderColor: this.pepperiTheme.topHeaderColor,
            topHeaderStyle: this.pepperiTheme.topHeaderStyle,
        }

        // Convert branding.
        pepperiTheme.branding = {
            logoAssetKey: this.pepperiTheme.logoAsset?.key,
            faviconAssetKey: this.pepperiTheme.faviconAsset?.key
        }
        
        // *********************************************************************
        //      Convert to other Properties (not css variables) - END
        // *********************************************************************

        tabsData.push(pepperiTheme);

        // Publish also for all the other themes that exist in the tabs.
        this._tabsSubject.value.forEach(async (value: IAddonTab, key: string) => {
            if (value.theme) {
                const addonTheme = {
                    key: key,
                    theme: value.theme
                };

                tabsData.push(addonTheme);
            }
        });

        await lastValueFrom(this.pluginService.publishThemes(tabsData, comment));

        this.dialogRef.close();
    }

    onOpenAssetsDialog(propName: string) {
        // delete this.pepperiTheme[propName];
        // this.onValueChanged();
        const dialogRef = this.addonBlockLoaderService.loadAddonBlockInDialog({
            container: this.viewContainerRef,
            name: 'AssetPicker',
            hostObject: this.assetsHostObject,
            hostEventsCallback: (event) => { this.onAssetsHostEventChange(propName, event, dialogRef); }
        });
    }

    private onAssetsHostEventChange(propName: string, event: any, dialogRef) {
        if (event.action === 'on-save') {
            this.pepperiTheme[propName] = event ? { key: event.key, url: event.url } : null;
    
            if (dialogRef) {
                dialogRef.close(null);
            }
    
            this.onValueChanged();
        }
        else if (event.action === 'on-cancel') {
            if (dialogRef) {
                dialogRef.close(null);
            }
        }
    }

    async onDeleteAsset(propName: string) {
        this.pepperiTheme[propName] = '';
        await this.onValueChanged();
    }
}
