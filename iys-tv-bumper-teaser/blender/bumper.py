"""The bumper: a deep-blue studio, a chrome cube character, a glowing orange
ball, and the turn: the cube swallows the ball and becomes the IN YOUR SHOE
shoebox. Built and animated entirely from this script, on the master
timeline's frame numbers (30 fps): the bumper runs from BUMPER_START to END.

Motion grammar from the supplied ident (docs/01-reference-breakdown.md): a
tiny cube far away hops in, stretches tall, lands flat, pops up close with a
face; rubbery squash and stretch; a locked-off, centred camera; a radial
studio with a glossy floor and a soft contact shadow. Everything else is
original: the chrome character, the ball, the lid, the box."""
import math
import os
import sys

import bpy
from mathutils import Euler, Matrix, Vector

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from lib import (FPS, assign, back_out, bake, bake_flag, bake_socket, clamp01, ease_in, ease_in_out, ease_out, empty, emission, keys, lerp,  # noqa: E402
                 principled, rounded_box, smooth, span, spring)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = os.path.join(ROOT, 'assets', 'brand')

BUMPER_START = 96
END = 449
FRAMES = range(BUMPER_START, END + 1)

CUBE = 1.6  # edge of the character cube
BODY_H = 1.25  # the body below the lid seam
LID_H = CUBE - BODY_H
BEVEL0 = 0.28  # the toy-like rounding of the character
BEVEL1 = 0.045  # the shoebox's crisp edge
BOX_SCALE = (1.6, 1.0, 0.62)  # cube → shoebox proportions
SPOT = (0.0, 1.4)  # where the character stands (x, y)
BALL_R = 0.3

# ------------------------------------------------------------------ timeline
LID_SWAP = 222  # the one-piece cube is swapped for body + lid (just before it opens)
LID_OPEN = (224, 230)
BALL_IN = 233  # the ball's top passes under the rim
LID_SHUT = (234, 238)
SWEEP = (300, 318)  # the orange light sweep: chrome → black lacquer
MORPH = (304, 322)  # cube → shoebox
TURN = (330, 350)  # the box turns to face the camera
WORD_SWEEP = (338, 354)  # the wordmark is revealed on the front
LIFT = (362, 378)  # the lid lifts: light spills out
DIM = (346, 380)  # the studio darkens
GLOW = 1.15  # the studio's glow behind the character


def lid_lift(f):
    """How far the lid has lifted, in the character's own (unscaled) units."""
    return 0.17 * ease_out(span(f, *LIFT), 2.0)


def hop_state(f):
    """(y, z, air-stretch) for the hops in from the distance."""
    segs = [(96, 110, 14.0, 11.0, 0.9, 0.16), (110, 124, 11.0, 8.0, 0.9, 0.16), (124, 138, 8.0, 5.2, 0.95, 0.18), (138, 148, 5.2, SPOT[1], 1.9, 0.5)]
    for a, b, y0, y1, h, st in segs:
        if a <= f < b:
            t = (f - a) / (b - a)
            return lerp(y0, y1, ease_in_out(t, 1.4)), h * 4 * t * (1 - t), 1 + st * math.sin(math.pi * t)
    if f < 96:
        return 14.0, 0.0, 1.0
    return SPOT[1], 0.0, 1.0


LANDINGS = [  # frame, squash amount, wobble frequency (Hz), damping
    (110, 0.22, 3.0, 7.0),
    (124, 0.22, 3.0, 7.0),
    (138, 0.25, 3.0, 7.0),
    (148, 0.48, 2.2, 4.5),  # the big flat landing, then the pop up with a face
    (198, 0.16, 3.2, 6.0),  # the ball lands on its head
    (216, 0.3, 2.6, 5.0),  # lands from the spin
    (238, 0.26, 2.8, 4.0),  # gulp
    (290, 0.12, 2.6, 6.0),  # the ident "lock" settle
]


def squash(f):
    """Vertical scale: air stretch × landing squash (damped wobble)."""
    sz = hop_state(f)[2]
    if 204 <= f < 216:  # the spin hop
        t = (f - 204) / 12
        sz *= 1 + 0.28 * math.sin(math.pi * t)
    for fr, amount, freq, damp in LANDINGS:
        if f >= fr:
            sz *= 1 - amount * spring((f - fr) / FPS, freq, damp)
    return sz


CYC_WALL, CYC_R = 15.0, 10.0  # the studio's back wall and the radius of the curve up into it (build_studio)


def floor_at(y):
    """(height, slope in degrees) of the studio floor at depth y: flat, then curving up into the wall."""
    d = clamp01((y - (CYC_WALL - CYC_R)) / CYC_R)
    a = math.asin(d)
    return CYC_R * (1 - math.cos(a)), math.degrees(a)


def hero_location(f):
    y, z, _ = hop_state(f)
    x = 0.0
    if 204 <= f < 216:
        z = 0.5 * 4 * ((f - 204) / 12) * (1 - (f - 204) / 12)
    # far away the cube is up on the curve of the cyclorama: it hops down it, out of the glow
    return (x, y, z + floor_at(y)[0])


def spin(f):
    """Rotation about Z (degrees): look at the ball, spin, then the 3/4 'logo' pose, then face front."""
    deg = keys([(0, 0.0), (170, 0.0), (180, 16.0), (204, 16.0), (216, 376.0), (226, 360.0), (272, 360.0), (288, 332.0), (TURN[0], 332.0), (TURN[1], 360.0)], f, ease_in_out)
    return deg


