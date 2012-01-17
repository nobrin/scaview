// Utility methods
var hkl2resolution = function(cell, miller_index) {
	// Calculating resolution of indexed reflection.
	var sin = Math.sin, cos = Math.cos, pow = Math.pow;
	var A = cell[3] / 180.0 * Math.PI,
		B = cell[4] / 180.0 * Math.PI,
		G = cell[5] / 180.0 * Math.PI,
		a = cell[0] * 1, b = cell[1] * 1, c = cell[2] * 1,
		h = miller_index[0] * 1, k = miller_index[1] * 1, l = miller_index[2] * 1;
	var v1 = (pow(h, 2) / pow(a, 2)) * pow(sin(A), 2)
			+ (pow(k, 2) / pow(b, 2)) * pow(sin(B), 2)
			+ (pow(l, 2) / pow(c, 2)) * pow(sin(G), 2),
		v2 = ((2 * k * l) / (b * c)) * (cos(B) * cos(G) - cos(A)),
		v3 = ((2 * h * l) / (a * c)) * (cos(G) * cos(A) - cos(B)),
		v4 = ((2 * h * k) / (a * b)) * (cos(A) * cos(B) - cos(G)),
		v0 = 1 - pow(cos(A), 2) - pow(cos(B), 2) - pow(cos(G), 2) + 2 * cos(A) * cos(B) * cos(G),
		v = (v1 + v2 + v3 + v4) / v0,
		d = Math.sqrt(1 / v);
	return d;
};
