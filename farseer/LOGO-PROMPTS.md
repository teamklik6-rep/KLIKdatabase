# FARSEER — промпти для генерації логотипів

Figma: https://www.figma.com/design/WlfAK7sj1Fz1p623TUVlwD/Untitled?node-id=9-2

## Як користуватися

- **Модель:** Banana Pro / Banana 2 (найкраще тримає референси й текст у кадрі). Запасний варіант для точного тексту: GPT Image 2.5.
- **У налаштуваннях (UI), не в промпті:** формат 1:1, роздільна здатність 2K (4K для фіналу).
- **Закріплені фото:**
  - **Image 1** = майстер логотипу з папки `logos/` (геометрія і розкладка, генератор має повторити її максимально точно).
  - **Image 2** = дошка стилю з папки `refs/` (тільки настрій і фактура, без копіювання символів).
  - Порядок прикріплення важливий: першим — логотип, другим — дошка стилю.
- Якщо літери «попливли» — перегенеруй 2–4 рази або переключись на GPT Image 2.5. Фінальний вектор все одно збираємо у Figma.

| Логотип | Image 1 (logos/) | Image 2 (refs/) |
|---|---|---|
| 1A Iris Spark | `1A-iris-spark.png` | `REF-style1-minimal-board.png` |
| 1B Horizon Eye | `1B-horizon-eye.png` | `REF-style1-minimal-board.png` |
| 1C Data Eye | `1C-data-eye.png` | `REF-style1-minimal-board.png` |
| 2A Хрест FA·R / SE·ER | `2A-cross-farseer.png` | `REF-style2-byzantine-board.png` |
| 2B Sigillum | `2B-sigillum.png` | `REF-style2-byzantine-board.png` |
| 2C FS Ligatura | `2C-fs-ligatura.png` | `REF-style2-byzantine-board.png` |
| 3A Grin (дуга) | `3A-grin-arc.png` | `REF-style3-street-demon-board.png` |
| 3B Spray Tag | `3B-spray-tag.png` | `REF-style3-street-demon-board.png` |
| 3C Horned Eye | `3C-horned-eye.png` | `REF-style3-street-demon-board.png` |

---

## Стиль 1 — Мінімал: біле на чорному

### 1A · Iris Spark
Мигдалеподібне біле око, замість зіниці чотирипроменева іскра, під ним широкий гротеск FARSEER. Чистий флет-логотип на чорному.

```
Image 1 is the logo master: reproduce its symbol construction, proportions, layout and wordmark position exactly. Image 2 is a style mood reference only: take its minimal white-on-black graphic language, never its symbols, letters or watermarks.
Flat vector brand logo for "FARSEER", a crypto prediction-market launchpad, centred on a seamless matte jet-black square background. The symbol is a pure white almond-shaped eye formed by two smooth symmetrical arcs that meet in needle-sharp corners; inside it sits a solid black circular iris, and in the centre of the iris a white four-pointed sparkle star with concave sides and sharp tips takes the place of the pupil. Below the symbol, the wordmark "FARSEER" in pure white uppercase geometric grotesk sans-serif, bold weight, very wide letter spacing, perfectly centred under the eye. Crisp razor-clean edges, perfect mirror symmetry, generous negative space, strictly two colours: white is the only colour on the black field. Front-on flat logo presentation with no mockup, no perspective, no shadow, no gradient, no glow and no extra text.
```

### 1B · Horizon Eye
Нова форма замість «інстаграмної»: око з двох повік-півмісяців, що сходяться на довгій лінії горизонту, зіниця — іскра-сонце, що сходить. Ідея «бачити далеко».

```
Image 1 is the logo master: reproduce its symbol construction, proportions, layout and wordmark position exactly. Image 2 is a style mood reference only: take its minimal white-on-black graphic language, never its symbols, letters or watermarks.
Flat vector brand logo for "FARSEER", a crypto prediction-market launchpad, centred on a seamless matte jet-black square background. The symbol is an open eye drawn as two pure white tapered crescent lids, a heavy arched upper lid and a thinner curved lower lid, that meet in sharp corners on one long thin horizontal horizon line; the line runs far beyond both corners of the eye and tapers to fine points. In the centre a crisp white four-pointed star sits on the horizon as the pupil and a rising sun: its side rays merge into the horizon line and its upper ray is longer than the lower one. Open line construction with no circle, no iris disc and no container. Below the symbol, the wordmark "FARSEER" in pure white uppercase wide geometric sans-serif, medium weight, wide letter spacing, perfectly centred. Crisp razor-clean edges, perfect mirror symmetry, generous negative space, strictly two colours: white is the only colour on the black field. Front-on flat logo presentation with no mockup, no perspective, no shadow, no gradient, no glow, no lens flare and no extra text.
```

