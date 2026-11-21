/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Hct } from '../hct/hct.js';
import * as math from '../utils/math_utils.js';
import { clampDouble } from '../utils/math_utils.js';
import { ColorSpecDelegateImpl2025 } from './color_spec_2025.js';
import { ContrastCurve } from './contrast_curve.js';
import { DynamicColor, extendSpecVersion } from './dynamic_color';
import { ToneDeltaPair } from './tone_delta_pair.js';
import { Variant } from './variant.js';
/**
 * Returns the maximum tone for a given chroma in the palette.
 *
 * @param palette The tonal palette to use.
 * @param lowerBound The lower bound of the tone.
 * @param upperBound The upper bound of the tone.
 */
function tMaxC(palette, lowerBound = 0, upperBound = 100, chromaMultiplier = 1) {
    let answer = findBestToneForChroma(palette.hue, palette.chroma * chromaMultiplier, 100, true);
    return math.clampDouble(lowerBound, upperBound, answer);
}
/**
 * Returns the minimum tone for a given chroma in the palette.
 *
 * @param palette The tonal palette to use.
 * @param lowerBound The lower bound of the tone.
 * @param upperBound The upper bound of the tone.
 */
function tMinC(palette, lowerBound = 0, upperBound = 100) {
    let answer = findBestToneForChroma(palette.hue, palette.chroma, 0, false);
    return math.clampDouble(lowerBound, upperBound, answer);
}
/**
 * Searches for the best tone with a given chroma from a given tone at a
 * specific hue.
 *
 * @param hue The given hue.
 * @param chroma The target chroma.
 * @param tone The tone to start with.
 * @param byDecreasingTone Whether to search for lower tones.
 */
function findBestToneForChroma(hue, chroma, tone, byDecreasingTone) {
    let answer = tone;
    let bestCandidate = Hct.from(hue, chroma, answer);
    while (bestCandidate.chroma < chroma) {
        if (tone < 0 || tone > 100) {
            break;
        }
        tone += byDecreasingTone ? -1.0 : 1.0;
        const newCandidate = Hct.from(hue, chroma, tone);
        if (bestCandidate.chroma < newCandidate.chroma) {
            bestCandidate = newCandidate;
            answer = tone;
        }
    }
    return answer;
}
/**
 * Returns the contrast curve for a given default contrast.
 *
 * @param defaultContrast The default contrast to use.
 */
function getCurve(defaultContrast) {
    if (defaultContrast === 1.5) {
        return new ContrastCurve(1.5, 1.5, 3, 5.5);
    }
    else if (defaultContrast === 3) {
        return new ContrastCurve(3, 3, 4.5, 7);
    }
    else if (defaultContrast === 4.5) {
        return new ContrastCurve(4.5, 4.5, 7, 11);
    }
    else if (defaultContrast === 6) {
        return new ContrastCurve(6, 6, 7, 11);
    }
    else if (defaultContrast === 7) {
        return new ContrastCurve(7, 7, 11, 21);
    }
    else if (defaultContrast === 9) {
        return new ContrastCurve(9, 9, 11, 21);
    }
    else if (defaultContrast === 11) {
        return new ContrastCurve(11, 11, 21, 21);
    }
    else if (defaultContrast === 21) {
        return new ContrastCurve(21, 21, 21, 21);
    }
    else {
        // Shouldn't happen.
        return new ContrastCurve(defaultContrast, defaultContrast, 7, 21);
    }
}
/**
 * A delegate for the dynamic color spec of a DynamicScheme in the 2026 spec.
 */
