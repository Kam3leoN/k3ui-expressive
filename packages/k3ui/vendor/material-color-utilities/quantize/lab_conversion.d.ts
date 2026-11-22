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
/**
 * Converts a color from ARGB to L*a*b* and writes L*, a* and b* to
 * out[offset], out[offset + 1] and out[offset + 2].
 *
 * Gives exactly the same values as utils.labFromArgb(), but looks up the
 * linearized channels in a table and does not allocate an array.
 */
export declare function labFromArgbInto(argb: number, out: Float64Array, offset: number): void;