def tilt(f):
    """(pitch, roll) in degrees: looks up at the ball, small idle sways."""
    pitch = keys([(0, 0.0), (186, 0.0), (192, -8.0), (198, -8.0), (202, 0.0), (226, 0.0), (230, -6.0), (236, -6.0), (240, 0.0), (256, 0.0), (260, 5.0), (268, 5.0), (274, 0.0)], f)
    pitch += floor_at(hop_state(f)[0])[1]  # stands square on the curve (tips toward us as it rises into the wall)
    roll = 0.0
    if 156 <= f < 296:
        roll = 3.0 * math.sin(2 * math.pi * (f - 156) / 44) * clamp01((f - 156) / 10) * (1 - span(f, 280, 296))
    return pitch, roll


def morph(f):
    return back_out(span(f, *MORPH), 1.3)


def hero_scale(f):
    sz = squash(f)
    sxy = 1 / math.sqrt(max(sz, 0.05))  # squash and stretch keep the volume
    m = morph(f)
    return (lerp(sxy, BOX_SCALE[0], m), lerp(sxy, BOX_SCALE[1], m), lerp(sz, BOX_SCALE[2], m))


# ------------------------------------------------------------------ the face
def face_size(f):
    """The face pops up with the cube (149–156) and sinks away before the logo pose (278–294)."""
    return back_out(span(f, 149, 156), 1.6) * (1 - ease_in_out(span(f, 278, 294)))


def eye_open(f):
    """1 open, ~0 shut: blinks at 166 and 262; wide open at the gulp."""
    o = 1.0
    for b in (166, 262):
        if b - 2 <= f <= b + 3:
            o = min(o, keys([(b - 2, 1.0), (b, 0.05), (b + 1, 0.05), (b + 3, 1.0)], f))
    o *= 1 + 0.18 * span(f, 236, 239) * (1 - span(f, 250, 256))
    return o


def eye_look(f):
    """Where the pupils point, (x, z) in -1..1: at us, the ball rolling in (from our right), up at it, down at itself."""
    return keys([
        (0, (0.0, 0.0)), (158, (0.0, 0.0)), (170, (0.9, -0.35)), (184, (0.75, -0.4)), (190, (0.3, 0.8)), (198, (0.0, 1.0)),
        (204, (0.0, 1.0)), (216, (0.0, 0.7)), (226, (0.0, 0.9)), (236, (0.0, 0.4)), (242, (0.0, 0.0)), (250, (0.0, -0.9)),
        (258, (-0.6, -0.6)), (266, (0.6, -0.6)), (274, (0.0, -0.2)), (282, (0.0, 0.0)),
    ], f)


def mouth_shape(f):
    """The smile's (width, height) scale: bigger when it is pleased, gone while it says "o"."""
    happy = keys([(0, 1.0), (152, 1.0), (158, 1.25), (166, 1.0), (196, 1.0), (200, 1.2), (210, 1.0)], f)
    shown = 1 - span(f, 236, 238) * (1 - span(f, 255, 258))
    return (max(1e-3, (0.9 + 0.1 * happy) * shown), max(1e-3, happy * shown))


def gulp_o(f):
    """The "o" of the gulp (237–257)."""
    return back_out(span(f, 237, 241), 1.8) * (1 - span(f, 253, 257))


# ------------------------------------------------------------------ the ball
def ball_location(f):
    """Rolls in from our right (166–186), arcs up onto the head (186–198), bounces high off it and falls into the
    opened top (198–236)."""
    y = SPOT[1]
    if f < 186:
        return (lerp(3.0, 1.25, ease_out(span(f, 166, 186), 1.6)), y, BALL_R)
    if f < 198:
        t = span(f, 186, 198)
        top = CUBE * squash(198)
        return (lerp(1.25, 0.0, ease_in_out(t, 1.3)), y, lerp(BALL_R, top + BALL_R, t) + 0.8 * 4 * t * (1 - t))
    # one bounce off the (squashed) head, 1.9 high, timed so its fall passes under the opened rim at BALL_IN
    z0 = CUBE * squash(198) + BALL_R
    rim = BODY_H - BALL_R
    H = 1.9
    u_in = (1 + math.sqrt(1 + 4 * (z0 - rim) / (4 * H))) / 2
    u = (f - 198) / ((BALL_IN - 198) / u_in)
    return (0.0, y, z0 + 4 * H * u * (1 - u))


def ball_rotation(f):
    rolled = lerp(3.0, 1.25, ease_out(span(f, 166, 186), 1.6)) - 3.0
    return (0.0, -rolled / BALL_R, 0.0)


def sweep(f):
    """The sweep front, in the character's own x (−0.8 … 0.8 across the box)."""
    return lerp(-1.3, 1.3, ease_in_out(span(f, *SWEEP), 1.6))


def front_point(f, local):
    """Where a point given in the character's own (unscaled) space is in the world at frame f."""
    p, r = tilt(f)
    m = Matrix.Translation(Vector(hero_location(f))) @ Euler((math.radians(p), math.radians(r), math.radians(spin(f))), 'XYZ').to_matrix().to_4x4() @ Matrix.Diagonal((*hero_scale(f), 1.0))
    return tuple(m @ Vector(local))


