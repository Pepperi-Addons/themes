import {Component, ViewEncapsulation, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChild, ElementRef, TemplateRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {PluginService} from './plugin.service';
import {TranslateService} from '@ngx-translate/core';

import { PepCustomizationService, PepLayoutType, PepStyleType, PepAddonService, PepFileService} from "@pepperi-addons/ngx-lib";
import {
    ThemesMergedData,
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
import { IPepMenuItemClickEvent, PepMenuItem } from '@pepperi-addons/ngx-lib/menu';

import { config } from './../addon.config';
import { MatDialogRef } from '@angular/material/dialog';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';

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
    themeObj = new ThemeData();

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

    constructor(
        private pluginService: PluginService,
        private customizationService: PepCustomizationService,
        private dialogService: PepDialogService,
        private addonService: PepAddonService,
        private fileService: PepFileService,
        private translate: TranslateService,
        private routeParams: ActivatedRoute,
        private router: Router
    ) {

        // Parameters sent from url
        // this.routeParams.params.subscribe((params) => {
        //     this.pluginService.addonUUID = params.pluginID;
        // });
        this.pluginService.addonUUID = config.AddonUUID;

        // Parameters sent from query url (syntax: ?parmeterName1=parameterValue1&parmeterName2=parameterValue2&)
        this.routeParams.queryParams.subscribe((queryParams) => {
            this.showReset = queryParams.showReset;
        });
    }

    initOptions() {
        // TODO:
        // this.fontHeadingOptions = Object.keys(FONT_BODY_TYPE).map((key) => {
        //     return {key: FONT_BODY_TYPE[key], value: FONT_BODY_TYPE[key]};
        // });

        this.fontBodyOptions = Object.keys(FONT_BODY_TYPE).map((key) => {
            return {key: FONT_BODY_TYPE[key], value: FONT_BODY_TYPE[key]};
        });

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
            () => {
                this.initOptions();
                this.loadMenu();
                this.loadThemeObject(false);
            }
        )
    }

    ngOnDestroy() {

    }

    loadThemeUI() {
        this.changeWebappVariables();
        const domain = this.addonService.getAddonStaticFolder(this.pluginService.addonUUID);
        this.imageUrl = this.fileService.getAssetsImagesPath(domain, 'sail-away.jpg');
    }

    setColor(hslColorData: HslColorData, value) {
        const sep = value.indexOf(',') > -1 ? ',' : ' ';
        const hsl = value.substr(4).split(')')[0].split(sep);

        hslColorData.hue = hsl[0];
        hslColorData.saturation = hsl[1].substr(0, hsl[1].length).trim();
        hslColorData.lightness = hsl[2].substr(0, hsl[2].length).trim();
    }

    getColor(hslColorData: HslColorData) {
        return 'hsl(' + hslColorData.hue + ', ' + hslColorData.saturation + ', ' + hslColorData.lightness + ')';
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
        this.themeObj.useSecondaryColor = !this.themeObj.useSecondaryColor;
        this.onValueChanged();
        event.stopPropagation();
        return false;
    }

    changeWebappVariables() {
        const themeVariables = this.convertToCssVariables(this.themeObj);
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

        if (this.themeObj.useTopHeaderColorLegacy) {
            themeVariables[PepCustomizationService.COLOR_TOP_HEADER_KEY + '-h'] = '';
            themeVariables[PepCustomizationService.COLOR_TOP_HEADER_KEY + '-s'] = '';
            themeVariables[PepCustomizationService.COLOR_TOP_HEADER_KEY + '-l'] = '';
        } else {
            this.setStyleButtonColor(themeVariables, PepCustomizationService.COLOR_TOP_HEADER_KEY,
                themeObj.topHeaderColor, themeObj.useSecondaryColor);
        }
        themeVariables[PepCustomizationService.STYLE_TOP_HEADER_KEY] = themeObj.topHeaderStyle;

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

    onValueChanged() {
        this.saveThemeObject((res) => {
            this.changeWebappVariables();
        });
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
        const self = this;

        if (files.length > 0) {
            this.readFile(files[0]).then((content: string) => {
                try {
                    // Init the input file value.
                    self.importFile.nativeElement.value = '';

                    // Check for validation if needed.
                    self.themeObj = JSON.parse(content);
                    self.saveThemeObject((res) => {
                        self.loadThemeUI();
                    });
                } catch (ex) {
                    // alert('ex when trying to parse json = ' + ex);
                }
            });
        }
    }

    exportToJsonFile() {
        const dataStr = JSON.stringify(this.themeObj);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = 'theme.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    loadThemeObject(publishedObject, successCallback = null, errorCallback = null) {
        const self = this;

        this.pluginService.getAdditionalData(
            (res: ThemesMergedData) => {
                self.themeObj = publishedObject ? res.publishedThemeObj : res.unPublishedThemeObj;

                if (!self.themeObj) {
                    self.loadDefaultThemeData();
                }

                self.loadThemeUI();

                if (successCallback) {
                    successCallback(res);
                }
            },
            (error) => {
                if (errorCallback) {
                    errorCallback(error);
                }
            }
        );
    }

    loadDefaultThemeData() {
        this.themeObj = new ThemeData();
    }

    resetPlugin() {
        // Reset all saved UI data
        this.loadThemeObject(true, (res) => {
            this.saveThemeObject();
        });
    }

    raisePublishCommentDialog() {
        const boundPublishThemeCallback = this.publishTheme.bind(this);
        const publishButton = {
            title: this.translate.instant(this.TRANSLATION_PREFIX_KEY + 'Publish'),
            callback: boundPublishThemeCallback,
            className: 'pepperi-button md strong',
        };

        this.dialogRef = this.dialogService.openDialog(this.publishModalTemplate);

        // TODO:
        // const data = new DialogData();

        // data.title = this.translate.instant(PluginComponent.TRANSLATION_PREFIX_KEY + 'PublishDialog_Title');
        // data.contentType = DialogDataType.TextArea;
        // data.actionButtons = [publishButton];
        // data.contentData = {
        //     key: 'publishComment',
        //     value: '',
        // };

        // this.addonService.openDialog(data, 'pepperi-modalbox', '16rem', '0', '100vw', '100vh');
    }
    
    saveThemeObject(successCallback = null, errorCallback = null) {
        this.pluginService.saveTheme(
            this.themeObj,
            (res) => {
                if (successCallback) {
                    successCallback(res);
                }
            },
            (error) => {
                if (errorCallback) {
                    errorCallback(error);
                }
            }
        );
    }

    publishTheme(comment: string) {
        // Publish the saved object.
        const additionalData = new ThemesMergedData();

        additionalData.unPublishedThemeObj = this.themeObj;
        additionalData.publishedThemeObj = this.themeObj;
        additionalData.publishedComment = comment;
        additionalData.cssVariables = this.convertToCssVariables(this.themeObj);

        this.pluginService.publishTheme(
            additionalData,
            (res) => {
                // this.publishComment = '';
            },
            (error) => {}
        );

        this.dialogRef.close();
    }
}
