"""Shared helpers for the Blender scenes: easing, per-frame keyframe baking,
materials and primitives, and the render settings. No add-ons, no assets:
everything is built from code."""
import math

import bpy

FPS = 30


# ------------------------------------------------------------------ easing
def clamp01(x):
    return max(0.0, min(1.0, x))


def lerp(a, b, t):
    return a + (b - a) * t


def smooth(t):
    t = clamp01(t)
    return t * t * (3 - 2 * t)


def ease_in(t, p=2.0):
    return clamp01(t) ** p


def ease_out(t, p=2.0):
    return 1 - (1 - clamp01(t)) ** p


def ease_in_out(t, p=2.0):
    t = clamp01(t)
    return 0.5 * (2 * t) ** p if t < 0.5 else 1 - 0.5 * (2 * (1 - t)) ** p


def back_out(t, s=1.7):
    """Overshoots, then settles (cartoon timing)."""
    t = clamp01(t) - 1
    return 1 + (s + 1) * t ** 3 + s * t ** 2


def span(f, a, b):
    """0 before frame a, 1 after frame b, linear in between."""
    return clamp01((f - a) / (b - a))


def spring(t, freq=3.0, damp=4.0):
    """A damped oscillation that starts at 1 (t in seconds)."""
    if t < 0:
        return 0.0
    return math.exp(-damp * t) * math.cos(2 * math.pi * freq * t)


def keys(points, f, ease=smooth):
    """Piecewise interpolation through (frame, value) points; values are numbers or tuples."""
    if f <= points[0][0]:
        return points[0][1]
    for (f0, v0), (f1, v1) in zip(points, points[1:]):
        if f0 <= f <= f1:
            t = ease((f - f0) / (f1 - f0)) if f1 > f0 else 1.0
            if isinstance(v0, tuple):
                return tuple(lerp(a, b, t) for a, b in zip(v0, v1))
            return lerp(v0, v1, t)
    return points[-1][1]


# ------------------------------------------------------------------ baking
def bake(target, path, frames, fn):
    """Key target.path on every frame from fn(frame), linear between keys (the motion is all in fn)."""
    for f in frames:
        setattr(target, path, fn(f))
        target.keyframe_insert(path, frame=f)
    linear(target)


def bake_flag(target, path, frames, fn):
    """Key a boolean (e.g. hide_render) on every frame, held (constant interpolation)."""
    for f in frames:
        setattr(target, path, bool(fn(f)))
        target.keyframe_insert(path, frame=f)
    ad = target.animation_data
    if ad and ad.action:
        for fc in ad.action.fcurves:
            if fc.data_path == path:
                for kp in fc.keyframe_points:
                    kp.interpolation = 'CONSTANT'


def bake_socket(socket, frames, fn):
    """Key a shader node socket's value on every frame."""
    for f in frames:
        socket.default_value = fn(f)
        socket.keyframe_insert('default_value', frame=f)
    linear(socket.id_data)


def linear(idblock):
    ad = getattr(idblock, 'animation_data', None)
    if not ad or not ad.action:
        return
    for fc in ad.action.fcurves:
        for kp in fc.keyframe_points:
            if kp.interpolation != 'CONSTANT':
                kp.interpolation = 'LINEAR'


# ------------------------------------------------------------------ materials and primitives
def principled(name, color=(0.8, 0.8, 0.8), metallic=0.0, roughness=0.3, emission=None, emission_strength=0.0, coat=0.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metallic
    p.inputs['Roughness'].default_value = roughness
    if coat:
        p.inputs['Coat Weight'].default_value = coat
        p.inputs['Coat Roughness'].default_value = 0.05
    if emission:
        p.inputs['Emission Color'].default_value = (*emission, 1)
        p.inputs['Emission Strength'].default_value = emission_strength
    if alpha < 1:
        p.inputs['Alpha'].default_value = alpha
    return m


def emission(name, color, strength=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (*color, 1)
    em.inputs['Strength'].default_value = strength
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return m


def assign(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def rounded_box(name, size, bevel, segments=6, origin_bottom=True, subsurf=1):
    """A box with rounded edges, origin at the centre of its base."""
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if origin_bottom:
        for v in o.data.vertices:
            v.co.z += size[2] / 2
    b = o.modifiers.new('bevel', 'BEVEL')
    b.width = bevel
    b.segments = segments
    b.limit_method = 'NONE'
    if subsurf:
        s = o.modifiers.new('subsurf', 'SUBSURF')
        s.levels = subsurf
        s.render_levels = subsurf
    smooth_shade(o)
    return o


def smooth_shade(o):
    for p in o.data.polygons:
        p.use_smooth = True


def empty(name, location=(0, 0, 0)):
    o = bpy.data.objects.new(name, None)
    o.location = location
    bpy.context.collection.objects.link(o)
    o.empty_display_size = 0.2
    return o


# ------------------------------------------------------------------ render
def setup_render(scene, width, height, samples, motion_blur=True, transparent=False):
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = samples
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.05  # the flat studio and walls converge early; OIDN does the rest
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = 'OPENIMAGEDENOISE'
    scene.cycles.max_bounces = 5
    scene.cycles.diffuse_bounces = 2
    scene.cycles.glossy_bounces = 2
    scene.cycles.transmission_bounces = 2
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    scene.cycles.blur_glossy = 1.0
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.use_motion_blur = motion_blur
    scene.render.motion_blur_shutter = 0.5
    scene.render.film_transparent = transparent
    scene.render.use_persistent_data = True
    scene.render.fps = FPS
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA' if transparent else 'RGB'
    scene.render.image_settings.compression = 40
    # period CGI: plain sRGB, punchy colours, no filmic roll-off
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = 0.0
    scene.view_settings.gamma = 1.0