def link_lights(parts, mono, lights):
    """The rim and the softboxes light the character only: no hot spots on the floor."""
    coll = bpy.data.collections.new('hero_surfaces')
    for o in (parts['cube'], parts['body'], parts['lid'], mono):
        coll.objects.link(o)
    for lo in [lights['rim'], *lights['cards']]:
        lo.light_linking.receiver_collection = coll


# ------------------------------------------------------------------ studio and lights
def build_studio():
    """A cyclorama: a floor that curves up into a back wall, no horizon; glossy blue,
    with a soft glow behind the subject (the ident's bright centre) fading to deep blue."""
    import bmesh

    me = bpy.data.meshes.new('cyc')
    bm = bmesh.new()
    prof = []  # (y, z) profile: floor, quarter-circle fillet, wall
    y_front, y_wall, r = -12.0, CYC_WALL, CYC_R
    for i in range(12):
        prof.append((lerp(y_front, y_wall - r, i / 11), 0.0))
    for i in range(1, 25):
        a = (math.pi / 2) * i / 24
        prof.append((y_wall - r + r * math.sin(a), r - r * math.cos(a)))
    for i in range(1, 8):
        prof.append((y_wall, r + 26.0 * i / 7))
    xs = [lerp(-30, 30, i / 30) for i in range(31)]
    grid = [[bm.verts.new((x, y, z)) for (y, z) in prof] for x in xs]
    for i in range(len(xs) - 1):
        for j in range(len(prof) - 1):
            bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new('studio', me)
    bpy.context.collection.objects.link(o)
    for p in me.polygons:
        p.use_smooth = True

    m = bpy.data.materials.new('studio')
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (0.025, 0.09, 0.28, 1)
    p.inputs['Roughness'].default_value = 0.3
    p.inputs['Specular IOR Level'].default_value = 0.6
    tc = nt.nodes.new('ShaderNodeTexCoord')
    glow_at = nt.nodes.new('ShaderNodeVectorMath')
    glow_at.operation = 'DISTANCE'
    glow_at.inputs[1].default_value = (0.0, 15.0, 5.0)
    nt.links.new(tc.outputs['Object'], glow_at.inputs[0])
    fall = nt.nodes.new('ShaderNodeMapRange')
    fall.inputs['From Min'].default_value = 0.0
    fall.inputs['From Max'].default_value = 15.0
    fall.inputs['To Min'].default_value = 1.0
    fall.inputs['To Max'].default_value = 0.0
    nt.links.new(glow_at.outputs['Value'], fall.inputs['Value'])
    powr = nt.nodes.new('ShaderNodeMath')
    powr.operation = 'POWER'
    powr.inputs[1].default_value = 1.5
    nt.links.new(fall.outputs['Result'], powr.inputs[0])
    strength = nt.nodes.new('ShaderNodeMath')
    strength.operation = 'MULTIPLY'
    strength.name = 'glow_strength'
    strength.inputs[1].default_value = GLOW  # its core stays pale cyan, not blown to white
    nt.links.new(powr.outputs['Value'], strength.inputs[0])
    p.inputs['Emission Color'].default_value = (0.42, 0.74, 1.0, 1)
    nt.links.new(strength.outputs['Value'], p.inputs['Emission Strength'])
    m.cycles.emission_sampling = 'NONE'  # a huge, dim emitter: reached by bounces, not sampled as a light (much faster)
    assign(o, m)
    return {'obj': o, 'glow': strength.inputs[1]}


