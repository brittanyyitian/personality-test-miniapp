# Soft-mist v2 asset map

These versioned assets reproduce the selected anchor board's complete visual-material language without overwriting the current implementation. They stay outside `miniprogram/` so unused candidates do not inflate the WeChat main package; copy only selected files into the runtime asset folder when integrating them.

| Asset | Intended use |
| --- | --- |
| `hero-blue-v2.png` | Featured “16 型人格偏好” card, full bleed beneath editable text |
| `mist-leaf-green-v2.png` | “性格底色” compact entry |
| `mist-bloom-coral-v2.png` | “依恋倾向” compact entry |
| `mist-petal-lavender-v2.png` | “恋爱状态 / 灵感卡” compact entry |
| `mist-particles-blue-v2.png` | “社交状态” compact entry |
| `result-axis-coral-v2.png` | Soft point on the two-axis result map |
| `result-edge-blue-v2.png` | Sparse right-edge accent on the middle result section |
| `result-edge-coral-v2.png` | Sparse left-edge accent near the result-page continuation |
| `result-reminder-wash-v2.png` | Very pale atmospheric layer behind “给你的提醒” |
| `icon-heart-coral.svg` | “恋爱里的你” extension row |
| `icon-knot-lavender.svg` | “你容易卡在哪里” extension row |
| `icon-feather-blue.svg` | Couple map and “给你一个小练习” rows |
| `tarot-card-art-v2.png` | Full-resolution source artwork for the redesigned tarot-style reflection card |

All PNG motifs except the hero use an alpha channel and should sit directly on the page/card surface. Do not place them inside a white square thumbnail wrapper.

The mini-program runtime uses a compressed JPEG copy of the tarot artwork at `miniprogram/assets/tarot-card-art.jpg` to keep the main package below 2 MB.
