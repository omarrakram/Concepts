"""The opening: a 2000s kid's room at golden hour, seen low from the carpet, a CRT
playing a cartoon (the TVScreen render, mapped onto the screen). At the
interruption the camera flies into the screen; by ROOM_END the 4:3 picture
fills the frame's width, matching the bumper's centre band for the dissolve.

The mood follows the supplied room images (docs/01-reference-breakdown.md);
every object here is original and generic: no brands, no characters, no posters
of anything real."""
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from lib import FPS, assign, bake, ease_in, ease_in_out, empty, emission, lerp, principled, rounded_box, span  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOM_END = 142
FRAMES = range(0, ROOM_END + 1)
INTO = (104, 138)  # the camera flies into the screen

# the TV (metres)
STAND = {'w': 1.3, 'd': 0.46, 'h': 0.5, 'y': 0.95}
TV = {'w': 0.78, 'h': 0.62, 'd': 0.56}
SCREEN = {'w': 0.56, 'h': 0.42}
TV_Y = STAND['y']  # TV centre (depth)
SCREEN_Z = STAND['h'] + 0.33  # screen centre height
SCREEN_Y = TV_Y - TV['d'] / 2 - 0.012  # the glass front
LENS = 40.0  # a little long: the room compressed around the set, the ceiling out of frame
BACK_Y = 1.6  # the back wall's face
WALL_H = 3.4


def tv_sequence_dir(set_name):
    return os.path.join(ROOT, 'public', 'renders', set_name, 'tv')


def build(set_name=None):
    set_name = set_name or os.environ.get('IYS_SET', 'animatic')
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 0, ROOM_END
    sc.render.fps = FPS

    w = bpy.data.worlds.new('world')
    sc.world = w
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.09, 0.06, 0.045, 1)
    w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.45

    build_shell()
    build_fairy_lights()
    build_stand_and_tv(set_name)
    lamp = build_lava_lamp()
    build_props()
    build_lights()
    cam = build_camera(sc)
    animate(sc, cam, lamp)
    return sc


# ------------------------------------------------------------------ materials


def wood():
    m = bpy.data.materials.new('wood')
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    wave = nt.nodes.new('ShaderNodeTexWave')
    wave.wave_type = 'BANDS'
    wave.inputs['Scale'].default_value = 3.0
    wave.inputs['Distortion'].default_value = 3.0
    wave.inputs['Detail'].default_value = 3.0
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (0.26, 0.12, 0.055, 1)
    ramp.color_ramp.elements[1].color = (0.42, 0.21, 0.1, 1)
    nt.links.new(wave.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = 0.42
    p.inputs['Coat Weight'].default_value = 0.35
    return m


def carpet():
    m = bpy.data.materials.new('carpet')
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    fine = nt.nodes.new('ShaderNodeTexNoise')  # the pile
    fine.inputs['Scale'].default_value = 1400.0
    fine.inputs['Detail'].default_value = 1.0
    broad = nt.nodes.new('ShaderNodeTexNoise')  # where it has been walked on
    broad.inputs['Scale'].default_value = 6.0
    broad.inputs['Detail'].default_value = 2.0
    mix = nt.nodes.new('ShaderNodeMath')
    mix.operation = 'MULTIPLY_ADD'
    nt.links.new(fine.outputs['Fac'], mix.inputs[0])
    mix.inputs[1].default_value = 0.45
    nt.links.new(broad.outputs['Fac'], mix.inputs[2])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = (0.5, 0.28, 0.3, 1)
    ramp.color_ramp.elements[1].position = 0.95
    ramp.color_ramp.elements[1].color = (0.82, 0.55, 0.52, 1)
    nt.links.new(mix.outputs['Value'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], p.inputs['Base Color'])
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.18
    bump.inputs['Distance'].default_value = 0.002
    nt.links.new(fine.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], p.inputs['Normal'])
    p.inputs['Roughness'].default_value = 0.95
    p.inputs['Sheen Weight'].default_value = 0.8
    p.inputs['Sheen Tint'].default_value = (1.0, 0.8, 0.75, 1)
    return m