def build_lights():
    """A big soft key from above, a cool fill, a warm orange rim; and, seen only in the chrome, three softboxes."""
    def area(name, loc, target, size, energy, color):
        d = bpy.data.lights.new(name, 'AREA')
        d.shape = 'DISK'
        d.size = size
        d.energy = energy
        d.color = color
        o = bpy.data.objects.new(name, d)
        bpy.context.collection.objects.link(o)
        o.location = loc
        o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        return o

    key = area('key', (0.0, -1.5, 6.5), (0.0, 1.4, 0.6), 4.5, 900.0, (1.0, 0.98, 0.95))
    fill = area('fill', (-4.5, -2.5, 2.2), (0.0, 1.4, 0.8), 3.0, 260.0, (0.72, 0.84, 1.0))
    rim = area('rim', (4.5, 3.0, 4.5), (0.0, 1.4, 0.8), 2.0, 620.0, (1.0, 0.55, 0.2))

    def card(name, loc, target, size, strength, color, gradient=False, radial=False):
        """An emissive panel seen only in reflections (a studio softbox for the chrome)."""
        bpy.ops.mesh.primitive_plane_add(size=1)
        o = bpy.context.object
        o.name = name
        o.scale = (size[0], size[1], 1)
        o.location = loc
        direction = Vector(target) - Vector(loc)
        o.rotation_euler = direction.to_track_quat('Z', 'Y').to_euler()
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        nt = m.node_tree
        for n in list(nt.nodes):
            nt.nodes.remove(n)
        out = nt.nodes.new('ShaderNodeOutputMaterial')
        em = nt.nodes.new('ShaderNodeEmission')
        em.inputs['Color'].default_value = (*color, 1)
        em.inputs['Strength'].default_value = strength
        if gradient:  # bright at the top, dark at the bottom
            tc = nt.nodes.new('ShaderNodeTexCoord')
            sep = nt.nodes.new('ShaderNodeSeparateXYZ')
            nt.links.new(tc.outputs['Generated'], sep.inputs['Vector'])
            mr = nt.nodes.new('ShaderNodeMapRange')
            mr.inputs['From Min'].default_value = 0.15
            mr.inputs['From Max'].default_value = 0.95
            mr.inputs['To Min'].default_value = 0.0
            mr.inputs['To Max'].default_value = strength
            nt.links.new(sep.outputs['Y'], mr.inputs['Value'])
            nt.links.new(mr.outputs['Result'], em.inputs['Strength'])
        if radial:  # strength × (0.25 + 0.75 (1 − r²)²), r from the centre (0) to the edge (1)
            tc = nt.nodes.new('ShaderNodeTexCoord')
            ctr = nt.nodes.new('ShaderNodeVectorMath')
            ctr.operation = 'MULTIPLY_ADD'
            nt.links.new(tc.outputs['Generated'], ctr.inputs[0])
            ctr.inputs[1].default_value = (2.0, 2.0, 0.0)
            ctr.inputs[2].default_value = (-1.0, -1.0, 0.0)
            r2 = nt.nodes.new('ShaderNodeVectorMath')
            r2.operation = 'DOT_PRODUCT'
            nt.links.new(ctr.outputs['Vector'], r2.inputs[0])
            nt.links.new(ctr.outputs['Vector'], r2.inputs[1])
            inv = nt.nodes.new('ShaderNodeMath')
            inv.operation = 'SUBTRACT'
            inv.use_clamp = True
            inv.inputs[0].default_value = 1.0
            nt.links.new(r2.outputs['Value'], inv.inputs[1])
            sq = nt.nodes.new('ShaderNodeMath')
            sq.operation = 'POWER'
            nt.links.new(inv.outputs['Value'], sq.inputs[0])
            sq.inputs[1].default_value = 2.0
            ramp = nt.nodes.new('ShaderNodeMapRange')
            ramp.inputs['From Min'].default_value = 0.0
            ramp.inputs['From Max'].default_value = 1.0
            ramp.inputs['To Min'].default_value = 0.25 * strength
            ramp.inputs['To Max'].default_value = strength
            nt.links.new(sq.outputs['Value'], ramp.inputs['Value'])
            nt.links.new(ramp.outputs['Result'], em.inputs['Strength'])
        nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
        m.cycles.emission_sampling = 'NONE'  # seen in reflections only: found by the glossy rays themselves
        o.data.materials.append(m)
        o.visible_camera = False
        o.visible_diffuse = False
        o.visible_shadow = False
        o.visible_transmission = False
        o.visible_volume_scatter = False
        return o

    cards = [
        card('card_left', (-2.9, -0.4, 2.7), (0.0, 1.4, 1.0), (1.1, 3.0), 3.4, (0.92, 0.96, 1.0), radial=True),
        card('card_right', (2.9, -0.4, 2.7), (0.0, 1.4, 1.0), (1.1, 3.0), 2.4, (1.0, 0.9, 0.8), radial=True),
        card('card_sky', (0.0, -5.5, 2.6), (0.0, 1.4, 1.0), (9.0, 5.5), 1.3, (0.75, 0.88, 1.0), gradient=True),
    ]
    return {'key': key, 'fill': fill, 'rim': rim, 'cards': cards}


# ------------------------------------------------------------------ character


def lid_material_slots(obj, inside_mat):
    """The lid's underside is the box's lining (seen when it opens)."""
    obj.data.materials.append(inside_mat)
    for poly in obj.data.polygons:
        if poly.normal.z < -0.9:
            poly.material_index = 1


def chrome_to_black():
    """Chrome until the sweep passes, black lacquer after it; a glowing band at the sweep front."""
    m = bpy.data.materials.new('chrome_to_black')
    m.use_nodes = True
    nt = m.node_tree
    out = nt.nodes['Material Output']
    chrome = nt.nodes['Principled BSDF']
    chrome.inputs['Base Color'].default_value = (0.9, 0.92, 0.96, 1)
    chrome.inputs['Metallic'].default_value = 1.0
    chrome.inputs['Roughness'].default_value = 0.07
    black = nt.nodes.new('ShaderNodeBsdfPrincipled')
    black.inputs['Base Color'].default_value = (0.012, 0.012, 0.016, 1)
    black.inputs['Roughness'].default_value = 0.3
    black.inputs['Coat Weight'].default_value = 1.0
    black.inputs['Coat Roughness'].default_value = 0.06
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(tc.outputs['Object'], sep.inputs['Vector'])
    front = nt.nodes.new('ShaderNodeValue')
    front.name = 'sweep'
    front.outputs[0].default_value = -1.3
    behind = nt.nodes.new('ShaderNodeMath')  # > 0 where the sweep has passed
    behind.operation = 'SUBTRACT'
    nt.links.new(front.outputs[0], behind.inputs[0])
    nt.links.new(sep.outputs['X'], behind.inputs[1])
    mask = nt.nodes.new('ShaderNodeMath')
    mask.operation = 'MULTIPLY_ADD'
    mask.use_clamp = True
    nt.links.new(behind.outputs['Value'], mask.inputs[0])
    mask.inputs[1].default_value = 1 / 0.08
    mask.inputs[2].default_value = 0.5
    mix = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(mask.outputs['Value'], mix.inputs['Fac'])
    nt.links.new(chrome.outputs['BSDF'], mix.inputs[1])
    nt.links.new(black.outputs['BSDF'], mix.inputs[2])
    # the band: orange light at the sweep front
    dist = nt.nodes.new('ShaderNodeMath')
    dist.operation = 'ABSOLUTE'
    nt.links.new(behind.outputs['Value'], dist.inputs[0])
    band = nt.nodes.new('ShaderNodeMath')
    band.operation = 'MULTIPLY_ADD'
    band.use_clamp = True
    nt.links.new(dist.outputs['Value'], band.inputs[0])
    band.inputs[1].default_value = -1 / 0.07
    band.inputs[2].default_value = 1.0
    strength = nt.nodes.new('ShaderNodeMath')
    strength.operation = 'MULTIPLY'
    strength.name = 'band_strength'
    nt.links.new(band.outputs['Value'], strength.inputs[0])
    strength.inputs[1].default_value = 0.0
    glow = nt.nodes.new('ShaderNodeEmission')
    glow.inputs['Color'].default_value = (1.0, 0.42, 0.08, 1)
    nt.links.new(strength.outputs['Value'], glow.inputs['Strength'])
    add = nt.nodes.new('ShaderNodeAddShader')
    nt.links.new(mix.outputs['Shader'], add.inputs[0])
    nt.links.new(glow.outputs['Emission'], add.inputs[1])
    nt.links.new(add.outputs['Shader'], out.inputs['Surface'])
    return m


