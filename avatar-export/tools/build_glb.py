"""
Build avatar-neck-lipsync.glb from two renders of the avatar: a front view and a
side (profile) view.

The head/bust is reconstructed as a closed 3D surface from the two silhouettes
(front gives width, side gives depth and the real nose/lip/chin profile), and
textured by projecting both renders onto it. It is skinned to Spine -> Neck ->
Head, has a split lip line with an inner mouth (cavity + teeth), a hinged-jaw
`jawOpen` morph and a few more ARKit-named mouth morphs.

Usage (from the repo root):
    python avatar-export/tools/build_glb.py avatar-export/source/front.webp avatar-export/source/side.webp avatar-export/avatar-neck-lipsync.glb

Needs only numpy + opencv-python. No Blender.
Pixel landmarks below were measured on source/front.webp (1114x873) and
source/side.webp (1053x844, the avatar faces image-left, i.e. we see her left side).
"""

import json
import struct
import sys

import cv2
import numpy as np

# ---------------------------------------------------------------- landmarks (px)
# front view
F_CROP = (240, 920, 158, 738)          # x0, x1, y0, y_last_clean
MID_X = 583                            # facial midline
SLIT_Y = 578                           # where the lips meet
SLIT_L, SLIT_R = 530, 637              # mouth corners
CY0, CY1, STEP = 158, 800, 3           # rows of the model; CY0 + 3*140 == SLIT_Y
# side view
S_CROP = (250, 990, 150, 708)
ZC = 530                               # side-view column of the vertical axis
# front row -> side row (top of hair, eyes, lips, chin, shoulders)
ROW_MAP_F = [170, 425, 578, 670, 738]
ROW_MAP_S = [165, 395, 553, 640, 708]

SCALE = 0.063 / 140                    # metres per px (eye centres are 140 px apart)
SUPER = 2.6                            # cross-section superellipse exponent

# skeleton (front rows, side columns)
SPINE_Y, NECK_Y, HEAD_Y = 770, 705, 600
NECK_ZC = 480                          # side column of the neck centre
JAW_HINGE = (515, 500)                 # (front row, side column) of the jaw hinge
JAW_ANGLE = 0.20                       # radians at jawOpen = 1


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def gauss(x, y, cx, cy, sx, sy):
    return np.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2))


def side_row(py):
    return np.interp(py, ROW_MAP_F, ROW_MAP_S, left=None, right=None) + \
        np.where(py > ROW_MAP_F[-1], py - ROW_MAP_F[-1], 0) * 0 + \
        np.where(py < ROW_MAP_F[0], py - ROW_MAP_F[0], 0)


# ---------------------------------------------------------------- segmentation
def segment(img, crop):
    """Foreground mask of a render on Tripo's grey vignette background."""
    x0, x1, y0, y1 = crop
    sub = img[y0:y1 + 1, x0:x1]
    h, w = sub.shape[:2]
    lum = cv2.cvtColor(sub, cv2.COLOR_BGR2GRAY).astype(np.float64)
    yy, xx = np.mgrid[0:h, 0:w] / np.array([h, w])[:, None, None]
    band = np.zeros((h, w), bool)
    band[:12, :] = True
    band[:h - 100, :12] = True
    band[:h - 100, -12:] = True
    A = np.stack([np.ones_like(xx), xx, yy, xx * xx, yy * yy, xx * yy], -1)
    coef, *_ = np.linalg.lstsq(A[band], lum[band], rcond=None)
    bg = A @ coef
    sm = cv2.GaussianBlur(lum, (5, 5), 0)
    var = np.sqrt(np.maximum(cv2.GaussianBlur(lum * lum, (7, 7), 0) - cv2.GaussianBlur(lum, (7, 7), 0) ** 2, 0))
    fg = ((sm < bg - 9) | (sm > bg + 14) | (var > 5.5)).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(fg, 4)
    fg = (lab == 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)
    inv = 1 - fg
    n, lab, stats, _ = cv2.connectedComponentsWithStats(inv, 4)
    for i in range(1, n):
        x, y, ww, hh, _ = stats[i]
        if x > 0 and y > 0 and x + ww < w and y + hh < h:
            fg[lab == i] = 1
    full = np.zeros(img.shape[:2], np.uint8)
    full[y0:y1 + 1, x0:x1] = fg
    # below the last clean row, repeat it (the UI toolbar covers the chest)
    full[y1 + 1:, x0:x1] = fg[-1]
    return full


