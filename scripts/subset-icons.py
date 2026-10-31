#!/usr/bin/env python3
"""
Build the self-hosted Material Symbols Rounded subset used by the playground.

Google Fonts' `icon_names=` subsetting, done locally: keep only the ligature
glyphs listed in playground/icons.json, the letters they are typed with, and
the axes the playground animates (FILL 0–1, wght 400–600, opsz 20–48).

    pip install fonttools brotli
    # Full variable font (Apache-2.0): npm pack material-symbols, or
    # https://github.com/google/material-design-icons/tree/master/variablefont
    python3 scripts/subset-icons.py path/to/MaterialSymbolsRounded[FILL,GRAD,opsz,wght].woff2

Output: playground/fonts/material-symbols-rounded-subset.woff2
"""
from __future__ import annotations

import hashlib
import io
import json
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
ICONS = ROOT / 'playground' / 'icons.json'
OUT = ROOT / 'playground' / 'fonts' / 'material-symbols-rounded-subset.woff2'


def ligature_map(font: TTFont) -> dict[str, str]:
    """Map icon name (typed text) → ligature glyph name, from GSUB LigatureSubst."""
    cmap = font.getBestCmap()
    glyph_to_char = {g: chr(c) for c, g in cmap.items()}
    out: dict[str, str] = {}
    for lookup in font['GSUB'].table.LookupList.Lookup:
        for st in lookup.SubTable:
            table = st.ExtSubTable if lookup.LookupType == 7 else st
            if getattr(table, 'LookupType', lookup.LookupType) != 4 or not hasattr(table, 'ligatures'):
                continue
            for first, ligs in table.ligatures.items():
                for lig in ligs:
                    chars = [glyph_to_char.get(g) for g in [first, *lig.Component]]
                    if None not in chars:
                        out.setdefault(''.join(chars), lig.LigGlyph)
    return out


def main(src: str) -> None:
    names: list[str] = json.loads(ICONS.read_text(encoding='utf-8'))
    font = TTFont(src)
    ligs = ligature_map(font)
    missing = [n for n in names if n not in ligs]
    if missing:
        sys.exit(f'Unknown icon names: {", ".join(missing)}')

    font = instancer.instantiateVariableFont(
        font, {'GRAD': 0, 'wght': (400, 600), 'opsz': (20, 48)}, inplace=False
    )
    # Round-trip so every table is materialised before subsetting
    buf = io.BytesIO()
    font.flavor = None
    font.save(buf)
    buf.seek(0)
    font = TTFont(buf, lazy=False)
    cmap = font.getBestCmap()
    letters = {cmap[ord(ch)] for n in names for ch in n if ord(ch) in cmap}
    keep = sorted(letters | {ligs[n] for n in names} | {'.notdef'})

    opts = subset.Options()
    opts.layout_closure = False  # do not pull every ligature typed with these letters
    opts.layout_features = ['*']
    opts.flavor = 'woff2'
    opts.hinting = False
    opts.desubroutinize = True
    opts.notdef_outline = False
    opts.name_IDs = ['*']
    sub = subset.Subsetter(opts)
    sub.populate(glyphs=keep, unicodes=[0x20])
    sub.subset(font)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    font.flavor = 'woff2'
    font.save(OUT)
    OUT.with_suffix('.sha256').write_text(
        hashlib.sha256('\n'.join(names).encode()).hexdigest() + '\n', encoding='utf-8'
    )
    print(f'{len(names)} icons → {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.1f} KiB)')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
