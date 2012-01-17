#!/bin/env python
# -*- coding: utf-8 -*-
#!/bin/env python
# Calculating <I/sig(I)> from SCA file - Ver.0.0.2
# by Nobuo OKAZAKI
# written at Dec.19,2011
import math, sys, re

class ScaFileLine(object):
    def __init__(self, line):
        items = re.split(r"\s+", line.strip())
        self.items = map(lambda x:int(x), items[0:3])
        self.items += map(lambda x:float(x), items[3:5])
        self.resolution = -1

    def _get_hkl(self): return self.items[0:3]
    def _get_intensity(self): return self.items[3]
    def _get_sigma(self): return self.items[4]
    def _get_ios(self): return self.items[3] / self.items[4]
    hkl = property(_get_hkl)
    intensity = property(_get_intensity)
    sigma = property(_get_sigma)
    i_over_sigma = property(_get_ios)

class ScaFile(object):
    def __init__(self, filename):
        fh = open(filename, "r")
        for i in range(0, 3): line = fh.readline().strip()
        self.cell = map(lambda x:float(x), re.split(r"\s+", line)[0:6])
        self.reflections = []
        all_i = all_sig = all_ios = 0
        for line in fh:
            obj = ScaFileLine(line)
            obj.resolution = hkl_to_resolution(self.cell, obj.hkl)
            all_i += obj.intensity
            all_sig += obj.sigma
            all_ios += obj.i_over_sigma
            self.reflections.append(obj)
        fh.close()
        self.count = len(self.reflections)
        self.intensity = all_i / self.count
        self.sigma = all_sig / self.count
        self.i_over_sigma = all_ios / self.count

    def get_reflections_sorted_by_resolution(self):
        return sorted(self.reflections, cmp=lambda x,y: cmp(x.resolution,y.resolution))

class ScaleShell(object):
    def __init__(self): self.reflections = []
    def add_reflection(self, refl): self.reflections.append(refl)
    def get_lower_limit(self): return self.reflections[-1].resolution
    def get_upper_limit(self): return self.reflections[0].resolution

    def average_intensity(self):
        inten = 0
        for refl in self.reflections: inten += refl.intensity
        return inten / self.count()

    def average_sigma(self):
        sigma = 0
        for refl in self.reflections: sigma += refl.sigma
        return sigma / self.count()

    def average_i_over_sigma(self):
        """returns <I/sigI>"""
        ios = 0
        for refl in self.reflections: ios += refl.i_over_sigma
        return ios / self.count()

    def count(self): return len(self.reflections)

def hkl_to_resolution(cell, miller_index):
    """d(hkl) -- Calculating resolution(d) from hkl.
    Ref: http://www.ruppweb.org/Xray/tutorial/spcdiff.htm
    """
    (sin, cos) = (math.sin, math.cos)
    A = cell[3] / 180.0 * math.pi
    B = cell[4] / 180.0 * math.pi
    G = cell[5] / 180.0 * math.pi
    (a, b, c) = cell[0:3]
    (h, k, l) = miller_index

    v1 = (h ** 2 / a ** 2) * sin(A) ** 2 + (k ** 2 / b ** 2) * sin(B) ** 2 + (l ** 2 / c ** 2) * sin(G) ** 2
    v2 = ((2 * k * l) / (b * c)) * (cos(B) * cos(G) - cos(A))
    v3 = ((2 * h * l) / (a * c)) * (cos(G) * cos(A) - cos(B))
    v4 = ((2 * h * k) / (a * b)) * (cos(A) * cos(B) - cos(G))
    v0 = 1 - cos(A) ** 2 - cos(B) ** 2 - cos(G) ** 2 + 2 * cos(A) * cos(B) * cos(G)
    v = (v1 + v2 + v3 + v4) / v0
    d = math.sqrt(1 / v)
    return d

def shell_counts_from_scalepack_log(logfile):
    """Getting counts in shell ranges from SCALEPACK log file"""
    fh = open(logname, "r")
    chk = False
    for line in fh:
        if line.startswith("  Lower Upper      No. of reflections with given No. of observations"):
            (shells, chk) = ([], True)
        elif chk:
            if line.startswith("  limit limit     0     1     2     3     4"): continue
            if line.startswith(" All hkl"): chk = False
            else: shells.append(re.split(r"\s+", line.strip())[12])
    fh.close()
    shells = map(lambda x:int(x), shells)
    shells.reverse()
    return shells

print "\nCalculating I/sig(I) from SCALEPACK outputs"
print "Ver.0.0.2(2011-12-19) by Nobuo OKAZAKI\n"
try:
    (scafile, logname) = sys.argv[1:3]
except:
    print "Usage: ioversig.py scalepack.sca scalepack.log"
    sys.exit(-1)

print "Reading %s..." % scafile
sca = ScaFile(scafile)
print "Sorting reflections by resolution..."
refls = sca.get_reflections_sorted_by_resolution()
print "Done"
shell_counts = shell_counts_from_scalepack_log(logname)

cnt = shell_counts.pop(0)
shells = [ScaleShell()]
for i in range(0, len(refls)):
    shells[-1].add_reflection(refls[i])
    cnt -= 1
    if cnt == 0 and len(shell_counts):
        shells.append(ScaleShell())
        cnt = shell_counts.pop(0)

print "Lower Upper     <I>     <sig>    <I>/<sig>  <I/sig>  Count"
for shell in reversed(shells):
    print "%5.2f-%5.2f   %7.1f %7.1f      %5.1f     %5.1f   %5d" % (
        shell.get_lower_limit(), shell.get_upper_limit(),
        shell.average_intensity(), shell.average_sigma(),
        shell.average_intensity() / shell.average_sigma(),
        shell.average_i_over_sigma(),
        shell.count())
print "              %7.1f %7.1f      %5.1f     %5.1f   %5d" % (
    sca.intensity, sca.sigma, sca.intensity / sca.sigma, sca.i_over_sigma, sca.count
)
