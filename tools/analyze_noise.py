import sys, os
from PIL import Image
import numpy as np

def noise_map(arr):
    """High-frequency noise = |pixel - local 3x3 median|, averaged. Catches static/dot-matrix."""
    from scipy.ndimage import median_filter
    med = median_filter(arr.astype(float), size=(3,3,1))
    return np.abs(arr.astype(float) - med).mean(axis=2)

def analyze(path, rows=40, cols=18):
    im = Image.open(path).convert("RGB")
    arr = np.asarray(im).astype(int)
    h, w, _ = arr.shape
    nm = noise_map(arr)
    print(f"Image: {os.path.basename(path)} ({w}x{h}) mean RGB({arr[...,0].mean():.0f},{arr[...,1].mean():.0f},{arr[...,2].mean():.0f})")
    BH = h // rows
    BW = w // cols
    print("Noise grid (higher = staticky):")
    for r in range(rows):
        vals = []
        for c in range(cols):
            blk = nm[r*BH:(r+1)*BH, c*BW:(c+1)*BW]
            vals.append(f"{blk.mean():4.1f}")
        print(f"r{r:02d}(y{r*BH:4d}): " + " ".join(vals))
    print()

if __name__ == "__main__":
    for p in sys.argv[1:]:
        if os.path.exists(p):
            analyze(p)
        else:
            print(f"NOT FOUND: {p}")
