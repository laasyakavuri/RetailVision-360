import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

def generate_sample_assets(output_dir: str):
    os.makedirs(output_dir, exist_ok=True)

    # 1. Generate Shelf Gap Image (Width: 1280, Height: 720)
    # Shows shelf with void in top section
    gap_img = Image.new("RGB", (1280, 720), color=(240, 243, 246))
    draw = ImageDraw.Draw(gap_img)

    # Draw shelf structure
    # Top shelf rail
    draw.rectangle([60, 80, 1220, 110], fill=(71, 85, 105))
    draw.rectangle([60, 360, 1220, 390], fill=(71, 85, 105))  # Middle shelf rail
    draw.rectangle([60, 640, 1220, 670], fill=(71, 85, 105))  # Bottom rail

    # Shelf backing
    draw.rectangle([60, 110, 1220, 360], fill=(226, 232, 240))
    draw.rectangle([60, 390, 1220, 640], fill=(226, 232, 240))

    # Grid slot markers (dotted guides)
    for c in range(1, 4):
        x = 60 + c * 290
        draw.line([x, 110, x, 360], fill=(203, 213, 225), width=2)
        draw.line([x, 390, x, 640], fill=(203, 213, 225), width=2)

    # In GAP image:
    # Slot (0,0) [x: 60-350] is EMPTY (The Critical Gap!)
    draw.rectangle([110, 180, 300, 320], outline=(239, 68, 68), width=3)
    draw.text((130, 240), "[ EMPTY SHELF GAP ]", fill=(220, 38, 38))

    # Slot (0,1) [x: 350-640]: PureGlacier bottle
    draw.rounded_rectangle([440, 140, 550, 350], radius=12, fill=(59, 130, 246), outline=(30, 64, 175), width=3)
    draw.rectangle([460, 200, 530, 280], fill=(255, 255, 255))
    draw.text((468, 235), "PURE", fill=(30, 64, 175))

    # Slot (0,2) [x: 640-930]: GreenElixir bottle
    draw.rounded_rectangle([730, 140, 840, 350], radius=12, fill=(34, 197, 94), outline=(21, 128, 61), width=3)
    draw.rectangle([750, 200, 820, 280], fill=(255, 255, 255))
    draw.text((755, 235), "MATCHA", fill=(21, 128, 61))

    # Slot (1,0) [x: 60-350]: Heritage Cola
    draw.rounded_rectangle([150, 420, 260, 630], radius=12, fill=(185, 28, 28), outline=(153, 27, 27), width=3)
    draw.rectangle([170, 480, 240, 560], fill=(254, 240, 138))
    draw.text((180, 515), "COLA", fill=(153, 27, 27))

    gap_path = os.path.join(output_dir, "shelf_gap_sample.jpg")
    gap_img.save(gap_path, quality=95)
    print(f"Saved {gap_path}")

    # 2. Generate Resolved Shelf Image (Fully Restocked)
    res_img = gap_img.copy()
    draw_res = ImageDraw.Draw(res_img)

    # Restock Slot (0,0) with 2 PureGlacier bottles!
    draw_res.rectangle([60, 110, 350, 360], fill=(226, 232, 240))  # clear red void marker
    draw_res.rounded_rectangle([110, 140, 210, 350], radius=12, fill=(59, 130, 246), outline=(30, 64, 175), width=3)
    draw_res.rectangle([125, 200, 195, 280], fill=(255, 255, 255))
    draw_res.text((135, 235), "PURE", fill=(30, 64, 175))

    draw_res.rounded_rectangle([230, 140, 330, 350], radius=12, fill=(59, 130, 246), outline=(30, 64, 175), width=3)
    draw_res.rectangle([245, 200, 315, 280], fill=(255, 255, 255))
    draw_res.text((255, 235), "PURE", fill=(30, 64, 175))

    # Fill additional slots for complete compliance
    # Slot (1,1) SolZest
    draw_res.rounded_rectangle([440, 420, 550, 630], radius=12, fill=(249, 115, 22), outline=(194, 65, 12), width=3)
    draw_res.rectangle([460, 480, 530, 560], fill=(255, 255, 255))
    draw_res.text((465, 515), "ORANGE", fill=(194, 65, 12))

    # Slot (1,2) Chips
    draw_res.rounded_rectangle([730, 420, 850, 630], radius=8, fill=(234, 179, 8), outline=(161, 98, 7), width=3)
    draw_res.text((760, 515), "CHIPS", fill=(113, 63, 18))

    # Slot (1,3) Truffle Almonds
    draw_res.rounded_rectangle([1000, 420, 1120, 630], radius=8, fill=(168, 85, 247), outline=(126, 34, 206), width=3)
    draw_res.text((1025, 515), "ALMONDS", fill=(88, 28, 135))

    res_path = os.path.join(output_dir, "shelf_resolved_sample.jpg")
    res_img.save(res_path, quality=95)
    print(f"Saved {res_path}")

    # 3. Product Catalog Reference Images
    ref_dir = os.path.join(output_dir, "products")
    os.makedirs(ref_dir, exist_ok=True)

    products_spec = [
        ("pure_glacier.jpg", (59, 130, 246), "PureGlacier Water"),
        ("nitro_craft.jpg", (55, 65, 81), "NitroCraft Coffee"),
        ("hydro_pulse.jpg", (236, 72, 153), "HydroPulse Berry"),
        ("green_elixir.jpg", (34, 197, 94), "GreenElixir Matcha"),
        ("heritage_cola.jpg", (185, 28, 28), "Heritage Cola"),
        ("sol_zest.jpg", (249, 115, 22), "SolZest Orange"),
        ("chips.jpg", (234, 179, 8), "CrispRidge Chips"),
        ("almonds.jpg", (168, 85, 247), "Truffle Almonds"),
    ]

    for fname, color, label in products_spec:
        p_img = Image.new("RGB", (300, 400), color=(248, 250, 252))
        p_draw = ImageDraw.Draw(p_img)
        p_draw.rounded_rectangle([40, 40, 260, 360], radius=16, fill=color, outline=(30, 41, 59), width=3)
        p_draw.rectangle([60, 160, 240, 240], fill=(255, 255, 255))
        p_draw.text((70, 195), label[:16], fill=(15, 23, 42))
        p_path = os.path.join(ref_dir, fname)
        p_img.save(p_path)

    print("Generated all product reference images.")

if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "sample_data"
    generate_sample_assets(out)