def fill_background(img, mask, crop):
    """Inpaint background pixels inside the crop so gaps in the hair don't print grey."""
    x0, x1, y0, y1 = crop
    sub = img[y0:y1 + 1, x0:x1].copy()
    hole = (1 - mask[y0:y1 + 1, x0:x1]).astype(np.uint8) * 255
    out = img.copy()
    out[y0:y1 + 1, x0:x1] = cv2.inpaint(sub, hole, 6, cv2.INPAINT_TELEA)
    return out


def extend_down(img, y_last):
    out = img.copy()
    out[y_last + 1:] = img[y_last]
    return out


def row_extents(mask, rows, axis_lo_is_front):
    """For each row: (min col, max col) of the mask, smoothed over rows."""
    lo = np.full(len(rows), np.nan)
    hi = np.full(len(rows), np.nan)
    for i, r in enumerate(rows):
        r = int(round(min(max(r, 0), mask.shape[0] - 1)))
        cols = np.nonzero(mask[r])[0]
        if len(cols) > 4:
            lo[i], hi[i] = cols.min(), cols.max()
    ok = ~np.isnan(lo)
    for arr in (lo, hi):
        arr[~ok] = np.interp(np.nonzero(~ok)[0], np.nonzero(ok)[0], arr[ok]) if ok.any() else 0
        k = cv2.GaussianBlur(cv2.medianBlur(arr.astype(np.float32).reshape(-1, 1), 5), (1, 7), 0).ravel()
        arr[:] = k
    return lo, hi, ok


# ---------------------------------------------------------------- the shape
class Head:
    def __init__(self, fmask, smask):
        self.rows = np.arange(CY0, CY1 + 1, STEP, dtype=np.float64)
        fl, fr, fok = row_extents(fmask, self.rows, True)
        srows = side_row(self.rows)
        sf, sb, sok = row_extents(smask, srows, True)
        valid = fok & sok
        first = int(np.argmax(valid))
        self.first = first
        self.aL = np.maximum((MID_X - fl) * SCALE, 0.004)
        self.aR = np.maximum((fr - MID_X) * SCALE, 0.004)
        raw_front = (ZC - sf) * SCALE                 # includes nose / lips / chin
        # smooth "skull" front: 1-D morphological opening removes thin protrusions
        k = 17
        pad = np.pad(raw_front, k, mode="edge")
        ero = np.array([pad[i:i + 2 * k + 1].min() for i in range(len(raw_front))])
        pad = np.pad(ero, k, mode="edge")
        opened = np.array([pad[i:i + 2 * k + 1].max() for i in range(len(raw_front))])
        self.bF = np.maximum(opened, 0.004)
        self.excess = cv2.GaussianBlur(np.clip(raw_front - opened, 0, None).reshape(-1, 1), (1, 7), 0).ravel()
        self.bB = np.maximum((sb - ZC) * SCALE, 0.004)

    def _rowvals(self, py):
        r = self.rows
        return (np.interp(py, r, self.aL), np.interp(py, r, self.aR),
                np.interp(py, r, self.bF), np.interp(py, r, self.bB),
                np.interp(py, r, self.excess))

    def point(self, th, py):
        aL, aR, bF, bB, ex = self._rowvals(py)
        s, c = np.sin(th), np.cos(th)
        e = 2.0 / SUPER
        x = np.where(s >= 0, aR, aL) * np.sign(s) * np.abs(s) ** e
        z = np.where(c >= 0, bF, bB) * np.sign(c) * np.abs(c) ** e
        front = np.clip(c, 0, 1) ** 2
        xp = x / SCALE                                   # px from the midline
        # nose / lips / chin protrusions measured on the profile, localised in x
        width = np.interp(py, [440, 530, 562, 620, 680], [17.0, 18.0, 44.0, 48.0, 56.0])
        z += ex * np.exp(-(xp / width) ** 2) * front
        z -= 0.006 * (gauss(xp, py, -71, 425, 28, 18) + gauss(xp, py, 69, 425, 28, 18)) * front
        return np.stack([x, (CY1 - py) * SCALE, z], -1)


