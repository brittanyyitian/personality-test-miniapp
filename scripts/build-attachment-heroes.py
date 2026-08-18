#!/usr/bin/env python3
"""Build the four attachment hero assets with exact Chinese typography."""

from pathlib import Path
import os
import random

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "miniprogram/result-package/assets/attachment"
SOURCE_DIR = ROOT / "design/attachment-result-sources"
EXPORT_DIR = ROOT / "design/attachment-result-exports"

TITLE_FONT = Path(os.environ.get(
    "ATTACHMENT_TITLE_FONT",
    Path.home() / "Library/Fonts/站酷仓耳渔阳体-W04.ttf",
))
COPY_FONT = Path(os.environ.get(
    "ATTACHMENT_COPY_FONT",
    Path.home() / "Library/Fonts/SourceHanSansHWSC-VF.ttf",
))

WIDTH = 1448
HEIGHT = 1320
SCENE_WIDTH = 1210
SCENE_TOP = 275
RED = (221, 54, 29)
INK = (35, 31, 27)


PROFILES = {
    "secure": {
        "source": SOURCE_DIR / "attachment-secure-core-scene-v3.png",
        "title": "安全型依恋",
        "subtitle": "能安心靠近，也保有自己",
        "caption": "你不是从不不安，而是相信关系可以被谈清楚。",
    },
    "anxious": {
        "source": SOURCE_DIR / "attachment-anxious-core-scene-v3.png",
        "title": "焦虑型依恋",
        "subtitle": "越重要，越需要确认连接",
        "caption": "你等的不是一条消息，是「我还在」的确定信号。",
    },
    "avoidant": {
        "source": SOURCE_DIR / "attachment-avoidant-core-scene-v4.png",
        "title": "回避型依恋",
        "subtitle": "需要空间，不等于没有感情",
        "caption": "退后是为了找回自己，不是想把关系一起关掉。",
    },
    "fearful-avoidant": {
        "source": SOURCE_DIR / "attachment-fearful-avoidant-core-scene-v3.png",
        "crop": (34, 30, 1430, 1046),
        "title": "恐惧—回避型",
        "subtitle": "怕失去，也怕靠得太近",
        "caption": "想靠近是真的，想退回去保护自己也是真的。",
    },
}


def average_corner(image: Image.Image) -> tuple[int, int, int]:
    image = image.convert("RGB")
    samples = []
    for left, top in ((0, 0), (image.width - 80, 0), (0, image.height - 80), (image.width - 80, image.height - 80)):
        crop = image.crop((max(0, left), max(0, top), min(image.width, left + 80), min(image.height, top + 80)))
        samples.extend(crop.resize((4, 4)).getdata())
    return tuple(sum(pixel[channel] for pixel in samples) // len(samples) for channel in range(3))


def paper_background(source: Image.Image, seed: int) -> Image.Image:
    base = (255, 247, 216)
    random.seed(seed)
    paper = Image.new("RGB", (WIDTH, HEIGHT), base)
    pixels = paper.load()
    for y in range(HEIGHT):
        for x in range(WIDTH):
            delta = random.choice((-2, -1, 0, 0, 0, 1, 2))
            pixels[x, y] = tuple(max(0, min(255, channel + delta)) for channel in base)
    return paper.filter(ImageFilter.GaussianBlur(0.35))


def feather_mask(size: tuple[int, int], feather: int = 34) -> Image.Image:
    width, height = size
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rectangle((feather, feather, width - feather - 1, height - feather - 1), fill=255)
    return mask.filter(ImageFilter.GaussianBlur(feather / 2))


def centered_text(draw: ImageDraw.ImageDraw, y: int, text: str, font: ImageFont.FreeTypeFont, fill, stroke_width: int = 0, stroke_fill=None) -> None:
    box = draw.textbbox((0, 0), text, font=font, stroke_width=stroke_width)
    width = box[2] - box[0]
    draw.text(((WIDTH - width) / 2, y), text, font=font, fill=fill, stroke_width=stroke_width, stroke_fill=stroke_fill)


def build(code: str, profile: dict) -> tuple[Path, Path]:
    source = Image.open(profile["source"]).convert("RGB")
    if profile.get("crop"):
        source = source.crop(profile["crop"])
    canvas = paper_background(source, seed=sum(ord(char) for char in code))

    ratio = SCENE_WIDTH / source.width
    scene = source.resize((SCENE_WIDTH, round(source.height * ratio)), Image.Resampling.LANCZOS)
    scene_left = (WIDTH - scene.width) // 2
    canvas.paste(scene, (scene_left, SCENE_TOP), feather_mask(scene.size))

    draw = ImageDraw.Draw(canvas)
    title_font = ImageFont.truetype(str(TITLE_FONT), 126)
    subtitle_font = ImageFont.truetype(str(COPY_FONT), 44)
    caption_font = ImageFont.truetype(str(COPY_FONT), 42)
    centered_text(draw, 32, profile["title"], title_font, RED, stroke_width=1, stroke_fill=(191, 44, 24))
    centered_text(draw, 178, profile["subtitle"], subtitle_font, INK)

    caption_box = draw.textbbox((0, 0), profile["caption"], font=caption_font)
    caption_width = caption_box[2] - caption_box[0]
    caption_y = HEIGHT - 74
    centered_text(draw, caption_y, profile["caption"], caption_font, INK)
    underline_y = caption_y + 58
    underline_left = (WIDTH - caption_width) / 2 + caption_width * 0.60
    underline_right = (WIDTH + caption_width) / 2
    draw.line(
        [(underline_left, underline_y), ((underline_left + underline_right) / 2, underline_y + 5), (underline_right, underline_y - 2)],
        fill=RED,
        width=5,
    )

    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    png_output = EXPORT_DIR / f"result-attachment-{code}-hero-v2.png"
    canvas.save(png_output, format="PNG", optimize=True)

    output = ASSET_DIR / f"result-attachment-{code}-hero-v2.webp"
    mobile = canvas.resize((1000, round(HEIGHT * (1000 / WIDTH))), Image.Resampling.LANCZOS)
    mobile.save(output, format="WEBP", quality=82, method=6)
    return png_output, output


if __name__ == "__main__":
    for profile_code, profile_data in PROFILES.items():
        png_path, webp_path = build(profile_code, profile_data)
        print(png_path)
        print(webp_path)