### 1C · Data Eye
Доопрацьована версія: око з 7 горизонтальних смуг (ринкові дані / ордербук), кінці смуг точно описують мигдаль, у центрі кільце-райдужка з іскрою.

```
Image 1 is the logo master: reproduce its symbol construction, number of bars, proportions, layout and wordmark position exactly. Image 2 is a style mood reference only: take its minimal white-on-black graphic language, never its symbols, letters or watermarks.
Flat vector brand logo for "FARSEER", a crypto prediction-market launchpad, centred on a seamless matte jet-black square background. The symbol is a wide almond-shaped eye built from seven horizontal pure white bars separated by equal black gaps, like stacked rows of market data; the bar ends are cut so together they trace a crisp pointed almond outline, and the top and bottom bars form thin white lid domes. In the centre the bars stop around a clean black circular gap; inside it a thick white ring forms the iris, and inside the ring a white four-pointed sparkle star with concave sides sits on black as the pupil. Below the symbol, the wordmark "FARSEER" in pure white uppercase geometric grotesk sans-serif, bold weight, wide letter spacing, perfectly centred. Crisp razor-clean edges, perfect mirror symmetry, strictly two colours: white is the only colour on the black field. Front-on flat logo presentation with no mockup, no perspective, no shadow, no gradient, no glow and no extra text.
```

---

## Стиль 2 — Візантійська монограма: чорне на пергаменті

### 2A · Хрест FA·R / SE·ER
Хрест-христограма в ритмі IC XC NIKA, але тільки слово бренду: FA | R зверху, SE | ER знизу, титла, крапки на кінцях рамен і у внутрішніх кутах.

```
Image 1 is the logo master: reproduce the cross, the letter groups, their positions and every ornament exactly. Image 2 is a style mood reference only: take its Byzantine christogram spirit and solid black ink, never its letters.
Flat vector Byzantine christogram-style logo for "FARSEER", near-black ink on a warm off-white parchment background. An equal-armed cross with slightly concave arms that flare into cupped ends, a small round dot beyond each of the four arm ends, and four tiny dots in the inner angles where the arms meet. The four quadrants carry only the letters of the brand name in rounded medieval uncial capitals, read row by row: "FA" upper left and "R" upper right, "SE" lower left and "ER" lower right, every group set close to the vertical arm, so the top row reads FAR and the bottom row reads SEER. A small wavy titlo stroke floats above "FA" and above "R". Crisp clean vector edges, balanced symmetric composition, strictly two colours: near-black ink is the only colour on the parchment, and the brand letters are the only lettering in the image. Front-on flat logo presentation with no mockup, no perspective, no shadow and no gradient.
```

### 2B · Sigillum
Кругла печатка: FARSEER по верхній дузі, FUTURA VIDET («бачить майбутнє») по нижній, у центрі архаїчне око з променями.

```
Image 1 is the logo master: reproduce the seal construction, ring proportions, text placement and central emblem exactly. Image 2 is a style mood reference only: take its Byzantine inscription spirit and solid black ink, never its letters or symbols.
Flat vector circular seal logo for "FARSEER", near-black ink on a warm off-white parchment background. A thick outer ring and a thin inner ring. Between them, "FARSEER" runs along the upper arc and "FUTURA VIDET" runs along the lower arc reading left to right, both in classical Roman inscriptional capitals with sharp serifs, evenly letter-spaced; a small four-pointed star sits at the left and at the right between the two inscriptions. In the centre, an archaic eye: an almond outline drawn with a confident even stroke, a solid black round iris with a small parchment-coloured pupil, three short straight rays above and three below. Crisp clean vector edges, perfect symmetry, strictly two colours: near-black ink is the only colour on the parchment. Front-on flat logo presentation with no mockup, no perspective, no shadow, no gradient and no extra text.
```

