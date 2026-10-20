"""
Run Blender with this script while the Tripo Bridge add-on is enabled:

    blender --python avatar-export/tools/tripo_capture.py

Then press "DCC Bridge" in Tripo Studio. As soon as the model has finished
importing, this script saves an untouched copy of it to
avatar-source/tripo_model.glb (and tripo_model.blend) in the repo root.
"""

import os
import time

import bpy

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_DIR = os.path.join(REPO, "avatar-source")
STABLE_SECONDS = 6.0

_initial = {o.name for o in bpy.data.objects}
_state = {"names": None, "since": 0.0, "done": False}


def _tick():
    if _state["done"]:
        return None
    new = sorted(o.name for o in bpy.data.objects if o.name not in _initial)
    has_mesh = any(bpy.data.objects[n].type == "MESH" for n in new)
    if not has_mesh:
        return 2.0
    if new != _state["names"]:
        _state["names"], _state["since"] = new, time.time()
        print(f"[tripo_capture] receiving: {len(new)} new objects")
        return 2.0
    if time.time() - _state["since"] < STABLE_SECONDS:
        return 2.0

    os.makedirs(OUT_DIR, exist_ok=True)
    for o in bpy.context.view_layer.objects:
        o.select_set(o.name in new)
    glb = os.path.join(OUT_DIR, "tripo_model.glb")
    bpy.ops.export_scene.gltf(filepath=glb, export_format="GLB", use_selection=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT_DIR, "tripo_model.blend"), copy=True)
    _state["done"] = True
    msg = f"[tripo_capture] SAVED {glb} ({os.path.getsize(glb)} bytes)"
    print(msg)
    with open(os.path.join(OUT_DIR, "CAPTURED.txt"), "w") as f:
        f.write(msg + "\n")
    return None


bpy.app.timers.register(_tick, first_interval=2.0, persistent=True)
print("[tripo_capture] waiting for a model from Tripo DCC Bridge ...")