def wall():
    m = bpy.data.materials.new('wall')
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    n = nt.nodes.new('ShaderNodeTexNoise')
    n.inputs['Scale'].default_value = 60.0
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (0.78, 0.47, 0.42, 1)
    ramp.color_ramp.elements[1].color = (0.86, 0.55, 0.48, 1)
    nt.links.new(n.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = 0.85
    return m


def poster(name, kind):
    """Original abstract prints (no real artwork): stars on magenta; rings on teal."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = 0.35
    tc = nt.nodes.new('ShaderNodeTexCoord')
    if kind == 'stars':
        v = nt.nodes.new('ShaderNodeTexVoronoi')
        v.feature = 'F1'
        v.inputs['Scale'].default_value = 7.0
        nt.links.new(tc.outputs['UV'], v.inputs['Vector'])
        mr = nt.nodes.new('ShaderNodeMapRange')
        mr.inputs['From Min'].default_value = 0.08
        mr.inputs['From Max'].default_value = 0.12
        nt.links.new(v.outputs['Distance'], mr.inputs['Value'])
        mix = nt.nodes.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        mix.inputs[7].default_value = (1.0, 0.85, 0.2, 1)
        mix.inputs[6].default_value = (0.75, 0.1, 0.45, 1)
        nt.links.new(mr.outputs['Result'], mix.inputs[0])
        nt.links.new(mix.outputs[2], p.inputs['Base Color'])
    elif kind == 'stripes':
        wave = nt.nodes.new('ShaderNodeTexWave')
        wave.wave_type = 'BANDS'
        wave.bands_direction = 'DIAGONAL'
        wave.inputs['Scale'].default_value = 4.0
        nt.links.new(tc.outputs['UV'], wave.inputs['Vector'])
        ramp = nt.nodes.new('ShaderNodeValToRGB')
        ramp.color_ramp.interpolation = 'CONSTANT'
        ramp.color_ramp.elements[0].color = (0.35, 0.16, 0.62, 1)
        ramp.color_ramp.elements[1].position = 0.6
        ramp.color_ramp.elements[1].color = (1.0, 0.82, 0.3, 1)
        nt.links.new(wave.outputs['Fac'], ramp.inputs['Fac'])
        nt.links.new(ramp.outputs['Color'], p.inputs['Base Color'])
    else:
        wave = nt.nodes.new('ShaderNodeTexWave')
        wave.wave_type = 'RINGS'
        wave.inputs['Scale'].default_value = 3.0
        nt.links.new(tc.outputs['UV'], wave.inputs['Vector'])
        ramp = nt.nodes.new('ShaderNodeValToRGB')
        ramp.color_ramp.interpolation = 'CONSTANT'
        ramp.color_ramp.elements[0].color = (0.05, 0.5, 0.55, 1)
        ramp.color_ramp.elements[1].position = 0.55
        ramp.color_ramp.elements[1].color = (1.0, 0.55, 0.25, 1)
        nt.links.new(wave.outputs['Fac'], ramp.inputs['Fac'])
        nt.links.new(ramp.outputs['Color'], p.inputs['Base Color'])
    return m


# ------------------------------------------------------------------ geometry


def box(name, size, loc, mat, bevel=0.01):
    o = rounded_box(name, size, bevel, segments=3, subsurf=0)
    o.location = loc
    assign(o, mat)
    return o


def build_shell():
    bpy.ops.mesh.primitive_plane_add(size=1)
    floor = bpy.context.object
    floor.name = 'floor'
    floor.scale = (8, 8, 1)
    assign(floor, carpet())
    wm = wall()
    back = box('back_wall', (6.0, 0.1, WALL_H), (0, BACK_Y + 0.05, 0), wm, 0.0)
    left = box('left_wall', (0.1, 6.0, WALL_H), (-2.3, -1.0, 0), wm, 0.0)
    right = box('right_wall', (0.1, 6.0, WALL_H), (2.3, -1.0, 0), wm, 0.0)
    # a window in the left wall, high: a hole (boolean), a cross of glazing bars, the bright evening outside.
    # The low sun comes through it and lays the window's shape across the back wall, right of the TV.
    cutter = box('window_cut', (0.4, 1.3, 1.2), (-2.3, -0.4, 0.9), wm, 0.0)
    mod = left.modifiers.new('window', 'BOOLEAN')
    mod.object = cutter
    mod.operation = 'DIFFERENCE'
    cutter.hide_render = True
    bpy.ops.mesh.primitive_plane_add(size=1)
    sky = bpy.context.object
    sky.name = 'outside'
    sky.scale = (4.0, 4.0, 1)
    sky.location = (-3.4, -0.4, 1.6)
    sky.rotation_euler = (0, math.radians(90), 0)
    assign(sky, emission('outside', (1.0, 0.72, 0.45), 3.0))
    sky.visible_shadow = False  # the sun shines through it, into the room
    frame = principled('frame', (0.92, 0.88, 0.8), roughness=0.5)
    for n, z in enumerate((0.9, 2.1)):
        box(f'sill{n}', (0.16, 1.36, 0.05), (-2.27, -0.4, z - 0.025), frame, 0.005)
    box('mullion', (0.06, 0.04, 1.2), (-2.3, -0.4, 0.9), frame, 0.0)
    box('transom', (0.06, 1.3, 0.04), (-2.3, -0.4, 1.48), frame, 0.0)
    # posters (original prints): stars left of the set, rings in the sun on the right, stripes up high
    for name, kind, loc, size in (
        ('poster_a', 'stars', (-0.92, BACK_Y - 0.004, 1.42), (0.44, 0.62)),
        ('poster_b', 'rings', (0.95, BACK_Y - 0.004, 1.5), (0.48, 0.48)),
        ('poster_c', 'stripes', (-0.2, BACK_Y - 0.004, 2.15), (0.7, 0.36)),
    ):
        bpy.ops.mesh.primitive_plane_add(size=1)
        p = bpy.context.object
        p.name = name
        p.scale = (size[0], size[1], 1)
        p.location = loc
        p.rotation_euler = (math.radians(90), 0, 0)
        assign(p, poster(name, kind))
    return back, left, right


def build_fairy_lights():
    """A string of small warm bulbs sagging across the back wall (soft bokeh in the shallow focus)."""
    bulb = emission('bulb', (1.0, 0.66, 0.32), 9.0)
    wire = principled('wire', (0.05, 0.12, 0.05), roughness=0.6)
    n, x0, x1, z0, sag = 19, -1.45, 1.45, 2.62, 0.22
    pts = []
    for i in range(n):
        u = i / (n - 1)
        x = lerp(x0, x1, u)
        z = z0 - sag * 4 * u * (1 - u)
        pts.append((x, BACK_Y - 0.03, z))
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.016, segments=12, ring_count=8, location=(x, BACK_Y - 0.03, z - 0.02))
        assign(bpy.context.object, bulb)
    cd = bpy.data.curves.new('wire', 'CURVE')
    cd.dimensions = '3D'
    cd.bevel_depth = 0.0025
    sp = cd.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for p, (x, y, z) in zip(sp.points, pts):
        p.co = (x, y, z, 1)
    wo = bpy.data.objects.new('wire', cd)
    bpy.context.collection.objects.link(wo)
    wo.data.materials.append(wire)


def screen_material(set_name):
    """The CRT glass: the TV picture (an image sequence) with a faint scanline pattern, under a glossy glass coat."""
    m = bpy.data.materials.new('crt')
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (0.01, 0.012, 0.015, 1)
    p.inputs['Roughness'].default_value = 0.08
    p.inputs['Coat Weight'].default_value = 1.0
    p.inputs['Coat Roughness'].default_value = 0.03
    tex = nt.nodes.new('ShaderNodeTexImage')
    first = os.path.join(tv_sequence_dir(set_name), '0000.png')
    if os.path.exists(first):
        img = bpy.data.images.load(first)
        img.source = 'SEQUENCE'
        tex.image = img
        tex.image_user.frame_duration = ROOM_END + 1
        tex.image_user.frame_start = 0
        tex.image_user.frame_offset = -1  # Blender counts a sequence from #1: scene frame f shows tv/f.png
        tex.image_user.use_auto_refresh = True
    tex.interpolation = 'Linear'
    uv = nt.nodes.new('ShaderNodeTexCoord')
    nt.links.new(uv.outputs['UV'], tex.inputs['Vector'])
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(uv.outputs['UV'], sep.inputs['Vector'])
    lines = nt.nodes.new('ShaderNodeMath')
    lines.operation = 'MULTIPLY'
    lines.inputs[1].default_value = math.pi * 120  # 120 line pairs: resolved in the close-up, an even dimming from across the room
    nt.links.new(sep.outputs['Y'], lines.inputs[0])
    sine = nt.nodes.new('ShaderNodeMath')
    sine.operation = 'SINE'
    nt.links.new(lines.outputs['Value'], sine.inputs[0])
    scan = nt.nodes.new('ShaderNodeMapRange')
    scan.inputs['From Min'].default_value = -1.0
    scan.inputs['From Max'].default_value = 1.0
    scan.inputs['To Min'].default_value = 0.78
    scan.inputs['To Max'].default_value = 1.0
    nt.links.new(sine.outputs['Value'], scan.inputs['Value'])
    mul = nt.nodes.new('ShaderNodeVectorMath')
    mul.operation = 'SCALE'
    nt.links.new(tex.outputs['Color'], mul.inputs[0])
    nt.links.new(scan.outputs['Result'], mul.inputs['Scale'])
    nt.links.new(mul.outputs['Vector'], p.inputs['Emission Color'])
    p.inputs['Emission Strength'].default_value = 1.1
    return m


def build_stand_and_tv(set_name):
    wd = wood()
    S = STAND
    w, dp, h, y = S['w'], S['d'], S['h'], S['y']
    front = y - dp / 2
    # an open unit: top, plinth, sides, a divider, a back panel and a shelf on the left
    box('stand_top', (w + 0.02, dp + 0.012, 0.035), (0, y - 0.006, h - 0.035), wd, 0.008)  # a slight overhang (no coplanar faces)
    box('stand_plinth', (w - 0.012, dp - 0.012, 0.045), (0, y, 0), wd, 0.006)
    for sx in (-1, 1):
        box(f'stand_side{sx}', (0.035, dp, h), (sx * (w / 2 - 0.0175), y, 0), wd, 0.006)
    box('stand_divider', (0.03, dp - 0.02, h - 0.08), (0, y, 0.045), wd, 0.004)
    box('stand_back', (w - 0.04, 0.015, h - 0.08), (0, y + dp / 2 - 0.02, 0.045), principled('stand_back', (0.16, 0.08, 0.04), roughness=0.7), 0.0)
    box('stand_shelf', (w / 2 - 0.05, dp - 0.03, 0.022), (-w / 4, y, 0.25), wd, 0.004)
    black = principled('black_plastic', (0.025, 0.025, 0.028), roughness=0.35)
    # left, upper: the VCR; left, lower: a row of tapes
    box('vcr', (0.5, 0.32, 0.085), (-w / 4, y - 0.02, 0.272), black, 0.008)
    slot = principled('slot', (0.0, 0.0, 0.0), roughness=0.9)
    box('vcr_slot', (0.24, 0.01, 0.018), (-w / 4 - 0.04, y - 0.185, 0.31), slot, 0.0)
    box('vcr_led', (0.05, 0.008, 0.014), (-w / 4 + 0.15, y - 0.185, 0.312), emission('led_green', (0.2, 1.0, 0.35), 3.0), 0.0)
    colours = [(0.5, 0.1, 0.12), (0.1, 0.18, 0.45), (0.85, 0.75, 0.2), (0.12, 0.12, 0.13), (0.15, 0.45, 0.25), (0.7, 0.3, 0.55), (0.95, 0.95, 0.92), (0.2, 0.2, 0.6)]
    for i in range(8):
        box(f'tape{i}', (0.035, 0.19, 0.115), (-w / 2 + 0.09 + i * 0.039, y - 0.04, 0.047), principled(f'tape{i}', colours[i], roughness=0.45), 0.003).rotation_euler = (0, math.radians(4 if i == 7 else 0), 0)
    # right: the console and its controller cable, a few games
    box('console', (0.26, 0.22, 0.075), (w / 4 - 0.04, y - 0.04, 0.047), principled('console', (0.42, 0.4, 0.62), roughness=0.4, coat=0.3), 0.02)
    box('console_led', (0.012, 0.006, 0.006), (w / 4 + 0.06, front + 0.071, 0.09), emission('led_blue', (0.3, 0.6, 1.0), 4.0), 0.0)
    for i, c in enumerate([(0.1, 0.12, 0.15), (0.6, 0.12, 0.15), (0.12, 0.35, 0.6)]):
        box(f'game{i}', (0.14, 0.19, 0.016), (w / 4 + 0.02 + 0.01 * i, y - 0.03, 0.125 + 0.017 * i), principled(f'game{i}', c, roughness=0.35), 0.002).rotation_euler = (0, 0, math.radians(6 - 5 * i))

    # the CRT: a deep dark body, a recessed bulged screen, a grille, buttons and a power light
    T = TV
    body = principled('tv_body', (0.5, 0.51, 0.55), metallic=0.35, roughness=0.36, coat=0.3)
    box('tv_body', (T['w'], T['d'], T['h']), (0, TV_Y, S['h']), body, 0.035)
    box('tv_back', (T['w'] * 0.7, 0.3, T['h'] * 0.75), (0, TV_Y + T['d'] / 2 + 0.1, S['h'] + 0.06), body, 0.06)
    bezel = principled('tv_bezel', (0.06, 0.06, 0.068), roughness=0.45)
    box('tv_bezel', (SCREEN['w'] + 0.06, 0.02, SCREEN['h'] + 0.06), (0, TV_Y - T['d'] / 2 - 0.002, SCREEN_Z - (SCREEN['h'] + 0.06) / 2), bezel, 0.02)
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=24, y_subdivisions=18, size=1)
    scr = bpy.context.object
    scr.name = 'screen'
    for v in scr.data.vertices:  # bulge: a CRT's convex glass
        x, y = v.co.x * 2, v.co.y * 2
        v.co.z = 0.022 * (1 - 0.5 * (x * x + y * y))
    scr.scale = (SCREEN['w'], SCREEN['h'], 1)
    scr.rotation_euler = (math.radians(90), 0, 0)
    scr.location = (0, SCREEN_Y + 0.004, SCREEN_Z)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for poly in scr.data.polygons:
        poly.use_smooth = True
    assign(scr, screen_material(set_name))
    grille = principled('grille', (0.12, 0.12, 0.13), roughness=0.8)
    for i in range(5):
        box(f'grille{i}', (0.36, 0.01, 0.006), (0, TV_Y - T['d'] / 2 - 0.004, S['h'] + 0.035 + i * 0.012), grille, 0.0)
    for i in range(3):
        box(f'button{i}', (0.025, 0.01, 0.012), (0.24 + i * 0.035, TV_Y - T['d'] / 2 - 0.004, S['h'] + 0.045), principled('button', (0.15, 0.15, 0.16), roughness=0.4), 0.003)
    box('power_led', (0.008, 0.006, 0.008), (0.34, TV_Y - T['d'] / 2 - 0.005, S['h'] + 0.046), emission('led_red', (1.0, 0.15, 0.1), 6.0), 0.0)
    # the TV's own light on the room (follows the picture's overall colour, see animate())
    d = bpy.data.lights.new('screen_light', 'AREA')
    d.size = 0.56
    d.size_y = 0.42
    d.shape = 'RECTANGLE'
    d.energy = 14.0
    d.color = (0.6, 0.8, 1.0)
    o = bpy.data.objects.new('screen_light', d)
    bpy.context.collection.objects.link(o)
    o.location = (0, SCREEN_Y - 0.03, SCREEN_Z)
    o.rotation_euler = (math.radians(90), 0, 0)
    o.visible_camera = False
    o.visible_glossy = False


def build_lava_lamp():
    S, T = STAND, TV
    base_z = S['h'] + T['h']
    x, y = 0.22, TV_Y - 0.05
    gold = principled('lamp_metal', (0.9, 0.7, 0.35), metallic=1.0, roughness=0.25)
    bpy.ops.mesh.primitive_cone_add(radius1=0.06, radius2=0.035, depth=0.1, location=(x, y, base_z + 0.05))
    assign(bpy.context.object, gold)
    bpy.ops.mesh.primitive_cone_add(radius1=0.045, radius2=0.03, depth=0.24, location=(x, y, base_z + 0.22), vertices=48)
    glass = bpy.context.object
    glass.name = 'lamp_glass'
    for poly in glass.data.polygons:
        poly.use_smooth = True
    assign(glass, principled('lamp_liquid', (1.0, 0.3, 0.55), roughness=0.1, emission=(1.0, 0.28, 0.5), emission_strength=1.2))
    blobs = []
    wax = emission('wax', (1.0, 0.6, 0.25), 3.5)
    for i in range(3):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.016 + 0.006 * i, location=(x, y, base_z + 0.14 + 0.05 * i), segments=24, ring_count=12)
        b = bpy.context.object
        b.name = f'wax{i}'
        assign(b, wax)
        blobs.append(b)
    bpy.ops.mesh.primitive_cone_add(radius1=0.03, radius2=0.012, depth=0.05, location=(x, y, base_z + 0.365))
    assign(bpy.context.object, gold)
    d = bpy.data.lights.new('lamp_light', 'POINT')
    d.color = (1.0, 0.35, 0.55)
    d.energy = 6.0
    d.shadow_soft_size = 0.05
    lo = bpy.data.objects.new('lamp_light', d)
    bpy.context.collection.objects.link(lo)
    lo.location = (x, y - 0.06, base_z + 0.22)
    return {'blobs': blobs, 'x': x, 'y': y, 'z': base_z}


def sphere(name, r, loc, mat, scale=(1, 1, 1), segs=32):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=segs, ring_count=segs // 2)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    for poly in o.data.polygons:
        poly.use_smooth = True
    assign(o, mat)
    return o


def build_props():
    """The floor in front of the set (generic, unbranded): breakfast, the remote, a CD, a controller,
    a teddy, an inflatable chair, magazines. The nearest are soft in the shallow focus."""
    # a cereal bowl (orange) with bright rings, lower left, close to the camera
    bx, by = -0.24, -0.5
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.11, segments=48, ring_count=24, location=(bx, by, 0.11))
    bowl = bpy.context.object
    bowl.name = 'bowl'
    for v in bowl.data.vertices:
        if v.co.z > 0.0:
            v.co.z = 0.0
    sol = bowl.modifiers.new('wall', 'SOLIDIFY')
    sol.thickness = 0.008
    for poly in bowl.data.polygons:
        poly.use_smooth = True
    bowl.location.z = 0.11
    assign(bowl, principled('bowl', (1.0, 0.5, 0.1), roughness=0.25, coat=0.6))
    sphere('milk', 0.104, (bx, by, 0.088), principled('milk', (0.95, 0.92, 0.86), roughness=0.2), scale=(1, 1, 0.02))
    ring_cols = [(1.0, 0.2, 0.25), (1.0, 0.8, 0.15), (0.3, 0.75, 0.3), (0.35, 0.45, 1.0), (1.0, 0.5, 0.1), (0.75, 0.3, 0.85)]
    mats = [principled(f'cereal{i}', c, roughness=0.6) for i, c in enumerate(ring_cols)]
    for i in range(34):
        a = i * 2.39996
        r = 0.085 * math.sqrt((i + 0.5) / 34)
        bpy.ops.mesh.primitive_torus_add(major_radius=0.015, minor_radius=0.0065, major_segments=12, minor_segments=6, location=(bx + r * math.cos(a), by + r * math.sin(a), 0.094 + 0.005 * (i % 3)), rotation=(math.radians(20 * (i % 5)), math.radians(35 * (i % 4)), 0))
        assign(bpy.context.object, mats[i % len(mats)])
    spoon = principled('spoon', (0.85, 0.85, 0.88), metallic=1.0, roughness=0.2)
    box('spoon', (0.012, 0.16, 0.006), (bx + 0.05, by - 0.02, 0.105), spoon, 0.003).rotation_euler = (math.radians(-18), 0, math.radians(30))

    # the remote, the CD (iridescent), the controller
    box('remote', (0.05, 0.19, 0.022), (0.26, -0.4, 0.0), principled('remote', (0.03, 0.03, 0.035), roughness=0.4), 0.01).rotation_euler = (0, 0, math.radians(-28))
    for i, c in enumerate([(0.85, 0.2, 0.2), (0.95, 0.85, 0.85), (0.2, 0.75, 0.3)]):
        box(f'remote_btn{i}', (0.012, 0.012, 0.006), (0.26 + 0.03 * math.sin(math.radians(28)) * (i - 1), -0.4 + 0.03 * math.cos(math.radians(28)) * (i - 1), 0.022), principled(f'rbtn{i}', c, roughness=0.4), 0.004)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.0015, vertices=64, location=(0.08, -0.58, 0.001))
    cd = bpy.context.object
    cd.name = 'cd'
    cdm = principled('cd', (0.85, 0.86, 0.9), metallic=1.0, roughness=0.12)
    cdm.node_tree.nodes['Principled BSDF'].inputs['Thin Film Thickness'].default_value = 520.0
    assign(cd, cdm)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.0075, depth=0.002, vertices=24, location=(0.08, -0.58, 0.0015))
    assign(bpy.context.object, principled('cd_hole', (0.5, 0.28, 0.3), roughness=0.9))
    pad = principled('pad', (0.42, 0.25, 0.75), roughness=0.35, coat=0.4)
    for sx in (-1, 1):
        sphere(f'pad_grip{sx}', 0.055, (0.4 + sx * 0.07, 0.08, 0.03), pad, scale=(1.0, 0.8, 0.45), segs=24)
    box('pad_mid', (0.14, 0.07, 0.04), (0.4, 0.09, 0.005), pad, 0.02)
    box('pad_cable', (0.006, 0.6, 0.006), (0.4, 0.42, 0.0), principled('cable', (0.08, 0.08, 0.1), roughness=0.5), 0.002)

    # a teddy on the floor, left of the stand, leaning on it
    fur = principled('fur', (0.62, 0.38, 0.2), roughness=0.9)
    fur.node_tree.nodes['Principled BSDF'].inputs['Sheen Weight'].default_value = 1.0
    fur.node_tree.nodes['Principled BSDF'].inputs['Sheen Tint'].default_value = (1.0, 0.85, 0.7, 1)
    tx, ty = -0.8, 0.62
    sphere('teddy_body', 0.13, (tx, ty, 0.13), fur, scale=(1.0, 0.85, 1.15))
    sphere('teddy_head', 0.1, (tx, ty - 0.02, 0.33), fur)
    for sx in (-1, 1):
        sphere(f'teddy_ear{sx}', 0.04, (tx + sx * 0.075, ty, 0.41), fur)
        sphere(f'teddy_arm{sx}', 0.045, (tx + sx * 0.13, ty - 0.05, 0.17), fur, scale=(0.8, 0.8, 1.5))
        sphere(f'teddy_leg{sx}', 0.055, (tx + sx * 0.07, ty - 0.1, 0.05), fur, scale=(0.9, 1.4, 0.8))
        sphere(f'teddy_eye{sx}', 0.012, (tx + sx * 0.035, ty - 0.11, 0.35), principled('bead', (0.01, 0.01, 0.01), roughness=0.15))
    sphere('teddy_muzzle', 0.04, (tx, ty - 0.1, 0.31), principled('muzzle', (0.85, 0.7, 0.52), roughness=0.9), scale=(1.1, 0.8, 0.8))
    sphere('teddy_nose', 0.013, (tx, ty - 0.135, 0.325), principled('nose', (0.05, 0.03, 0.03), roughness=0.3))

    # an inflatable chair, pink and see-through, at the right edge
    pvc = principled('pvc', (1.0, 0.35, 0.65), roughness=0.12, coat=0.8)
    pvc.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value = 0.45
    for i, (z, r, minor) in enumerate([(0.12, 0.34, 0.12), (0.34, 0.3, 0.1)]):
        bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=minor, major_segments=48, minor_segments=16, location=(0.92, 0.2, z))
        t = bpy.context.object
        t.name = f'chair_ring{i}'
        for poly in t.data.polygons:
            poly.use_smooth = True
        assign(t, pvc)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.26, minor_radius=0.1, major_segments=48, minor_segments=16, location=(0.92, 0.45, 0.42), rotation=(math.radians(72), 0, 0))
    back = bpy.context.object
    back.name = 'chair_back'
    for poly in back.data.polygons:
        poly.use_smooth = True
    assign(back, pvc)

    # magazines and a cushion on the right of the stand
    for i, c in enumerate([(0.2, 0.55, 0.85), (0.95, 0.4, 0.5), (0.95, 0.85, 0.3), (0.5, 0.3, 0.7)]):
        box(f'mag{i}', (0.22, 0.29, 0.012), (0.66 + 0.01 * i, 0.62 - 0.012 * i, 0.012 * i), principled(f'mag{i}', c, roughness=0.3, coat=0.3), 0.002).rotation_euler = (0, 0, math.radians(8 - 7 * i))
    sphere('cushion', 0.2, (-0.52, -0.12, 0.08), principled('cushion', (0.38, 0.72, 0.75), roughness=0.85), scale=(1.1, 0.95, 0.4))


def build_lights():
    # the low golden sun through the window: across the TV's top, onto the back wall at its right
    d = bpy.data.lights.new('sun', 'SUN')
    d.energy = 9.0
    d.color = (1.0, 0.62, 0.32)
    d.angle = math.radians(3.0)
    sun = bpy.data.objects.new('sun', d)
    bpy.context.collection.objects.link(sun)
    direction = Vector((1.0, 0.6, -0.15))
    sun.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    # a soft warm fill from behind the camera, so the shadows are not black
    f = bpy.data.lights.new('fill', 'AREA')
    f.size = 2.5
    f.energy = 48.0
    f.color = (1.0, 0.72, 0.58)
    fo = bpy.data.objects.new('fill', f)
    bpy.context.collection.objects.link(fo)
    fo.location = (0.6, -3.4, 1.5)
    fo.rotation_euler = (Vector((0, 0.9, 0.7)) - Vector(fo.location)).to_track_quat('-Z', 'Y').to_euler()


def build_camera(sc):
    d = bpy.data.cameras.new('cam')
    d.lens = LENS
    d.sensor_fit = 'HORIZONTAL'
    d.sensor_width = 36
    d.clip_start = 0.01
    d.dof.use_dof = True
    d.dof.aperture_fstop = 2.8
    cam = bpy.data.objects.new('cam', d)
    bpy.context.collection.objects.link(cam)
    sc.camera = cam
    target = empty('cam_target', (0, SCREEN_Y, ROOM_LOOK_Z))
    tr = cam.constraints.new('TRACK_TO')
    tr.target = target
    tr.track_axis = 'TRACK_NEGATIVE_Z'
    tr.up_axis = 'UP_Y'
    focus = empty('cam_focus', (0, SCREEN_Y, SCREEN_Z))
    d.dof.focus_object = focus
    return {'cam': cam, 'target': target}


ROOM_LOOK_Z = 0.6  # in the room the camera looks almost level, a touch up at the set (a child's view)


def animate(sc, cam, lamp):
    F = FRAMES
    # the screen fills the frame's width at the end of the flight in
    fill_dist = (SCREEN['w'] / 2) / math.tan(math.atan(18.0 / LENS))
    start, drift = (0.05, SCREEN_Y - 1.95, 0.44), (0.03, SCREEN_Y - 1.7, 0.48)

    def cam_loc(f):
        if f <= INTO[0]:
            t = ease_in_out(span(f, 0, INTO[0]), 1.6)
            return tuple(lerp(a, b, t) for a, b in zip(start, drift))
        t = ease_in(span(f, *INTO), 2.6)
        end = (0.0, SCREEN_Y - fill_dist, SCREEN_Z)
        return tuple(lerp(a, b, t) for a, b in zip(drift, end))

    bake(cam['cam'], 'location', F, cam_loc)
    # as it flies in, the camera comes level with the screen's centre
    bake(cam['target'], 'location', F, lambda f: (0, SCREEN_Y, lerp(ROOM_LOOK_Z, SCREEN_Z, ease_in_out(span(f, *INTO), 2.0))))
    # depth of field: shallow in the room, none inside the screen
    d = cam['cam'].data
    for f in F:
        d.dof.aperture_fstop = lerp(2.8, 22.0, span(f, INTO[0] + 10, INTO[1]))
        d.keyframe_insert('dof.aperture_fstop', frame=f)
    # the lava lamp's wax drifts
    for i, b in enumerate(lamp['blobs']):
        bake(b, 'location', F, lambda f, i=i: (lamp['x'] + 0.008 * math.sin(f / 23 + i), lamp['y'], lamp['z'] + 0.16 + 0.05 * i + 0.035 * math.sin(f / (31 + 7 * i) + 2 * i)))
    # the TV's light on the room: cartoon-bright, a flash as the bumper cuts in (the room flickers), then its blue
    sl = bpy.data.objects['screen_light'].data
    flash = {96: 80.0, 97: 42.0, 98: 28.0, 99: 22.0}
    for f in F:
        sl.color = (0.75, 0.9, 1.0) if f < 96 else (0.35, 0.6, 1.0)
        sl.energy = 14.0 if f < 96 else flash.get(f, 18.0)
        sl.keyframe_insert('color', frame=f)
        sl.keyframe_insert('energy', frame=f)