# ---------------------------------------------------------------- texture bake
def bake_texture(head, front, fmask, side, smask, tw=2048, th_=1024):
    u = (np.arange(tw) + 0.5) / tw
    v = (np.arange(th_) + 0.5) / th_
    U, V = np.meshgrid(u, v)
    TH = (U - 0.5) * 2 * np.pi
    PY = CY0 + V * (CY1 - CY0)
    P = head.point(TH, PY)
    d = 1e-3
    Pt = head.point(TH + d, PY) - head.point(TH - d, PY)
    Py = head.point(TH, PY + 0.5) - head.point(TH, PY - 0.5)
    N = np.cross(Pt, Py)                    # outward for increasing theta, downward rows
    N /= np.maximum(np.linalg.norm(N, axis=-1, keepdims=True), 1e-12)
    N *= np.sign(np.sum(N * np.stack([P[..., 0], np.zeros_like(PY), P[..., 2]], -1), -1, keepdims=True) + 1e-12)

    fx = (MID_X + P[..., 0] / SCALE).astype(np.float32)
    fy = PY.astype(np.float32)
    sx = (ZC - P[..., 2] / SCALE).astype(np.float32)
    sy = side_row(PY).astype(np.float32)
    fcol = cv2.remap(front, fx, fy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE).astype(np.float32)
    scol = cv2.remap(side, sx, sy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE).astype(np.float32)
    fv = cv2.remap(fmask.astype(np.float32), fx, fy, cv2.INTER_LINEAR)
    sv = cv2.remap(smask.astype(np.float32), sx, sy, cv2.INTER_LINEAR)

    # the front render owns the whole front half; the profile only paints the
    # far sides and the back, so the two views never ghost over the face
    wf = smoothstep(0.02, 0.32, N[..., 2])
    col = fcol * wf[..., None] + scol * (1 - wf[..., None])
    ok, jpg = cv2.imencode(".jpg", col.clip(0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 92])
    assert ok
    return jpg.tobytes()


# ---------------------------------------------------------------- mesh
def theta_columns():
    front = np.linspace(-np.pi / 3, np.pi / 3, 161)            # 0.75 deg in front
    back = np.linspace(np.pi / 3, 2 * np.pi - np.pi / 3, 97)[1:-1]
    back = np.where(back > np.pi, back - 2 * np.pi, back)
    return np.sort(np.concatenate([front, back]))


def skin_weights(P, py):
    nz = (ZC - NECK_ZC) * SCALE
    d = np.hypot(P[:, 0], P[:, 2] - nz) / SCALE
    col = d < 66
    head = np.where(col, 1 - smoothstep(625, 685, py), 1 - smoothstep(700, 726, py))
    spine = np.where(col, smoothstep(698, 735, py), smoothstep(712, 736, py))
    neck = np.clip(1 - head - spine, 0, 1)
    w = np.stack([spine, neck, head, np.zeros_like(py)], -1)
    return (w / w.sum(1, keepdims=True)).astype(np.float32)


def jaw_rotate(P, amount):
    hy = (CY1 - JAW_HINGE[0]) * SCALE
    hz = (ZC - JAW_HINGE[1]) * SCALE
    a = JAW_ANGLE * amount
    dz, dy = P[:, 2] - hz, P[:, 1] - hy
    out = P.copy()
    out[:, 2] = hz + dz * np.cos(a) + dy * np.sin(a)
    out[:, 1] = hy - dz * np.sin(a) + dy * np.cos(a)
    return out