def build_character():
    hero = empty('hero', (0, 14.0, 0))
    body_mat = chrome_to_black()
    # the inside: a dark, warm lining, so the open lid reads as a mouth, lit by the ball as it drops in
    inside = principled('inside', (0.12, 0.05, 0.028), roughness=0.45)

    # A: the one-piece character cube
    cube = rounded_box('cube', (CUBE, CUBE, CUBE), BEVEL0)
    cube.parent = hero
    assign(cube, body_mat)

    # B: body + lid, the same silhouette, swapped in just before the lid opens
    body = rounded_box('body', (CUBE, CUBE, BODY_H), BEVEL0)
    body.parent = hero
    assign(body, body_mat)
    hinge = empty('hinge', (0, CUBE / 2, BODY_H))
    hinge.parent = hero
    lid = rounded_box('lid', (CUBE, CUBE, LID_H), BEVEL0 * 0.8)
    assign(lid, body_mat)
    lid_material_slots(lid, inside)
    lid.parent = hinge
    lid.location = (0, -CUBE / 2, 0)

    # the dark opening on the body's top, and the light inside
    bpy.ops.mesh.primitive_plane_add(size=1)
    hole = bpy.context.object
    hole.name = 'hole'
    hole.scale = (CUBE - 2 * BEVEL0 * 1.05, CUBE - 2 * BEVEL0 * 1.05, 1)
    hole.location = (0, 0, BODY_H + 0.002)
    hole.parent = hero
    hole_mat = principled('hole', (0.0, 0.0, 0.0), roughness=1.0, emission=(1.0, 0.32, 0.04), emission_strength=0.0)
    assign(hole, hole_mat)

    # the seam: a thin glowing line between body and lid (light leaking from inside)
    seam = rounded_box('seam', (CUBE * 0.9, CUBE * 0.9, 0.07), BEVEL0 * 0.75, subsurf=1)
    seam.location = (0, 0, BODY_H - 0.035)
    seam.parent = hero
    seam_mat = emission('seam', (1.0, 0.34, 0.05), 0.0)
    assign(seam, seam_mat)

    light_d = bpy.data.lights.new('inside_light', 'POINT')
    light_d.color = (1.0, 0.5, 0.15)
    light_d.energy = 0.0
    light_d.shadow_soft_size = 0.4
    inside_light = bpy.data.objects.new('inside_light', light_d)
    bpy.context.collection.objects.link(inside_light)
    inside_light.parent = hero
    inside_light.location = (0, 0, BODY_H * 0.7)

    # the face: on the front, below the seam; it grows and sinks from the base of the front face
    face = empty('face', (0, -CUBE / 2, 0))
    face.parent = hero
    white = principled('eye_white', (0.92, 0.93, 0.95), roughness=0.22, coat=0.6)
    iris = principled('pupil', (0.015, 0.03, 0.12), roughness=0.12, coat=1.0)
    ink = principled('face_ink', (0.03, 0.03, 0.05), roughness=0.4)
    eyes, pupils, brows = [], [], []
    for side in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.2, segments=40, ring_count=20)
        e = bpy.context.object
        e.name = f'eye{side}'
        for poly in e.data.polygons:
            poly.use_smooth = True
        assign(e, white)
        e.parent = face
        e.location = (side * 0.33, 0.06, 0.86)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.095, segments=32, ring_count=16)
        pu = bpy.context.object
        pu.name = f'pupil{side}'
        for poly in pu.data.polygons:
            poly.use_smooth = True
        assign(pu, iris)
        pu.parent = e
        pu.location = (0, -0.15, 0)
        b = rounded_box(f'brow{side}', (0.22, 0.05, 0.045), 0.02, segments=3, origin_bottom=False, subsurf=0)
        assign(b, ink)
        b.parent = face
        b.location = (side * 0.34, -0.012, 1.13)
        b.rotation_euler = (0, math.radians(side * 8), 0)
        eyes.append(e)
        pupils.append(pu)
        brows.append(b)
    cd = bpy.data.curves.new('mouth', 'CURVE')
    cd.dimensions = '3D'
    cd.bevel_depth = 0.026
    cd.bevel_resolution = 4
    sp = cd.splines.new('BEZIER')
    sp.bezier_points.add(2)
    for bp, co in zip(sp.bezier_points, [(-0.27, 0, 0.07), (0.0, 0, -0.07), (0.27, 0, 0.07)]):
        bp.co = co
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
    mouth = bpy.data.objects.new('mouth', cd)
    bpy.context.collection.objects.link(mouth)
    mouth.data.materials.append(ink)
    mouth.parent = face
    mouth.location = (0, -0.015, 0.42)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.08, minor_radius=0.028, major_segments=32, minor_segments=12, rotation=(math.radians(90), 0, 0))
    mouth_o = bpy.context.object
    mouth_o.name = 'mouth_o'
    for poly in mouth_o.data.polygons:
        poly.use_smooth = True
    assign(mouth_o, ink)
    mouth_o.parent = face
    mouth_o.location = (0, -0.015, 0.42)

    # the glowing orange ball, and the light it gives
    bpy.ops.mesh.primitive_uv_sphere_add(radius=BALL_R, segments=48, ring_count=24)
    ball = bpy.context.object
    ball.name = 'ball'
    for poly in ball.data.polygons:
        poly.use_smooth = True
    assign(ball, principled('ball', (1.0, 0.45, 0.06), roughness=0.18, coat=0.6, emission=(1.0, 0.42, 0.05), emission_strength=0.75))
    ball.visible_shadow = False  # its own light is inside it
    bl = bpy.data.lights.new('ball_light', 'POINT')
    bl.color = (1.0, 0.55, 0.2)
    bl.energy = 0.0
    bl.shadow_soft_size = BALL_R
    ball_light = bpy.data.objects.new('ball_light', bl)
    bpy.context.collection.objects.link(ball_light)
    ball_light.parent = ball

    return {
        'hero': hero, 'cube': cube, 'body': body, 'lid': lid, 'hinge': hinge, 'hole': hole, 'hole_mat': hole_mat,
        'seam': seam, 'seam_mat': seam_mat, 'inside_light': inside_light, 'body_mat': body_mat,
        'face': face, 'eyes': eyes, 'pupils': pupils, 'brows': brows, 'mouth': mouth, 'mouth_o': mouth_o,
        'ball': ball, 'ball_light': ball_light,
    }


