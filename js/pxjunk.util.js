// My utilities
function ExtArray() { this._cache = {}; }
ExtArray.prototype = new Array();
ExtArray.prototype.sum = function(name) {
	var k = "sum." + name;
	if(typeof(this._cache[k]) !== "number"){
		this._cache[k] = 0;
		for(var i=0;i<this.length;i++){ this._cache[k] += this[i][name]; }
	}
	return this._cache[k];
};
ExtArray.prototype.mean = function(name) {
	var k = "mean." + name;
	if(typeof(this._cache[k]) !== "number"){ this._cache[k] = this.sum(name) / this.length; }
	return this._cache[k];
};
ExtArray.prototype.getArray = function(name) {
	var a = [];
	a.length = this.length;
	for(var i=0;i<this.length;i++){ a[i] = this[i][name]; }
	return a;
}
ExtArray.prototype.clearCache = function() { this._cache = {}; }

// from $CLIBD/atomsf.lib
var calcScatteringFactor = function(atomName, d) {
	var Atom = {
		H: {a1: 0.493002, a2: 0.322912, a3: 0.140191, a4: 0.040810, b1:10.510900, b2:26.125700, b3: 3.142360, b4:57.799698, c :  0.003038},
		C: {a1: 2.310000, a2: 1.020000, a3: 1.588600, a4: 0.865000, b1:20.843899, b2:10.207500, b3: 0.568700, b4:51.651199, c :  0.215600},
		N: {a1:12.212600, a2: 3.132200, a3: 2.012500, a4: 1.166300, b1: 0.005700, b2: 9.893300, b3:28.997499, b4: 0.582600, c :-11.528999},
		O: {a1: 3.048500, a2: 2.286800, a3: 1.546300, a4: 0.867000, b1:13.277100, b2: 5.701100, b3: 0.323900, b4:32.908897, c :  0.250800}
	};
	var S2 = Math.pow(1 / (2 * d), 2);
	var atom = Atom[atomName];
	var fx = atom.a1 * Math.exp(-atom.b1 * S2)
		   + atom.a2 * Math.exp(-atom.b2 * S2)
		   + atom.a3 * Math.exp(-atom.b3 * S2)
		   + atom.a4 * Math.exp(-atom.b4 * S2)
		   + atom.c;
	return fx;
};

function PlotArea(oCanvas, conf) {
	var margin = conf.margin;
	var w = oCanvas.width;
	var h = oCanvas.height;
	var area = {width: w - (margin.right + margin.left), height: h - (margin.top + margin.bottom)};
	this.trX = function(x){ return area.width * ((x - conf.x.min) / (conf.x.max - conf.x.min)) + margin.left; };
	this.trY = function(y){ return h - area.height * ((y - conf.y.min) / (conf.y.max - conf.y.min)) - margin.bottom; };
	this.canvas = oCanvas;
	this.conf = conf;
	this.area = area;
	oCanvas.getContext("2d").font = "12px 'Arial'";
}
PlotArea.prototype.plot = function(plots, strokeColor, dotSize, dotColor) {
	var ctx = this.canvas.getContext("2d");
	var cs = ctx.strokeStyle, cf = ctx.fillStyle;
	ctx.beginPath();
	ctx.moveTo(this.trX(plots[0][0]), this.trY(plots[0][1]));
	if(strokeColor){ ctx.strokeStyle = strokeColor; }
	if(dotColor){ ctx.fillStyle = dotColor; }
	for(var i=0;i<plots.length;i++){
		ctx.lineTo(this.trX(plots[i][0]), this.trY(plots[i][1]));
		if(dotSize){ ctx.fillRect(this.trX(plots[i][0]), this.trY(plots[i][1]), dotSize, dotSize); }
	}
	ctx.stroke();
	ctx.strokeStyle = cs;
	ctx.fillStyle = cf;
};
PlotArea.prototype.drawAxis = function(nameX, nameY) {
	var ctx = this.canvas.getContext("2d");
	ctx.beginPath();
	ctx.moveTo(this.trX(this.conf.x.min), this.trY(this.conf.y.max));
	ctx.lineTo(this.trX(this.conf.x.min), this.trY(this.conf.y.min));
	ctx.lineTo(this.trX(this.conf.x.max), this.trY(this.conf.y.min));
	ctx.stroke(); 
	ctx.save();
	ctx.rotate(-90 * Math.PI / 180);
	ctx.translate(-this.canvas.height, 0);
	ctx.fillText(nameY, (this.area.height - ctx.measureText(nameX).width) / 2 + this.conf.margin.bottom, 15);
	ctx.restore();
	ctx.fillText(nameX, (this.area.width - ctx.measureText(nameY).width) / 2 + this.conf.margin.left, this.canvas.height - 5);
};
PlotArea.prototype.drawMarkerX = function(value, text, margin) {
	var ctx = this.canvas.getContext("2d");
	margin = (margin ? margin : 0);
	ctx.save();
	ctx.rotate(-90 * Math.PI / 180);
	ctx.translate(-this.canvas.height, 0);
	ctx.fillText(text, margin, this.trX(value) + 5);
	ctx.restore();
	ctx.beginPath();
	ctx.moveTo(this.trX(value), this.canvas.height - this.conf.margin.bottom);
	ctx.lineTo(this.trX(value), this.canvas.height - this.conf.margin.bottom - 10);
	ctx.stroke();
};
PlotArea.prototype.drawMarkerY = function(value, text, margin) {
	var ctx = this.canvas.getContext("2d");
	margin = (margin ? margin : 0);
	ctx.fillText(text, margin, this.trY(value) + 5);
	ctx.beginPath();
	ctx.moveTo(this.conf.margin.left, this.trY(value));
	ctx.lineTo(this.conf.margin.left + 10, this.trY(value));
	ctx.stroke();
};
PlotArea.prototype.clear = function() {
	var ctx = this.canvas.getContext("2d");
	var c = ctx.fillStyle;
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, this.canvas.width - 1, this.canvas.height - 1);
	ctx.fillStyle = c;
};
PlotArea.prototype.setStrokeStyle = function(color) { this.canvas.getContext("2d").strokeStyle = color; }