def face_morphs(P, py, th, below):
    xp = P[:, 0] / SCALE
    front = smoothstep(0.15, 0.6, np.cos(th))
    corner = np.clip(1 - (xp / 49.0) ** 2, 0, 1) ** 1.4   # oval opening; zero before the last split column, so corners stay sealed
    k = smoothstep(0, 30, py - SLIT_Y)
    lateral = 1 - smoothstep(58, 95, np.abs(xp))
    jaw = below * front * lateral * (1 - smoothstep(672, 712, py))
    f = jaw * (corner + (1 - corner) * k)
    upper = (below < 0.5) & (py > 556) & (py <= SLIT_Y)
    lift = corner * np.clip(1 - (SLIT_Y - py) / 22.0, 0, 1) * upper * front

    opened = jaw_rotate(P, 1.0) - P
    out = {}
    jo = opened * f[:, None]
    jo[:, 1] += 0.0012 * lift
    out["jawOpen"] = jo
    lips = gauss(xp, py, 0, 580, 62, 30) * front
    fun = 0.35 * opened * f[:, None]
    fun[:, 0] += -0.35 * P[:, 0] * lips
    fun[:, 2] += 0.004 * lips
    out["mouthFunnel"] = fun
    puck = np.zeros_like(P)
    puck[:, 0] = -0.45 * P[:, 0] * lips
    puck[:, 2] = 0.006 * lips
    out["mouthPucker"] = puck
    for name, cx, sgn in (("mouthSmileLeft", SLIT_R - MID_X, 1), ("mouthSmileRight", SLIT_L - MID_X, -1)):
        g = gauss(xp, py, cx, SLIT_Y, 16, 14) * front
        m = np.zeros_like(P)
        m[:, 0] = 0.002 * sgn * g
        m[:, 1] = 0.0035 * g
        m[:, 2] = -0.001 * g
        out[name] = m
    close = -opened * (f * (1 - k))[:, None] * 0.85
    out["mouthClose"] = close
    return {n: v.astype(np.float32) for n, v in out.items()}


def build_face(head):
    th = theta_columns()
    rows = head.rows[head.first:]
    slit_r = int(round((SLIT_Y - rows[0]) / STEP))
    assert abs(rows[slit_r] - SLIT_Y) < 1e-6
    ncol = len(th)
    TH, PY = np.meshgrid(th, rows)
    P = head.point(TH, PY)
    xs_slit = P[slit_r, :, 0] / SCALE
    in_slit = (np.cos(th) > 0.5) & (xs_slit > SLIT_L - MID_X) & (xs_slit < SLIT_R - MID_X)

    pos = list(P.reshape(-1, 3))
    vth = list(TH.ravel()); vpy = list(PY.ravel())
    below = list((PY.ravel() > SLIT_Y).astype(np.float64))
    idx_of = lambda r, c: r * ncol + (c % ncol)
    dup = {}
    for c in np.nonzero(in_slit)[0]:
        dup[c] = len(pos)
        pos.append(P[slit_r, c]); vth.append(th[c]); vpy.append(rows[slit_r]); below.append(1.0)

    tris = []
    for r in range(len(rows) - 1):
        for c in range(ncol):
            a, b = idx_of(r, c), idx_of(r, c + 1)
            if r == slit_r:
                a = dup.get(c, a); b = dup.get((c + 1) % ncol, b)
            d, e = idx_of(r + 1, c), idx_of(r + 1, c + 1)
            tris += [a, d, b, b, d, e]
    # caps
    top = len(pos); pos.append(np.array([0, (CY1 - rows[0]) * SCALE + 0.004, P[0, :, 2].mean()]))
    vth.append(0.0); vpy.append(rows[0] - 2); below.append(0.0)
    bot = len(pos); pos.append(np.array([0, (CY1 - rows[-1]) * SCALE, P[-1, :, 2].mean()]))
    vth.append(0.0); vpy.append(rows[-1]); below.append(0.0)
    last = len(rows) - 1
    for c in range(ncol):
        tris += [top, idx_of(0, c), idx_of(0, c + 1)]
        tris += [bot, idx_of(last, c + 1), idx_of(last, c)]

    pos = np.array(pos, np.float64)
    vth = np.array(vth); vpy = np.array(vpy); below = np.array(below)
    idx = np.array(tris, np.uint32)
    # fix winding so faces point outward
    t = idx.reshape(-1, 3)
    n = np.cross(pos[t[:, 1]] - pos[t[:, 0]], pos[t[:, 2]] - pos[t[:, 0]])
    cen = pos[t].mean(1)
    outward = np.sum(n * np.stack([cen[:, 0], np.zeros(len(cen)), cen[:, 2] - pos[:, 2].mean()], -1), 1)
    if np.median(outward) < 0:
        t[:, [1, 2]] = t[:, [2, 1]]
    idx = t.ravel().astype(np.uint32)

    uv = np.stack([(vth / (2 * np.pi)) + 0.5, (vpy - CY0) / (CY1 - CY0)], -1)
    uv = np.clip(uv, 0, 1).astype(np.float32)
    # seam at theta = +-pi: the last column wraps to the first, which has u ~ 0;
    # duplicate it with u = 1 so the back of the head doesn't smear the whole atlas
    t = idx.reshape(-1, 3)
    seam = {}
    for tri in t:
        us = uv[tri, 0]
        if us.max() - us.min() > 0.5:
            for j in range(3):
                vi = tri[j]
                if uv[vi, 0] < 0.25:
                    if vi not in seam:
                        seam[vi] = len(pos)
                        pos = np.vstack([pos, pos[vi]]); uv = np.vstack([uv, [[1.0, uv[vi, 1]]]])
                        vth = np.append(vth, np.pi); vpy = np.append(vpy, vpy[vi]); below = np.append(below, below[vi])
                    tri[j] = seam[vi]
    idx = t.ravel().astype(np.uint32)

    joints = np.tile(np.array([0, 1, 2, 0], np.uint8), (len(pos), 1))
    weights = skin_weights(pos, vpy)
    morphs = face_morphs(pos, vpy, vth, below)
    return dict(pos=pos.astype(np.float32), uv=uv.astype(np.float32), idx=idx,
                joints=joints, weights=weights, morphs=morphs)


