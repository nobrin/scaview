#!/bin/env cctbx.python
from cctbx import uctbx
import math
uc = uctbx.unit_cell((243.153, 41.284, 90.729, 90.000, 97.557, 90.000))
hkl = (96, 16, 36)
print uc.d(miller_index=hkl)
print uc.stol(miller_index=hkl)
wlen = 1.0
print uc.two_theta(miller_index=hkl, wavelength=wlen)

#print 1/math.sqrt((96.0/243.153)**2 + (16.0/41.284)**2 + (36.0/90.729)**2)

(a, b, c, alpha, beta, gamma) = (243.153, 41.284, 90.729, 90.000, 97.557, 90.000)
(h, k, l) = (96, 16, 36)
sin = math.sin
cos = math.cos
ALPHA = alpha / 180.0 * math.pi
BETA = beta / 180.0 * math.pi
GAMMA = gamma / 180.0 * math.pi

v1 = (h**2/a**2)*sin(ALPHA)**2 + (k**2/b**2)*sin(BETA)**2 + (l**2/c**2)*sin(GAMMA)**2
v2 = ((2 * k * l) / (b * c)) * (cos(BETA) * cos(GAMMA) - cos(ALPHA))
v3 = ((2 * h * l) / (a * c)) * (cos(ALPHA) * cos(GAMMA) - cos(BETA))
v4 = ((2 * h * k) / (a * b)) * (cos(ALPHA) * cos(BETA) - cos(GAMMA))
v5 = 1 - cos(ALPHA)**2 - cos(BETA)**2 - cos(GAMMA)**2 + 2 * cos(ALPHA) * cos(BETA) * cos(GAMMA)
V = (v1 + v2 + v3 + v4) / v5
D2 = 1 / V
print math.sqrt(D2)