def build_wordmark():
    """The official IN YOUR SHOE wordmark (assets/brand), on a plane at its own proportions, revealed by a sweep."""
    path = os.path.join(BRAND, 'in-your-shoe-wordmark-white.png')
    img = bpy.data.images.load(path)
    w, h = img.size
    bpy.ops.mesh.primitive_plane_add(size=1)
    o = bpy.context.object
    o.name = 'wordmark'
    o.scale = (2.18, 2.18 * h / w, 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    m = bpy.data.materials.new('wordmark')
    m.use_nodes = True
    m.blend_method = 'HASHED'
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = img
    tex.interpolation = 'Cubic'
    tex.extension = 'CLIP'
    uv = nt.nodes.new('ShaderNodeTexCoord')
    nt.links.new(uv.outputs['UV'], tex.inputs['Vector'])
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(uv.outputs['UV'], sep.inputs['Vector'])
    rv = nt.nodes.new('ShaderNodeValue')
    rv.name = 'reveal'
    rv.outputs[0].default_value = -0.08
    ahead = nt.nodes.new('ShaderNodeMath')
    ahead.operation = 'SUBTRACT'
    nt.links.new(rv.outputs[0], ahead.inputs[0])
    nt.links.new(sep.outputs['X'], ahead.inputs[1])
    shown = nt.nodes.new('ShaderNodeMath')
    shown.operation = 'MULTIPLY'
    shown.use_clamp = True
    nt.links.new(ahead.outputs['Value'], shown.inputs[0])
    shown.inputs[1].default_value = 1 / 0.015
    a = nt.nodes.new('ShaderNodeMath')
    a.operation = 'MULTIPLY'
    nt.links.new(tex.outputs['Alpha'], a.inputs[0])
    nt.links.new(shown.outputs['Value'], a.inputs[1])
    ink = nt.nodes.new('ShaderNodeBsdfPrincipled')
    ink.inputs['Base Color'].default_value = (0.95, 0.95, 0.95, 1)
    ink.inputs['Roughness'].default_value = 0.45
    ink.inputs['Emission Color'].default_value = (1, 1, 1, 1)
    ink.inputs['Emission Strength'].default_value = 0.55
    clear = nt.nodes.new('ShaderNodeBsdfTransparent')
    mix = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(a.outputs['Value'], mix.inputs['Fac'])
    nt.links.new(clear.outputs['BSDF'], mix.inputs[1])
    nt.links.new(ink.outputs['BSDF'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])
    assign(o, m)
    o.rotation_euler = (math.radians(90), 0, 0)
    return {'obj': o, 'reveal': rv.outputs[0]}


def build_monogram():
    """The official IYS monogram: the SVG's own outlines (assets/brand), extruded; chrome on the lid."""
    import addon_utils

    addon_utils.enable('io_curve_svg', default_set=False)
    before = set(bpy.data.objects)
    bpy.ops.import_curve.svg(filepath=os.path.join(BRAND, 'iys-monogram.svg'))
    new = [o for o in bpy.data.objects if o not in before and o.type == 'CURVE']
    bpy.ops.object.select_all(action='DESELECT')
    for o in new:
        o.select_set(True)
    bpy.context.view_layer.objects.active = new[0]
    if len(new) > 1:
        bpy.ops.object.join()
    mono = bpy.context.view_layer.objects.active
    bpy.ops.object.convert(target='MESH')
    mono = bpy.context.view_layer.objects.active
    mono.name = 'monogram'
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    xs = [v.co.x for v in mono.data.vertices]
    ys = [v.co.y for v in mono.data.vertices]
    cx, cy, width = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, max(xs) - min(xs)
    for v in mono.data.vertices:  # centred, 1 unit wide, lying flat (its own proportions)
        v.co.x = (v.co.x - cx) / width
        v.co.y = (v.co.y - cy) / width
        v.co.z = 0.0
    for c in list(mono.users_collection):
        c.objects.unlink(mono)
    bpy.context.scene.collection.objects.link(mono)
    sol = mono.modifiers.new('solidify', 'SOLIDIFY')
    sol.thickness = 0.06
    sol.offset = 1.0
    bev = mono.modifiers.new('bevel', 'BEVEL')
    bev.width = 0.006
    bev.segments = 2
    bev.limit_method = 'ANGLE'
    assign(mono, principled('monogram', (0.86, 0.88, 0.92), metallic=1.0, roughness=0.12))
    return mono


def build_camera(sc):
    d = bpy.data.cameras.new('cam')
    d.lens = 35
    d.sensor_fit = 'HORIZONTAL'
    d.sensor_width = 36
    d.clip_start = 0.05
    d.clip_end = 200
    cam = bpy.data.objects.new('cam', d)
    bpy.context.collection.objects.link(cam)
    sc.camera = cam
    target = empty('cam_target', (0, 2.4, 0.95))
    tr = cam.constraints.new('TRACK_TO')
    tr.target = target
    tr.track_axis = 'TRACK_NEGATIVE_Z'
    tr.up_axis = 'UP_Y'
    return {'cam': cam, 'target': target}


# ------------------------------------------------------------------ animation
def animate(parts, word, mono, studio, lights, cam):
    F = FRAMES
    hero = parts['hero']
    bake(hero, 'location', F, hero_location)
    bake(hero, 'scale', F, hero_scale)
    bake(hero, 'rotation_euler', F, lambda f: (math.radians(tilt(f)[0]), math.radians(tilt(f)[1]), math.radians(spin(f))))

    # one-piece cube until the swap; body + lid after
    bake_flag(parts['cube'], 'hide_render', F, lambda f: f >= LID_SWAP)
    for k in ('body', 'lid', 'hole', 'seam'):
        bake_flag(parts[k], 'hide_render', F, lambda f: f < LID_SWAP)

    # bevel: toy-round → crisp box
    for k in ('cube', 'body', 'lid', 'seam'):
        mod = parts[k].modifiers['bevel']
        base = mod.width
        for f in F:
            mod.width = lerp(base, base * BEVEL1 / BEVEL0, ease_in_out(span(f, *MORPH)))
            mod.keyframe_insert('width', frame=f)

    # the lid: opens like a mouth, snaps shut, overhangs as a box lid, lifts at the end
    def lid_angle(f):
        if f < LID_OPEN[0]:
            return 0.0
        if f < LID_OPEN[1]:
            return -72 * back_out(span(f, *LID_OPEN), 1.2)
        if f < LID_SHUT[0]:
            return -72.0
        if f < LID_SHUT[1]:
            return -72 * (1 - ease_in(span(f, *LID_SHUT), 1.6))
        return 1.2 * spring((f - LID_SHUT[1]) / FPS, 4.0, 9.0) * (f < LID_SHUT[1] + 12)

    bake(parts['hinge'], 'rotation_euler', F, lambda f: (math.radians(lid_angle(f)), 0, 0))
    bake(parts['hinge'], 'location', F, lambda f: (0, CUBE / 2, BODY_H + lid_lift(f)))
    bake(parts['lid'], 'scale', F, lambda f: (1 + 0.04 * morph(f), 1 + 0.06 * morph(f), 1.0))

    # glow inside: from when the ball is in; leaking at the seam; spilling when the lid lifts
    pulse = lambda f: 1 + 0.12 * math.sin(2 * math.pi * (f - 380) / 36) * span(f, 380, 392)  # noqa: E731
    hole_em = parts['hole_mat'].node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
    bake_socket(hole_em, F, lambda f: (1.6 * span(f, BALL_IN - 1, BALL_IN + 4) + 2.0 * span(f, *LIFT)) * pulse(f))
    seam_em = parts['seam_mat'].node_tree.nodes['Emission'].inputs['Strength']
    bake_socket(seam_em, F, lambda f: (1.3 * span(f, 242, 262) + 1.6 * span(f, *LIFT)) * pulse(f))
    light = parts['inside_light'].data
    for f in F:
        light.energy = (60 * span(f, BALL_IN, BALL_IN + 8) + 640 * ease_out(span(f, *LIFT))) * pulse(f)
        light.keyframe_insert('energy', frame=f)

    # the transformation: the sweep and its glowing band
    nt = parts['body_mat'].node_tree
    bake_socket(nt.nodes['sweep'].outputs[0], F, sweep)
    bake_socket(nt.nodes['band_strength'].inputs[1], F, lambda f: 2.6 * span(f, SWEEP[0] - 2, SWEEP[0] + 3) * (1 - span(f, SWEEP[1] - 3, SWEEP[1] + 2)))

    # the face
    face_frames = F
    bake(parts['face'], 'scale', face_frames, lambda f: (max(1e-3, face_size(f)),) * 3)
    for e, pu, side in zip(parts['eyes'], parts['pupils'], (-1, 1)):
        bake(e, 'scale', F, lambda f: (1.0, 0.75, 1.15 * max(0.05, eye_open(f))))
        def pupil_loc(f, side=side):
            lx, lz = eye_look(f)
            return (lx * 0.07, -0.15 - 0.02 * (1 - abs(lx)), lz * 0.07)
        bake(pu, 'location', F, pupil_loc)
    bake(parts['mouth'], 'scale', F, lambda f: (mouth_shape(f)[0], 1.0, mouth_shape(f)[1]))
    bake(parts['mouth_o'], 'scale', F, lambda f: (max(1e-3, gulp_o(f)),) * 3)
    # brows: up when it sees the ball, way up at the gulp, down (puzzled) looking at its glow
    def brow_lift(f):
        return keys([(0, 0.0), (168, 0.0), (174, 0.04), (196, 0.04), (202, 0.0), (236, 0.0), (240, 0.06), (252, 0.06), (258, -0.03), (270, -0.03), (276, 0.0)], f)
    for bo, side in zip(parts['brows'], (-1, 1)):
        bake(bo, 'location', F, lambda f, side=side: (side * 0.34, -0.012, 1.13 + brow_lift(f)))

    # the ball: hidden until it rolls in, gone once it is inside
    ball, ball_light = parts['ball'], parts['ball_light']
    present = lambda f: 166 <= f <= BALL_IN + 3  # noqa: E731
    bake(ball, 'location', F, ball_location)
    bake(ball, 'rotation_euler', F, ball_rotation)
    bake_flag(ball, 'hide_render', F, lambda f: not present(f))
    for f in F:
        ball_light.data.energy = 30.0 * present(f) * (1 - 0.7 * span(f, BALL_IN - 2, BALL_IN + 3))
        ball_light.data.keyframe_insert('energy', frame=f)

    # the wordmark on the box front, the monogram on the lid: placed from the box's state,
    # at their own proportions (never scaled with the box)
    wo = word['obj']
    bake(wo, 'location', F, lambda f: front_point(f, (0, -CUBE / 2 - 0.004, 0.63)))
    bake(wo, 'rotation_euler', F, lambda f: (math.radians(90), 0, math.radians(spin(f))))
    bake_flag(wo, 'hide_render', F, lambda f: f < MORPH[1])
    bake_socket(word['reveal'], F, lambda f: lerp(-0.08, 1.08, ease_in_out(span(f, *WORD_SWEEP), 1.5)))

    def mono_loc(f):
        x, y, z = front_point(f, (0, 0.0, CUBE + lid_lift(f)))  # rides on the lid (in the box's own, scaled space)
        return (x, y, z + 0.002)

    bake(mono, 'location', F, mono_loc)
    bake(mono, 'rotation_euler', F, lambda f: (0, 0, math.radians(spin(f))))
    bake(mono, 'scale', F, lambda f: (0.9, 0.9, 0.9 * max(0.01, ease_out(span(f, 318, 328), 2.0))))
    bake_flag(mono, 'hide_render', F, lambda f: f < 318)

    # the studio darkens for the reveal; the key light pulls back, the warm glow takes over
    bake_socket(studio['glow'], F, lambda f: lerp(GLOW, GLOW * 0.24, ease_in_out(span(f, *DIM))))
    for name, lo in (('key', 0.42), ('fill', 0.3), ('rim', 0.6)):
        ld = lights[name].data
        e0 = ld.energy
        for f in F:
            ld.energy = e0 * lerp(1.0, lo, ease_in_out(span(f, *DIM)))
            ld.keyframe_insert('energy', frame=f)

    # the camera: locked off for the character (as in the ident), then it settles on the box
    c, t = cam['cam'], cam['target']
    cam_keys = [(96, (0.0, -1.8, 1.38)), (290, (0.0, -1.8, 1.38)), (318, (-1.1, -2.3, 2.3)), (334, (-0.5, -2.7, 1.9)), (358, (0.0, -2.85, 0.5)), (449, (0.0, -2.55, 0.46))]
    tgt_keys = [(96, (0.0, 2.4, 0.95)), (150, (0.0, 2.4, 0.95)), (160, (0.0, 1.4, 0.98)), (290, (0.0, 1.4, 0.98)), (318, (0.0, 1.4, 0.55)), (358, (0.0, 1.4, 0.4)), (449, (0.0, 1.4, 0.4))]
    bake(c, 'location', F, lambda f: keys(cam_keys, f, ease_in_out))
    bake(t, 'location', F, lambda f: keys(tgt_keys, f, ease_in_out))


def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = BUMPER_START, END
    sc.render.fps = FPS
    w = bpy.data.worlds.new('world')
    sc.world = w
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.008, 0.022, 0.06, 1)
    w.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.0

    studio = build_studio()
    lights = build_lights()
    parts = build_character()
    word = build_wordmark()
    mono = build_monogram()
    link_lights(parts, mono, lights)
    cam = build_camera(sc)
    animate(parts, word, mono, studio, lights, cam)
    sc.frame_set(BUMPER_START)
    return sc
