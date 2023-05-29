import {PepStyleType} from '@pepperi-addons/ngx-lib';

export class PluginModel {}

export enum FONT_SIZES_TYPE {
    Small = 'FontSize_Small',
    Medium = 'FontSize_Medium',
    Large = 'FontSize_Large',
}

export enum FONT_BODY_TYPE {
    'Inter' = 'Inter',
    'Assistant' = 'Assistant',
    'Work Sans' = 'Work Sans',
    'Heebo' = 'Heebo',
    'Rubik' = 'Rubik',
    'Crimson Pro' = 'Crimson Pro',
    'EB Garamond' = 'EB Garamond',
    'David Libre' = 'David Libre',
}

export enum FONT_TITLE_TYPE {
    'Nexa' = 'Nexa',
    'Lobster' = 'Lobster',
    'Abril Fatface' = 'Abril Fatface',
    'Shrikhand' = 'Shrikhand',
    'Knewave' = 'Knewave',
    'Inknut Antiqua' = 'Inknut Antiqua',
}

export enum ROUNDNESS_TYPE {
    None = 'Roundness_None',
    Slight = 'Roundness_Slight',
    Regular = 'Roundness_Regular',
    Maximal = 'Roundness_Maximal',
}

export enum COLORS_TYPE {
    SystemPrimary = 'ColorType_SystemPrimary',
    UserPrimary = 'ColorType_UserPrimary',
    UserSecondary = 'ColorType_UserSecondary',
}

export enum STYLE_TYPE {
    weak = 'StyleType_Weak',
    regular = 'StyleType_Regular',
    strong = 'StyleType_Strong',
}

export enum SPACING_SIZE_TYPE {
    Smaller = 'SpacingSize_Smaller',
    Small = 'SpacingSize_Small',
    Regular = 'SpacingSize_Regular',
    // Big = 'SpacingSize_Big',
    // Bigger = 'SpacingSize_Bigger',
}

export enum SHADOW_OFFSET_TYPE {
    None = 'ShadowOffset_None',
    XS = 'ShadowOffset_XS',
    Small = 'ShadowOffset_Small',
    Medium = 'ShadowOffset_Medium',
    // Large = 'ShadowOffset_Large',
    // XL = 'ShadowOffset_XL',
}

export class HslColorData {
    hue: string;
    saturation: string;
    lightness: string;

    constructor(h = '100', s = '50%', l = '50%') {
        this.hue = h;
        this.saturation = s;
        this.lightness = l;
    }
}

export class ThemeData {
    static LEGACY_STRING = 'Legacy';

    // Colors
    userPrimaryColor = new HslColorData('78', '87%', '27%');
    userSecondaryColor = new HslColorData('77', '87%', '42%');
    useSecondaryColor = true;

    systemPrimaryColor = new HslColorData('0', '0%', '10%');
    systemLinkColor = new HslColorData('207', '76%', '37%');
    systemCautionColor = new HslColorData('360', '100%', '40%');
    systemSuccessColor = new HslColorData('100', '100%', '25%');

    // Fonts
    headingFont = FONT_TITLE_TYPE.Nexa;
    bodyFont = FONT_BODY_TYPE.Inter;
    fontSizes = FONT_SIZES_TYPE.Medium;

    // Styles
    roundnessSizes = ROUNDNESS_TYPE.Regular;

    // Assign
    strongButtonColor = COLORS_TYPE.UserPrimary;
    weakButtonColor = COLORS_TYPE.SystemPrimary;

    // Legacy properties (this is now implemented in application header addon).
    // useTopHeaderColorLegacy = true;
    // topHeaderColor = ThemeData.LEGACY_STRING;
    // topHeaderStyle: PepStyleType = 'strong';

    qsButtonColor = COLORS_TYPE.SystemPrimary;
    qsButtonStyle: PepStyleType = 'regular';

    // cardFontSize;
    cardGutterSize = SPACING_SIZE_TYPE.Small;
    cardShadow = SHADOW_OFFSET_TYPE.Medium;

    brandingLogoSrc = '/assets/images/Pepperi-Logo-HiRes.png';
    faviconSrc = '/assets/favicon.ico';
}

export class ThemesMergedData {
    key?: string = '';
    theme: any = null;
    cssVariables?: any = null;
}
