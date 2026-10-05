import os
from PIL import Image, ImageDraw

def generate_sims_icon(size: int) -> Image.Image:
    # High-resolution supersampling for smooth antialiased curves
    scale = 4
    canvas_size = size * scale
    image = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    # Colors: Blue background (#BBD6F8), Navy leaf (#0F3D7A)
    bg_color = (187, 214, 248, 255)
    leaf_color = (15, 61, 122, 255)
    leaf_fill = (15, 61, 122, 40)

    # Rounded rectangle background
    corner_radius = int(canvas_size * 0.25)
    draw.rounded_rectangle(
        [(0, 0), (canvas_size, canvas_size)],
        radius=corner_radius,
        fill=bg_color,
    )

    # Leaf shape points scaled to canvas
    # Using polygon for leaf body
    w, h = canvas_size, canvas_size
    leaf_points = [
        (int(w * 0.50), int(h * 0.78)),
        (int(w * 0.35), int(h * 0.74)),
        (int(w * 0.28), int(h * 0.62)),
        (int(w * 0.30), int(h * 0.44)),
        (int(w * 0.42), int(h * 0.28)),
        (int(w * 0.70), int(h * 0.22)),
        (int(w * 0.70), int(h * 0.48)),
        (int(w * 0.62), int(h * 0.68)),
        (int(w * 0.50), int(h * 0.78)),
    ]
    draw.polygon(leaf_points, fill=leaf_fill, outline=leaf_color, width=int(scale * 2.5))

    # Center stem line
    stem_points = [
        (int(w * 0.24), int(h * 0.80)),
        (int(w * 0.36), int(h * 0.70)),
        (int(w * 0.48), int(h * 0.54)),
        (int(w * 0.60), int(h * 0.38)),
    ]
    draw.line(stem_points, fill=leaf_color, width=int(scale * 2.5), joint="curve")

    # Downsample with Lanczos filter for smooth antialiasing
    return image.resize((size, size), Image.Resampling.LANCZOS)

def main():
    public_dir = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public"))
    os.makedirs(public_dir, exist_ok=True)

    sizes = {
        "favicon-16.png": 16,
        "favicon-32.png": 32,
        "apple-touch-icon.png": 180,
        "icon-192.png": 192,
        "icon-512.png": 512,
    }

    images = {}
    for filename, size in sizes.items():
        img = generate_sims_icon(size)
        path = os.path.join(public_dir, filename)
        img.save(path, format="PNG")
        images[size] = img
        print(f"Generated {filename} ({size}x{size})")

    # Save favicon.ico (multi-size 16, 32, 48)
    ico_path = os.path.join(public_dir, "favicon.ico")
    icon_16 = images[16]
    icon_32 = images[32]
    icon_48 = generate_sims_icon(48)
    icon_32.save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print("Generated favicon.ico (16, 32, 48)")

if __name__ == "__main__":
    main()