def build_mouth(head):
    """Dark mouth cavity + upper/lower teeth, set inside the closed lips."""
    th = theta_columns()
    P = head.point(th, np.full_like(th, SLIT_Y))
    xs = P[:, 0] / SCALE
    sel = np.nonzero((np.cos(th) > 0.5) & (xs > SLIT_L - MID_X + 3) & (xs < SLIT_R - MID_X - 3))[0]
    t0, t1 = th[sel.min()], th[sel.max()]
    parts = []

    def patch(ta, tb, y0, y1, inset, color, jaw):
        T, Y = np.meshgrid(np.linspace(ta, tb, 16), np.linspace(y0, y1, 5))
        T = T.ravel(); Y = Y.ravel()
        p = head.point(T, Y)
        radial = np.stack([p[:, 0], np.zeros_like(T), p[:, 2] - 0.0], -1)
        radial /= np.linalg.norm(radial, axis=1, keepdims=True)
        p = p - radial * inset
        n0 = sum(len(q["pos"]) for q in parts)
        tri = []
        for r in range(4):
            for c in range(15):
                a = n0 + r * 16 + c
                tri += [a, a + 16, a + 1, a + 1, a + 16, a + 17]
        # jaw: 1 = moves fully with the jaw, "split" = lower half follows the jaw
        w = smoothstep(SLIT_Y - 2, SLIT_Y + 16, Y) if jaw == "split" else float(bool(jaw))
        dj = (jaw_rotate(p, 1.0) - p) * np.reshape(w, (-1, 1))
        rowfrac = np.repeat(np.linspace(0, 1, 5), 16)
        colfrac = np.tile(np.linspace(0, 1, 16), 5)
        shade = (0.7 + 0.3 * np.sin(np.pi * rowfrac)) * (0.75 + 0.25 * np.sin(np.pi * colfrac))
        parts.append(dict(pos=p, idx=tri, col=np.array(color)[None, :] * shade[:, None], jaw=dj))

    patch(t0, t1, SLIT_Y - 10, SLIT_Y + 38, 0.013, (0.11, 0.035, 0.035), "split")
    mid = (t0 + t1) / 2; half = (t1 - t0) / 2
    patch(mid - half * 0.5, mid + half * 0.5, SLIT_Y - 2, SLIT_Y + 6, 0.0055, (0.78, 0.74, 0.69), False)
    patch(mid - half * 0.45, mid + half * 0.45, SLIT_Y + 5, SLIT_Y + 11, 0.0065, (0.70, 0.66, 0.61), True)

    pos = np.concatenate([p["pos"] for p in parts]).astype(np.float32)
    col = np.concatenate([np.hstack([p["col"], np.ones((len(p["pos"]), 1))]) for p in parts]).astype(np.float32)
    idx = np.array(sum((p["idx"] for p in parts), []), np.uint32)
    # face the cavity toward the viewer
    t = idx.reshape(-1, 3)
    n = np.cross(pos[t[:, 1]] - pos[t[:, 0]], pos[t[:, 2]] - pos[t[:, 0]])
    if np.median(n[:, 2]) < 0:
        t[:, [1, 2]] = t[:, [2, 1]]
    jaw = np.concatenate([p["jaw"] for p in parts]).astype(np.float32)
    n = len(pos)
    return dict(pos=pos, col=col, idx=t.ravel().astype(np.uint32),
                joints=np.tile(np.array([2, 0, 0, 0], np.uint8), (n, 1)),
                weights=np.tile(np.array([1, 0, 0, 0], np.float32), (n, 1)),
                morphs={"jawOpen": jaw})


