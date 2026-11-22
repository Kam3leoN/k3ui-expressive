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
import { ColorSpecDelegateImpl2025 } from './color_spec_2025.js';
import { DynamicColor } from './dynamic_color';
/**
 * A delegate for the dynamic color spec of a DynamicScheme in the 2026 spec.
 */
export declare class ColorSpecDelegateImpl2026 extends ColorSpecDelegateImpl2025 {
    surface(): DynamicColor;
    surfaceDim(): DynamicColor;
    surfaceBright(): DynamicColor;
    surfaceContainerLowest(): DynamicColor;
    surfaceContainerLow(): DynamicColor;
    surfaceContainer(): DynamicColor;
    surfaceContainerHigh(): DynamicColor;
    surfaceContainerHighest(): DynamicColor;
    onSurface(): DynamicColor;
    onSurfaceVariant(): DynamicColor;
    outline(): DynamicColor;
    outlineVariant(): DynamicColor;
    inverseSurface(): DynamicColor;
    inverseOnSurface(): DynamicColor;
    primary(): DynamicColor;
    onPrimary(): DynamicColor;
    primaryContainer(): DynamicColor;
    onPrimaryContainer(): DynamicColor;
    primaryFixed(): DynamicColor;
    primaryFixedDim(): DynamicColor;
    onPrimaryFixed(): DynamicColor;
    onPrimaryFixedVariant(): DynamicColor;
    inversePrimary(): DynamicColor;
    secondary(): DynamicColor;
    onSecondary(): DynamicColor;
    secondaryContainer(): DynamicColor;
    onSecondaryContainer(): DynamicColor;
    secondaryFixed(): DynamicColor;
    secondaryFixedDim(): DynamicColor;
    onSecondaryFixed(): DynamicColor;
    onSecondaryFixedVariant(): DynamicColor;
    tertiary(): DynamicColor;
    onTertiary(): DynamicColor;
    tertiaryContainer(): DynamicColor;
    onTertiaryContainer(): DynamicColor;
    tertiaryFixed(): DynamicColor;
    tertiaryFixedDim(): DynamicColor;
    onTertiaryFixed(): DynamicColor;
    onTertiaryFixedVariant(): DynamicColor;
    error(): DynamicColor;
    onError(): DynamicColor;
    errorContainer(): DynamicColor;
    onErrorContainer(): DynamicColor;
    primaryDim(): DynamicColor;
    secondaryDim(): DynamicColor;
    tertiaryDim(): DynamicColor;
    errorDim(): DynamicColor;
}
