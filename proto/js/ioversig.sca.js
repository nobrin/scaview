// Scalepack and Reflections -- 2011-12-28
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

// Reflection object
function Reflection() {};
Reflection.fromScaLine = function(line, cell) {
	var obj = new Reflection();
	obj._items = line.trim().split(/\s+/);
	obj._resolution = hkl2resolution(cell, obj.hkl);
	return obj;
};

Object.defineProperties(Reflection.prototype, {
	hkl			: { get: function() { return this._items.slice(0, 3); } },
	intensity	: { get: function() { return this._items[3] * 1; } },
	sigma		: { get: function() { return this._items[4] * 1; } },
	iOverSigma	: { get: function() { return this.intensity / this.sigma; } },
	resolution	: { get: function() { return this._resolution; } }
});

// Scalepack file object
function ScaFile(lines) {
	var refl;
	this.cell = lines[2].trim().split(/\s+/).slice(0, 6);
	this.reflections = [];
	this.intensity = this.sigma = this.iOverSigma = 0;
	for(var i=3;i<lines.length;i++){
		refl = Reflection.fromScaLine(lines[i], this.cell);
		this.intensity += refl.intensity;
		this.sigma += refl.sigma;
		this.iOverSigma += refl.iOverSigma;
		this.reflections.push(refl);
	}
	this.reflections.sort(function(a, b) { return a.resolution - b.resolution; });
}
ScaFile.prototype.addReflection = function(line) {
	this.reflections.push(Reflection.fromScaLine(line, this.cell));
};
ScaFile.prototype.sortReflections = function() {
	this.reflections.sort(function(a, b) { return a.resolution - b.resolution; });
};
ScaFile.prototype.getAverageIntensity = function() { return this.intensity / this.reflections.length; };
ScaFile.prototype.getAverageSigma = function() { return this.sigma / this.reflections.length; };
ScaFile.prototype.getAverageIoverSigma = function() { return this.iOverSigma / this.reflections.length; };
ScaFile.prototype.splitToShellsByCount = function(count) {
	// split to shells by reflection count
	var cnt = count,
		rs = new ResolutionShells(),
		shell = new ShellRange()
	for(var i=0;i<this.reflections.length;i++){
		shell.reflections.push(this.reflections[i]);
		cnt--;
		if(cnt === 0){
			rs.push(shell);
			cnt = count;
			shell = new ShellRange();
		}
	}
	if(shell.reflections.length){ rs.push(shell); }
	return rs;
};
ScaFile.prototype.splitToShellsByShells = function(shells) {
	var count = Math.ceil(this.reflections.length / shells);
	return this.splitToShellsByCount(count);
};