def normals(pos, idx):
    tri = idx.reshape(-1, 3)
    fn = np.cross(pos[tri[:, 1]] - pos[tri[:, 0]], pos[tri[:, 2]] - pos[tri[:, 0]])
    n = np.zeros_like(pos)
    for i in range(3):
        np.add.at(n, tri[:, i], fn)
    ln = np.linalg.norm(n, axis=1, keepdims=True)
    return np.where(ln > 0, n / np.maximum(ln, 1e-12), [0, 0, 1]).astype(np.float32)


# ---------------------------------------------------------------- glTF writer
class Writer:
    def __init__(self):
        self.bin = bytearray()
        self.views, self.accessors = [], []

    def view(self, data, target=None):
        while len(self.bin) % 4:
            self.bin.append(0)
        v = {"buffer": 0, "byteOffset": len(self.bin), "byteLength": len(data)}
        if target:
            v["target"] = target
        self.bin += data
        self.views.append(v)
        return len(self.views) - 1

    def acc(self, arr, ctype, atype, target=None, minmax=False):
        a = {"bufferView": self.view(arr.tobytes(), target), "componentType": ctype,
             "count": int(arr.shape[0]), "type": atype}
        if minmax:
            a["min"] = [float(x) for x in arr.min(0)]
            a["max"] = [float(x) for x in arr.max(0)]
        self.accessors.append(a)
        return len(self.accessors) - 1

    def sparse_vec3(self, arr):
        nz = np.nonzero(np.abs(arr).max(1) > 1e-7)[0].astype(np.uint32)
        a = {"componentType": 5126, "count": int(arr.shape[0]), "type": "VEC3",
             "min": [float(x) for x in np.minimum(arr.min(0), 0)],
             "max": [float(x) for x in np.maximum(arr.max(0), 0)]}
        if len(nz):
            a["sparse"] = {"count": int(len(nz)),
                           "indices": {"bufferView": self.view(nz.tobytes()), "componentType": 5125},
                           "values": {"bufferView": self.view(arr[nz].astype(np.float32).tobytes())}}
        self.accessors.append(a)
        return len(self.accessors) - 1