export class ColorSpecDelegateImpl2026 extends ColorSpecDelegateImpl2025 {
    surface() {
        const color2026 = DynamicColor.fromPalette({
            name: 'surface',
            palette: (s) => s.neutralPalette,
            tone: (s) => {
                if (s.variant === Variant.CMF) {
                    return s.isDark ? 4 : 98;
                }
                else { // Undefined use case
                    return 0;
                }
            },
            isBackground: true,
        });
        return extendSpecVersion(super.surface(), '2026', color2026);
    }
    surfaceDim() {
        const color2026 = DynamicColor.fromPalette({
            name: 'surface_dim',
            palette: (s) => s.neutralPalette,
            tone: (s) => {
                if (s.variant === Variant.CMF) {
                    return s.isDark ? 4 : 87;
                }
                else { // Undefined use case
                    return 0;
                }
            },
            chromaMultiplier: (s) => {
                if (s.variant === Variant.CMF) {
                    return s.isDark ? 1 : 1.7;
                }
                else { // Undefined use case
                    return 0;
                }
            },
            isBackground: true,
        });
        return extendSpecVersion(super.surfaceDim(), '2026', color2026);
    }
    surfaceBright() {
        const color2026 = DynamicColor.fromPalette({
            name: 'surface_bright',
            palette: (s) => s.neutralPalette,
            tone: (s) => {
                if (s.variant === Variant.CMF) {
                    return s.isDark ? 18 : 98;
                }
                else { // Undefined use case
                    return 0;
                }
            },
            chromaMultiplier: (s) => {
                if (s.variant === Variant.CMF) {
                    return s.isDark ? 1.7 : 1;
                }
                else { // Undefined use case
                    return 0;
                }
            },
            isBackground: true,
        });
        return extendSpecVersion(super.surfaceBright(), '2026', color2026);
    }
    surfaceContainerLowest() {
        const color2026 = DynamicColor.fromPalette({
            name: 'surface_container_lowest',
            palette: (s) => s.neutralPalette,
            tone: (s) => {
                if (s.variant === Variant.CMF) {
                    return s.isDark ? 0 : 100;
                }
                else { // Undefined use case
                    return 0;
                }
            },
            isBackground: true,
        });
        return extendSpecVersion(super.surfaceContainerLowest(), '2026', color2026);
    }
    surfaceContainerLow() {
        const color2026 = DynamicColor.fromPalette({
            name: 'surface_container_low',
            palette: (s) => s.neutralPalette,
            tone: (s) => {
                if (s.variant === Variant.CMF) {
                    return s.isDark ? 6 : 96;
                }
                else { // Undefined use case
                    return 0;
                }
            },
            chromaMultiplier: (s) => {
                if (s.variant === Variant.CMF) {
                    return 1.25;
                }
                else { // Undefined use case
                    return 0;
                }
            },
            isBackground: true,
        });
        return extendSpecVersion(super.surfaceContainerLow(), '2026', color2026);
    }
    surfaceContainer() {
        const color2026 = DynamicColor.fromPalette({
            name: 'surface_container',
            palette: (s) => s.neutralPalette,
            tone: (s) => {
                if (s.variant === Variant.CMF) {
                    return s.isDark ? 9 : 94;
                }
                else { // Undefined use case
                    return 0;
                }
            },
            chromaMultiplier: (s) => {
                if (s.variant === Variant.CMF) {
                    return 1.4;
                }
                else { // Undefined use case
                    return 0;
                }
            },
            isBackground: true,
        });
        return extendSpecVersion(super.surfaceContainer(), '2026', color2026);
    }
    surfaceContainerHigh() {
        const color2026 = DynamicColor.fromPalette({
            name: 'surface_container_high',
            palette: (s) => s.neutralPalette,
            tone: (s) => {
                if (s.variant === Variant.CMF) {
                    return s.isDark ? 12 : 92;
                }
                else { // Undefined use case
                    return 0;
                }
            },
            chromaMultiplier: (s) => {
                if (s.variant === Variant.CMF) {
                    return 1.5;
                }
                else { // Undefined use case
                    return 0;
                }
            },
            isBackground: true,
        });
        return extendSpecVersion(super.surfaceContainerHigh(), '2026', color2026);
    }
    surfaceContainerHighest() {
        const color2026 = DynamicColor.fromPalette({
            name: 'surface_container_highest',
            palette: (s) => s.neutralPalette,
            tone: (s) => {
                if (s.variant === Variant.CMF) {
                    return s.isDark ? 15 : 90;
                }
                else { // Undefined use case
                    return 0;
                }
            },
            chromaMultiplier: (s) => {
                if (s.variant === Variant.CMF) {
                    return 1.7;
                }
                else { // Undefined use case
                    return 0;
                }
            },
            isBackground: true,
        });
        return extendSpecVersion(super.surfaceContainerHighest(), '2026', color2026);
    }
    onSurface() {
        const color2026 = DynamicColor.fromPalette({
            name: 'on_surface',
            palette: (s) => s.neutralPalette,
            chromaMultiplier: (s) => {
                if (s.variant === Variant.CMF) {
                    return 1.7;
                }
                else { // Undefined use case
                    return 0;
                }
            },
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => s.isDark ? getCurve(11) : getCurve(9),
        });
        return extendSpecVersion(super.onSurface(), '2026', color2026);
    }
    onSurfaceVariant() {
        const color2026 = DynamicColor.fromPalette({
            name: 'on_surface_variant',
            palette: (s) => s.neutralPalette,
            chromaMultiplier: (s) => {
                if (s.variant === Variant.CMF) {
                    return 1.7;
                }
                else { // Undefined variant
                    return 0;
                }
            },
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => s.isDark ? getCurve(6) : getCurve(4.5),
        });
        return extendSpecVersion(super.onSurfaceVariant(), '2026', color2026);
    }
    outline() {
        const color2026 = DynamicColor.fromPalette({
            name: 'outline',
            palette: (s) => s.neutralPalette,
            chromaMultiplier: (s) => {
                if (s.variant === Variant.CMF) {
                    return 1.7;
                }
                else { // Undefined use case
                    return 0;
                }
            },
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => getCurve(3),
        });
        return extendSpecVersion(super.outline(), '2026', color2026);
    }
    outlineVariant() {
        const color2026 = DynamicColor.fromPalette({
            name: 'outline_variant',
            palette: (s) => s.neutralPalette,
            chromaMultiplier: (s) => {
                if (s.variant === Variant.CMF) {
                    return 1.7;
                }
                else { // Undefined use case
                    return 0;
                }
            },
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => getCurve(1.5),
        });
        return extendSpecVersion(super.outlineVariant(), '2026', color2026);
    }
    inverseSurface() {
        const color2026 = DynamicColor.fromPalette({
            name: 'inverse_surface',
            palette: (s) => s.neutralPalette,
            tone: (s) => {
                return s.isDark ? 98 : 4;
            },
            chromaMultiplier: (s) => {
                if (s.variant === Variant.CMF) {
                    return 1.7;
                }
                else { // Undefined use case
                    return 0;
                }
            },
            isBackground: true,
        });
        return extendSpecVersion(super.inverseSurface(), '2026', color2026);
    }
    inverseOnSurface() {
        const color2026 = DynamicColor.fromPalette({
            name: 'inverse_on_surface',
            palette: (s) => s.neutralPalette,
            background: (s) => this.inverseSurface(),
            contrastCurve: (s) => getCurve(7),
        });
        return extendSpecVersion(super.inverseOnSurface(), '2026', color2026);
    }
    primary() {
        const color2026 = DynamicColor.fromPalette({
            name: 'primary',
            palette: (s) => s.primaryPalette,
            tone: (s) => s.sourceColorHct.chroma <= 12 ? (s.isDark ? 80 : 40) :
                s.sourceColorHct.tone,
            isBackground: true,
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => getCurve(4.5),
            toneDeltaPair: (s) => s.platform === 'phone' ?
                new ToneDeltaPair(this.primaryContainer(), this.primary(), 5, 'relative_lighter', true, 'farther') :
                undefined,
        });
        return extendSpecVersion(super.primary(), '2026', color2026);
    }
    onPrimary() {
        const color2026 = DynamicColor.fromPalette({
            name: 'on_primary',
            palette: (s) => s.primaryPalette,
            background: (s) => this.primary(),
            contrastCurve: (s) => getCurve(6),
        });
        return extendSpecVersion(super.onPrimary(), '2026', color2026);
    }
    primaryContainer() {
        const color2026 = DynamicColor.fromPalette({
            name: 'primary_container',
            palette: (s) => s.primaryPalette,
            tone: (s) => {
                if (!s.isDark && s.sourceColorHct.chroma <= 12) {
                    return 90;
                }
                return s.sourceColorHct.tone > 55 ?
                    clampDouble(61, 90, s.sourceColorHct.tone) :
                    clampDouble(30, 49, s.sourceColorHct.tone);
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => s.contrastLevel > 0 ? getCurve(1.5) : undefined,
        });
        return extendSpecVersion(super.primaryContainer(), '2026', color2026);
    }
    onPrimaryContainer() {
        const color2026 = DynamicColor.fromPalette({
            name: 'on_primary_container',
            palette: (s) => s.primaryPalette,
            background: (s) => this.primaryContainer(),
            contrastCurve: (s) => getCurve(6),
        });
        return extendSpecVersion(super.onPrimaryContainer(), '2026', color2026);
    }
    primaryFixed() {
        const color2026 = DynamicColor.fromPalette({
            name: 'primary_fixed',
            palette: (s) => s.primaryPalette,
            tone: (s) => {
                let tempS = Object.assign({}, s, { isDark: false, contrastLevel: 0 });
                return this.primaryContainer().getTone(tempS);
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => s.contrastLevel > 0 ? getCurve(1.5) : undefined,
        });
        return extendSpecVersion(super.primaryFixed(), '2026', color2026);
    }
    primaryFixedDim() {
        const color2026 = DynamicColor.fromPalette({
            name: 'primary_fixed_dim',
            palette: (s) => s.primaryPalette,
            tone: (s) => this.primaryFixed().getTone(s),
            isBackground: true,
            background: (s) => this.highestSurface(s),
            toneDeltaPair: (s) => new ToneDeltaPair(this.primaryFixedDim(), this.primaryFixed(), 5, 'darker', true, 'exact'),
            contrastCurve: (s) => s.contrastLevel > 0 ? getCurve(1.5) : undefined,
        });
        return extendSpecVersion(super.primaryFixedDim(), '2026', color2026);
    }
    onPrimaryFixed() {
        const color2026 = DynamicColor.fromPalette({
            name: 'on_primary_fixed',
            palette: (s) => s.primaryPalette,
            background: (s) => this.primaryFixed().getTone(s) > 57 ?
                this.primaryFixedDim() :
                this.primaryFixed(),
            contrastCurve: (s) => getCurve(7),
        });
        return extendSpecVersion(super.onPrimaryFixed(), '2026', color2026);
    }
    onPrimaryFixedVariant() {
        const color2026 = DynamicColor.fromPalette({
            name: 'on_primary_fixed_variant',
            palette: (s) => s.primaryPalette,
            background: (s) => this.primaryFixed().getTone(s) > 57 ?
                this.primaryFixedDim() :
                this.primaryFixed(),
            contrastCurve: (s) => getCurve(4.5),
        });
        return extendSpecVersion(super.onPrimaryFixedVariant(), '2026', color2026);
    }
    inversePrimary() {
        return super.inversePrimary();
    }
    secondary() {
        const color2026 = DynamicColor.fromPalette({
            name: 'secondary',
            palette: (s) => s.secondaryPalette,
            tone: (s) => {
                return s.isDark ? tMinC(s.secondaryPalette) : tMaxC(s.secondaryPalette);
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => getCurve(4.5),
            toneDeltaPair: (s) => s.platform === 'phone' ?
                new ToneDeltaPair(this.secondaryContainer(), this.secondary(), 5, 'relative_lighter', true, 'farther') :
                undefined,
        });
        return extendSpecVersion(super.secondary(), '2026', color2026);
    }
    onSecondary() {
        const color2026 = DynamicColor.fromPalette({
            name: 'on_secondary',
            palette: (s) => s.secondaryPalette,
            background: (s) => this.secondary(),
            contrastCurve: (s) => getCurve(6),
        });
        return extendSpecVersion(super.onSecondary(), '2026', color2026);
    }
    secondaryContainer() {
        const color2026 = DynamicColor.fromPalette({
            name: 'secondary_container',
            palette: (s) => s.secondaryPalette,
            tone: (s) => {
                return s.isDark ? tMinC(s.secondaryPalette, 20, 49) :
                    tMaxC(s.secondaryPalette, 61, 90);
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => s.contrastLevel > 0 ? getCurve(1.5) : undefined,
        });
        return extendSpecVersion(super.secondaryContainer(), '2026', color2026);
    }
    onSecondaryContainer() {
        const color2026 = DynamicColor.fromPalette({
            name: 'on_secondary_container',
            palette: (s) => s.secondaryPalette,
            background: (s) => this.secondaryContainer(),
            contrastCurve: (s) => getCurve(6),
        });
        return extendSpecVersion(super.onSecondaryContainer(), '2026', color2026);
    }
    secondaryFixed() {
        const color2026 = DynamicColor.fromPalette({
            name: 'secondary_fixed',
            palette: (s) => s.secondaryPalette,
            tone: (s) => {
                let tempS = Object.assign({}, s, { isDark: false, contrastLevel: 0 });
                return this.secondaryContainer().getTone(tempS);
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => s.contrastLevel > 0 ? getCurve(1.5) : undefined,
        });
        return extendSpecVersion(super.secondaryFixed(), '2026', color2026);
    }
    secondaryFixedDim() {
        const color2026 = DynamicColor.fromPalette({
            name: 'secondary_fixed_dim',
            palette: (s) => s.secondaryPalette,
            tone: (s) => this.secondaryFixed().getTone(s),
            isBackground: true,
            background: (s) => this.highestSurface(s),
            toneDeltaPair: (s) => new ToneDeltaPair(this.secondaryFixedDim(), this.secondaryFixed(), 5, 'darker', true, 'exact'),
            contrastCurve: (s) => s.contrastLevel > 0 ? getCurve(1.5) : undefined,
        });
        return extendSpecVersion(super.secondaryFixedDim(), '2026', color2026);
    }
    onSecondaryFixed() {
        const color2026 = DynamicColor.fromPalette({
            name: 'on_secondary_fixed',
            palette: (s) => s.secondaryPalette,
            background: (s) => this.secondaryFixed().getTone(s) > 57 ?
                this.secondaryFixedDim() :
                this.secondaryFixed(),
            contrastCurve: (s) => getCurve(7),
        });
        return extendSpecVersion(super.onSecondaryFixed(), '2026', color2026);
    }
    onSecondaryFixedVariant() {
        const color2026 = DynamicColor.fromPalette({
            name: 'on_secondary_fixed_variant',
            palette: (s) => s.secondaryPalette,
            background: (s) => this.secondaryFixed().getTone(s) > 57 ?
                this.secondaryFixedDim() :
                this.secondaryFixed(),
            contrastCurve: (s) => getCurve(4.5),
        });
        return extendSpecVersion(super.onSecondaryFixedVariant(), '2026', color2026);
    }
    tertiary() {
        const color2026 = DynamicColor.fromPalette({
            name: 'tertiary',
            palette: (s) => s.tertiaryPalette,
            tone: (s) => {
                return s.sourceColorHcts[1]?.tone ?? s.sourceColorHct.tone;
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => getCurve(4.5),
            toneDeltaPair: (s) => s.platform === 'phone' ?
                new ToneDeltaPair(this.tertiaryContainer(), this.tertiary(), 5, 'relative_lighter', true, 'farther') :
                undefined,
        });
        return extendSpecVersion(super.tertiary(), '2026', color2026);
    }
    onTertiary() {
        const color2026 = DynamicColor.fromPalette({
            name: 'on_tertiary',
            palette: (s) => s.tertiaryPalette,
            background: (s) => this.tertiary(),
            contrastCurve: (s) => getCurve(6),
        });
        return extendSpecVersion(super.onTertiary(), '2026', color2026);
    }
    tertiaryContainer() {
        const color2026 = DynamicColor.fromPalette({
            name: 'tertiary_container',
            palette: (s) => s.tertiaryPalette,
            tone: (s) => {
                const secondarySourceColorHct = s.sourceColorHcts[1] ?? s.sourceColorHct;
                return secondarySourceColorHct.tone > 55 ?
                    clampDouble(61, 90, secondarySourceColorHct.tone) :
                    clampDouble(20, 49, secondarySourceColorHct.tone);
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => s.contrastLevel > 0 ? getCurve(1.5) : undefined,
        });
        return extendSpecVersion(super.tertiaryContainer(), '2026', color2026);
    }
    onTertiaryContainer() {
        const color2026 = DynamicColor.fromPalette({
            name: 'on_tertiary_container',
            palette: (s) => s.tertiaryPalette,
            background: (s) => this.tertiaryContainer(),
            contrastCurve: (s) => getCurve(6),
        });
        return extendSpecVersion(super.onTertiaryContainer(), '2026', color2026);
    }
    tertiaryFixed() {
        const color2026 = DynamicColor.fromPalette({
            name: 'tertiary_fixed',
            palette: (s) => s.tertiaryPalette,
            tone: (s) => {
                let tempS = Object.assign({}, s, { isDark: false, contrastLevel: 0 });
                return this.tertiaryContainer().getTone(tempS);
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => s.contrastLevel > 0 ? getCurve(1.5) : undefined,
        });
        return extendSpecVersion(super.tertiaryFixed(), '2026', color2026);
    }
    tertiaryFixedDim() {
        const color2026 = DynamicColor.fromPalette({
            name: 'tertiary_fixed_dim',
            palette: (s) => s.tertiaryPalette,
            tone: (s) => this.tertiaryFixed().getTone(s),
            isBackground: true,
            background: (s) => this.highestSurface(s),
            toneDeltaPair: (s) => new ToneDeltaPair(this.tertiaryFixedDim(), this.tertiaryFixed(), 5, 'darker', true, 'exact'),
            contrastCurve: (s) => s.contrastLevel > 0 ? getCurve(1.5) : undefined,
        });
        return extendSpecVersion(super.tertiaryFixedDim(), '2026', color2026);
    }
    onTertiaryFixed() {
        const color2026 = DynamicColor.fromPalette({
            name: 'on_tertiary_fixed',
            palette: (s) => s.tertiaryPalette,
            background: (s) => this.tertiaryFixed().getTone(s) > 57 ?
                this.tertiaryFixedDim() :
                this.tertiaryFixed(),
            contrastCurve: (s) => getCurve(7),
        });
        return extendSpecVersion(super.onTertiaryFixed(), '2026', color2026);
    }
    onTertiaryFixedVariant() {
        const color2026 = DynamicColor.fromPalette({
            name: 'on_tertiary_fixed_variant',
            palette: (s) => s.tertiaryPalette,
            background: (s) => this.tertiaryFixed().getTone(s) > 57 ?
                this.tertiaryFixedDim() :
                this.tertiaryFixed(),
            contrastCurve: (s) => getCurve(4.5),
        });
        return extendSpecVersion(super.onTertiaryFixedVariant(), '2026', color2026);
    }
    error() {
        const color2026 = DynamicColor.fromPalette({
            name: 'error',
            palette: (s) => s.errorPalette,
            tone: (s) => {
                return tMaxC(s.errorPalette);
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => getCurve(4.5),
            toneDeltaPair: (s) => s.platform === 'phone' ?
                new ToneDeltaPair(this.errorContainer(), this.error(), 5, 'relative_lighter', true, 'farther') :
                undefined,
        });
        return extendSpecVersion(super.error(), '2026', color2026);
    }
    onError() {
        const color2026 = DynamicColor.fromPalette({
            name: 'on_error',
            palette: (s) => s.errorPalette,
            background: (s) => this.error(),
            contrastCurve: (s) => getCurve(6),
        });
        return extendSpecVersion(super.onError(), '2026', color2026);
    }
    errorContainer() {
        const color2026 = DynamicColor.fromPalette({
            name: 'error_container',
            palette: (s) => s.errorPalette,
            tone: (s) => {
                return s.isDark ? tMinC(s.errorPalette) : tMaxC(s.errorPalette);
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => s.contrastLevel > 0 ? getCurve(1.5) : undefined,
        });
        return extendSpecVersion(super.errorContainer(), '2026', color2026);
    }
    onErrorContainer() {
        const color2026 = DynamicColor.fromPalette({
            name: 'on_error_container',
            palette: (s) => s.errorPalette,
            background: (s) => this.errorContainer(),
            contrastCurve: (s) => getCurve(6),
        });
        return extendSpecVersion(super.onErrorContainer(), '2026', color2026);
    }
    /////////////////////////////////////////////////////////////////
    // Remapped Colors                                             //
    /////////////////////////////////////////////////////////////////
    primaryDim() {
        const color2026 = Object.assign(this.primary().clone(), {
            name: 'primary_dim',
        });
        return extendSpecVersion(super.primaryDim(), '2026', color2026);
    }
    secondaryDim() {
        const color2026 = Object.assign(this.secondary().clone(), {
            name: 'secondary_dim',
        });
        return extendSpecVersion(super.secondaryDim(), '2026', color2026);
    }
    tertiaryDim() {
        const color2026 = Object.assign(this.tertiary().clone(), {
            name: 'tertiary_dim',
        });
        return extendSpecVersion(super.tertiaryDim(), '2026', color2026);
    }
    errorDim() {
        const color2026 = Object.assign(this.error().clone(), {
            name: 'error_dim',
        });
        return extendSpecVersion(super.errorDim(), '2026', color2026);
    }
}
//# sourceMappingURL=color_spec_2026.js.map