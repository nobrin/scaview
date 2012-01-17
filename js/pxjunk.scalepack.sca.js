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

function Reflection(hkl, intensity, sigma, cell) {
	this.hkl = hkl;
	this.intensity = intensity;
	this.sigma = sigma;
	this.resolution = hkl2resolution(cell, hkl);
};
Reflection.fromScaLine = function(line, cell) {
	var items = line.trim().split(/\s+/);
	for(var i=0;i<items.length;i++){ items[i] *= 1; }
	return new Reflection(items.slice(0, 3), items[3], items[4], cell);
};
Object.defineProperties(Reflection.prototype, {
	IoverSigma		: { get: function() { return this.intensity / this.sigma; } }
});

/*
function oReflection() {};
oReflection.fromScaLine = function(line, cell) {
	var obj = new oReflection();
	obj._items = line.trim().split(/\s+/);
	obj._resolution = hkl2resolution(cell, obj.hkl);
	return obj;
};

Object.defineProperties(oReflection.prototype, {
	hkl			: { get: function() { return this._items.slice(0, 3); } },
	intensity	: { get: function() { return this._items[3] * 1; } },
	sigma		: { get: function() { return this._items[4] * 1; } },
	iOverSigma	: { get: function() { return this.intensity / this.sigma; } },
	resolution	: { get: function() { return this._resolution; } }
});
*/

function ReflectionArray() { this.sorted = false; }
ReflectionArray.prototype = new ExtArray();
ReflectionArray.prototype.push = function() {
	this.clearCache();		// clear cache
	this.sorted = false;
	Array.prototype.push.apply(this, arguments);
};
ReflectionArray.prototype.sort = function() {
	Array.prototype.sort.call(this, function(a, b) { return b.resolution - a.resolution; });
	this.sorted = true;
};
ReflectionArray.prototype.createScalepackShells = function(logShells) {
	var shells = [], n = 0, cnt;
	for(var i=0;i<logShells.length;i++){
		cnt = logShells[i].count;
		shells.push(new ReflectionArray());
		while(cnt > 0){
			shells[shells.length-1].push(this[n]);
			cnt--; n++;
		}
		shells[shells.length-1].sorted = true;
	}
	return shells;
};
ReflectionArray.prototype.splitToShellsByCount = function(count) {
	// split to shells by reflection count
	var cnt = count, shells = [],
		shell = new ReflectionArray();
	for(var i=0;i<this.length;i++){
		shell.push(this[i]);
		cnt--;
		if(cnt === 0){
			shells.push(shell);
			cnt = count;
			shell = new ReflectionArray();
		}
	}
	if(shell.length){ shells.push(shell); }
	for(var i=0;i<shells.length;i++){ shells[i].sorted = true; }
	shells.reverse();
	return shells;
};
ReflectionArray.prototype.splitToShellsByShells = function(shellCount) {
	var count = Math.ceil(this.length / shellCount);
	return this.splitToShellsByCount(count);
};
Object.defineProperties(ReflectionArray.prototype, {
	sumI			: {get: function() { return this.sum("intensity"); }},
	sumSigma		: {get: function() { return this.sum("sigma"); }},
	sumIoverSigma	: {get: function() { return this.sum("IoverSigma"); }},
	meanI			: {get: function() { return this.mean("intensity"); }},
	meanSigma		: {get: function() { return this.mean("sigma"); }},
	meanIoverSigma	: {get: function() { return this.mean("IoverSigma"); }},
	lowerLimit		: {get: function() {
		if(!this.sorted){ throw new Error("ReflectionArray has not been sorted."); }
		return this[0].resolution;
	}},
	upperLimit		: {get: function() {
		if(!this.sorted){ throw new Error("ReflectionArray has not been sorted."); }
		return this[this.length - 1].resolution;
	}},
	resolution		: {get: function() { return (this.lowerLimit + this.upperLimit) / 2; }}
});

// Scalepack file object
function ScaFile(lines) {
	var refl;
	this.cell = lines[2].trim().split(/\s+/).slice(0, 6);
	if(this.cell[3] === undefined){
		alert("ScaView only supports MERGED sca file. Aborted.");
		throw new Error("ScaView onlySupports MERGED sca file.");
	}
	this.reflections = new ReflectionArray();
	this.intensity = this.sigma = this.iOverSigma = 0;
	for(var i=3;i<lines.length;i++){
		refl = Reflection.fromScaLine(lines[i], this.cell);
		this.intensity += refl.intensity;
		this.sigma += refl.sigma;
		this.iOverSigma += refl.iOverSigma;
		this.reflections.push(refl);
	}
	this.reflections.sort();
}
ScaFile.prototype.toCSV = function(logShells) {
	var lines = [], items, shell;
	lines.push('"Lower","Upper","<I>","<sig(I)>","<I>/<sig(I)>","<I/sig(I)>","Count"');
	var shells = this.reflections.createScalepackShells(logShells);
	for(var i=0;i<=shells.length;i++){
		items = [];
		if(i === shells.length){ shell = this.reflections; items.push("All", ""); }
		else{ shell = shells[i]; items.push(shell.lowerLimit.toFixed(2), shell.upperLimit.toFixed(2)); }
		items.push(shell.meanI.toFixed(1), shell.meanSigma.toFixed(1), (shell.meanI / shell.meanSigma).toFixed(1));
		items.push(shell.meanIoverSigma.toFixed(1), shell.length);
		lines.push(items.join(","));
	};
	return lines;
};
