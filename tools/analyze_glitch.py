import sys, os
from PIL import Image
import numpy as np

def analyze(path):
    im = Image.open(path).convert("RGB")
    arr = np.asarray(im).astype(int)
    h, w, _ = arr.shape
    print(f"Image: {path}  ({w}x{h})")
    print(f"Mean color: RGB({arr[...,0].mean():.0f},{arr[...,1].mean():.0f},{arr[...,2].mean():.0f})")
    unique = len(np.unique(arr.reshape(-1, 3), axis=0))
    print(f"Unique colors: {unique}")

    BLOCK = 80
    by = h // BLOCK
    bx = w // BLOCK
    print("\nBlock stddev grid (x blocks):")
    for gy in range(by):
        row = []
        for gx in range(bx):
            blk = arr[gy*BLOCK:(gy+1)*BLOCK, gx*BLOCK:(gx+1)*BLOCK]
            row.append(f"{blk.std():6.1f}")
        print(f"y{gx}: " + " ".join(row))

    # Find the most "noisy" blocks (high stddev but low saturation = dot-matrix; high chroma = colored static)
    print("\nTop 10 noisiest blocks:")
    entries = []
    for gy in range(by):
        for gx in range(bx):
            blk = arr[gy*BLOCK:(gy+1)*BLOCK, gx*BLOCK:(gx+1)*BLOCK]
            sd = blk.std()
            mx = blk.max(axis=2).mean()
            mn = blk.min(axis=2).mean()
            chroma = (mx - mn)
            entries.append((sd, gy, gx, blk.mean(axis=(0,1)).astype(int), chroma))
    entries.sort(reverse=True)
    for sd, gy, gx, mean, chroma in entries[:10]:
        print(f"  block y={gy} x={gx} stddev={sd:.1f} meanRGB={tuple(mean)} chroma={chroma:.1f}")

if __name__ == "__main__":
    for p in sys.argv[1:]:
        if os.path.exists(p):
            analyze(p)
        else:
            print(f"NOT FOUND: {p}")
