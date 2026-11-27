# Third-party notices

Code and assets in this repository that come from others, with their licences.

## Polaroid Line Carousel (MIT)

`components/ui/PolaroidLine.tsx` is ported from the 21st.dev component "Polaroid Line Carousel"
by Kedhareswer Naidu, https://21st.dev/@kedhareswer/components/polaroid-line-carousel, which states
`License: mit`. The component page states no copyright year.

```
MIT License

Copyright (c) Kedhareswer Naidu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Coverflow Carousel (MIT)

`components/ui/CoverflowCarousel.tsx` is ported from the 21st.dev component "Coverflow Carousel"
by Ruixen, https://21st.dev/@ruixen.ui/components/coverflow-carousel, which states `License: MIT`.
The component page states no copyright year.

```
MIT License

Copyright (c) Ruixen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Fonts (SIL Open Font License 1.1)

- Inter and Inter Display (`public/fonts/Inter-*`, `InterDisplay-*`, including the ticker subset
  `InterDisplay-Medium-ticker.woff`): see `public/fonts/LICENSE-Inter.txt`.
- DM Mono (`public/fonts/DMMono-*`): see `public/fonts/LICENSE-DMMono.txt`.

## Icons (ISC)

- Lucide icon paths, inlined in `components/ui/icons.tsx` (https://lucide.dev, ISC licence).

## Tools & stack logos (CC0-1.0, CC BY 3.0, MIT)

The 22 brand logos in the Tools & stack section are copied by `scripts/export-stack-icons.mjs` from two
pinned devDependencies into the generated `content/stack-icons.ts` (each entry records its source and
licence) and served as the sprite `/stack-logos.svg` (`app/stack-logos.svg/route.ts`). No icon package
ships to the browser and nothing loads from a CDN.

**Trademarks.** Every logo is a trademark of its owner. They are shown, in one muted colour, only to name
the tools this site's author uses; their use implies no endorsement or affiliation. The Google Stitch tile
is a neutral symbol drawn for this site, not Google's logo.

### Simple Icons (CC0-1.0)

`simple-icons@16.38.1`, https://simpleicons.org — HTML5, CSS, JavaScript, TypeScript, React, Next.js,
Tailwind CSS, Vite, Node.js, Supabase, Vitest, Jira, Vercel, Cloudflare Pages, Figma, Claude, Git,
GitHub. The package is dedicated to the public domain under CC0 1.0 Universal
(https://creativecommons.org/publicdomain/zero/1.0/), but its disclaimer notes that some icons keep
their own licence (`license` in `data/simple-icons.json`). Two of these do:

- **Git**: the Git Logo by Jason Long is licensed under the Creative Commons Attribution 3.0 Unported
  License, CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/; source
  https://git-scm.com/community/logos). Shown in one colour, as Simple Icons redraws it.
- **JavaScript**: the JavaScript logo from logo.js (https://github.com/voodootikigod/logo.js), MIT:

```
The MIT License (MIT)

Copyright (c) 2011 Christopher Williams <chris@iterativedesigns.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### devicon (MIT)

`@iconify-json/devicon-plain@1.2.76`, the "plain" set of devicon (https://github.com/devicons/devicon)
packaged by Iconify — Playwright, Codex, Visual Studio Code, PowerShell.

```
The MIT License (MIT)

Copyright (c) 2015 konpa

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### Layout reference (no code taken)

The section's layout follows the idea of the 21st.dev component "Logo Cloud" by @clevision
(https://21st.dev/@clevision/components/logo-cloud, `License: MIT`). No code from it was copied, so no
licence text applies; it is credited in `docs/DECISIONS.md` (2026-11-27).