### 2C · FS Ligatura
Лігатура F + S у контрастній антиква, ніжка F з гострим кінцем, маленький хрест-патте як крапка, капітельний FARSEER з лінійками.

```
Image 1 is the logo master: reproduce the ligature, the small cross and the wordmark lockup exactly. Image 2 is a style mood reference only: take its Byzantine spirit and solid black ink, never its letters or symbols.
Flat vector monogram logo for "FARSEER", near-black ink on a warm off-white parchment background. A large ligature of a capital F and a capital S in a high-contrast classical serif: the vertical stem of the F runs down past the baseline and ends in a sharp tapered point, and the S sits tight against the arms of the F so the two letters read as one sign. A small cross pattée with flared arms sits at the lower right of the S like a full stop. Below, the word "FARSEER" in widely letter-spaced classical Roman capitals, flanked on both sides by thin horizontal rules. Crisp clean vector edges, balanced centred composition, strictly two colours: near-black ink is the only colour on the parchment. Front-on flat logo presentation with no mockup, no perspective, no shadow, no gradient and no extra text.
```

---

## Стиль 3 — Стріт-демон: чорне на білому

### 3A · Grin
Чорна рогата голова з посмішкою та іклами, FARSEER білим блеклеттером по дузі на лобі.

```
Image 1 is the logo master: reproduce the head shape, horns, face and the arched forehead wordmark exactly. Image 2 is a style mood reference only: take its graffiti-stencil attitude and blackletter lettering, never its exact drawings.
Flat vector street-style mascot logo for "FARSEER" on a plain pure white background. A solid black round demon head with two tall spiky horns sweeping up and outward from the top of the skull to sharp points; two angry slanted white eye slits angled down toward the nose; a wide white crescent grin with two small pointed black fangs. On the forehead, the word "FARSEER" in white Gothic blackletter (Fraktur) capitals, set along a gentle upward arc that follows the dome of the head, each letter rotated to the curve, evenly spaced and clear of the eyes. Bold stencil-cut silhouette with clean hard edges, strictly two colours: black and white only. Front-on flat logo presentation with no mockup, no perspective, no shadow, no gradient and no extra text.
```

### 3B · Spray Tag
Контурний тег балончиком: голова-кільце, роги-шеврони, очі-риски, крапля-патьок, під ним вузький блеклеттер.

```
Image 1 is the logo master: reproduce the drawing, line weight, proportions and wordmark placement exactly. Image 2 is a texture reference only: take the sprayed-paint edge quality of its small demon tag on the left, never its drawing.
Spray-paint graffiti tag logo for "FARSEER" on a plain pure white background. A demon face drawn in one thick black spray-can line: a round head outline, two chevron-shaped horns rising from the top, two short slanted dash eyes, a smiling arc mouth, and a single paint drip running down from the chin ending in a round drop. The strokes have soft sprayed edges with a fine overspray halo hugging the line. Below the tag, the word "FARSEER" in sharp narrow black blackletter capitals with pointed serifs, crisp and fully legible. Strictly black on white, centred composition. Front-on flat logo presentation with no mockup, no perspective, no shadow, no gradient and no extra text.
```

### 3C · Horned Eye
Чорне мигдалеподібне око з рогами і котячою зіницею, без бризок, напис New Rocker. Покращена форма і 2 альтернативи — у секції «3C — форма» у Figma.

```
Image 1 is the logo master: reproduce the horned eye and the wordmark lockup exactly. Image 2 is a style mood reference only: take its street-demon attitude, never its drawings or lettering.
Flat vector logo for "FARSEER" on a plain pure white background. A solid black almond-shaped eye with two sharp horns rising from its top edge in a V; inside the eye a white round iris with a tall vertical black cat-slit pupil. Below the symbol, the word "FARSEER" in black rock-poster blackletter capitals with sharp pointed spurs and barbs that echo the horns, set as wide as the eye and perfectly centred. Bold silhouette with clean hard edges, strictly black on white, a clean empty background around the mark with no dots, no splatter and no particles. Front-on flat logo presentation with no mockup, no perspective, no shadow, no gradient and no extra text.
```