def main(front_path, side_path, dst):
    front = cv2.imread(front_path, cv2.IMREAD_COLOR)
    side = cv2.imread(side_path, cv2.IMREAD_COLOR)
    if front is None or side is None:
        sys.exit("cannot read the input renders")
    fmask = segment(front, F_CROP)
    smask = segment(side, S_CROP)
    front = extend_down(fill_background(front, fmask, F_CROP), F_CROP[3])
    side = extend_down(fill_background(side, smask, S_CROP), S_CROP[3])

    head = Head(fmask, smask)
    face = build_face(head)
    mouth = build_mouth(head)
    jpg = bake_texture(head, front, fmask, side, smask)

    W = Writer()
    ARRAY, ELEMENT = 34962, 34963

    def primitive(m, material, extra):
        attrs = {"POSITION": W.acc(m["pos"], 5126, "VEC3", ARRAY, minmax=True),
                 "NORMAL": W.acc(normals(m["pos"], m["idx"]), 5126, "VEC3", ARRAY),
                 "JOINTS_0": W.acc(m["joints"], 5121, "VEC4", ARRAY),
                 "WEIGHTS_0": W.acc(m["weights"], 5126, "VEC4", ARRAY)}
        attrs.update(extra)
        names = list(m["morphs"])
        prim = {"attributes": attrs, "indices": W.acc(m["idx"], 5125, "SCALAR", ELEMENT), "material": material,
                "targets": [{"POSITION": W.sparse_vec3(m["morphs"][k])} for k in names]}
        return {"primitives": [prim], "weights": [0.0] * len(names), "extras": {"targetNames": names}}

    face_mesh = primitive(face, 0, {"TEXCOORD_0": W.acc(face["uv"], 5126, "VEC2", ARRAY)})
    face_mesh["name"] = "AvatarFace"
    mouth_mesh = primitive(mouth, 1, {"COLOR_0": W.acc(mouth["col"], 5126, "VEC4", ARRAY)})
    mouth_mesh["name"] = "AvatarMouth"
    img_view = W.view(jpg)

    bz = (ZC - NECK_ZC) * SCALE
    spine_w = np.array([0, (CY1 - SPINE_Y) * SCALE, bz])
    neck_w = np.array([0, (CY1 - NECK_Y) * SCALE, bz])
    head_w = np.array([0, (CY1 - HEAD_Y) * SCALE, bz])
    ibm = []
    for p in (spine_w, neck_w, head_w):
        m = np.eye(4, dtype=np.float32)
        m[:3, 3] = -p
        ibm.append(m.T.ravel())
    ibm_acc = W.acc(np.array(ibm, np.float32), 5126, "MAT4")

    nodes = [
        {"name": "AvatarRoot", "children": [1, 2, 3]},
        {"name": "AvatarFace", "mesh": 0, "skin": 0},
        {"name": "AvatarMouth", "mesh": 1, "skin": 0},
        {"name": "Spine", "translation": [float(x) for x in spine_w], "children": [4]},
        {"name": "Neck", "translation": [float(x) for x in neck_w - spine_w], "children": [5]},
        {"name": "Head", "translation": [float(x) for x in head_w - neck_w]},
    ]
    gltf = {
        "asset": {"version": "2.0", "generator": "avatar-export/tools/build_glb.py",
                  "extras": {"description": "Avatar bust reconstructed from front + side renders: Spine/Neck/Head bones, ARKit-named mouth morph targets."}},
        "extensionsUsed": ["KHR_materials_unlit"],
        "scene": 0,
        "scenes": [{"name": "Avatar", "nodes": [0]}],
        "nodes": nodes,
        "meshes": [face_mesh, mouth_mesh],
        "skins": [{"name": "AvatarSkin", "joints": [3, 4, 5], "skeleton": 3, "inverseBindMatrices": ibm_acc}],
        "materials": [
            {"name": "AvatarSkinHair",
             "pbrMetallicRoughness": {"baseColorTexture": {"index": 0}, "metallicFactor": 0.0, "roughnessFactor": 1.0},
             "extensions": {"KHR_materials_unlit": {}}},
            {"name": "AvatarMouthInterior",
             "pbrMetallicRoughness": {"baseColorFactor": [1, 1, 1, 1], "metallicFactor": 0.0, "roughnessFactor": 1.0},
             "extensions": {"KHR_materials_unlit": {}}},
        ],
        "textures": [{"source": 0, "sampler": 0}],
        "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 33071, "wrapT": 33071}],
        "images": [{"name": "avatar_atlas", "bufferView": img_view, "mimeType": "image/jpeg"}],
        "accessors": W.accessors,
        "bufferViews": W.views,
        "buffers": [{"byteLength": 0}],
    }
    while len(W.bin) % 4:
        W.bin.append(0)
    gltf["buffers"][0]["byteLength"] = len(W.bin)
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * ((4 - len(js) % 4) % 4)
    total = 12 + 8 + len(js) + 8 + len(W.bin)
    with open(dst, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack("<II", len(W.bin), 0x004E4942)); f.write(W.bin)
    print(f"wrote {dst}: {total} bytes")
    print(f"face verts {len(face['pos'])}, tris {len(face['idx']) // 3}; mouth verts {len(mouth['pos'])}")
    print("morphs:", list(face["morphs"]))


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    main(*sys.argv[1:])
