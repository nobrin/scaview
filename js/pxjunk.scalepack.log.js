function ScalepackLogParser() { this.parserClasses = []; }
ScalepackLogParser.prototype.addBlockParserClass = function(cls) { this.parserClasses.push(cls); };
ScalepackLogParser.prototype.parse = function(logLines) {
	var parser = null, res = {};
	var funcGotResult = function(parser) {
		if(!res.hasOwnProperty(parser.constructor)){ res[parser.constructor] = []; }
		res[parser.constructor].unshift(parser);
	};
	for(var i=0;i<logLines.length;i++){	// parsing scalepack log
		var line = logLines[i];
		if(parser){
			if(!parser.addLine(line)){ funcGotResult(parser); parser = null; }
		}else{
			for(var j=0;j<this.parserClasses.length;j++){
				if(line.indexOf(this.parserClasses[j].headLine) === 0){
					parser = new this.parserClasses[j]();
					if(!parser.addLine(line)){ funcGotResult(parser); parser = null; }
					break;
				}
			}
		}
	}
	return res;
};

function ScalepackLog(logLines) {
	var p = new ScalepackLogParser();
	p.addBlockParserClass(ObservationsBlockParser);
	p.addBlockParserClass(RedundancyBlockParser);
	p.addBlockParserClass(CompletenessBlockParser);
	p.addBlockParserClass(SummaryBlockParser);
	p.addBlockParserClass(TotalObservationsParser);
	p.addBlockParserClass(SystematicAbsencesParser);
	p.addBlockParserClass(RefinementParser);
	var res = p.parse(logLines);
	this.shells = new ScalepackShellArray(res);
	this.allObservations = res[TotalObservationsParser][0].all;
	this.observationsOver1 = res[TotalObservationsParser][0].over1;
	this.absenceLines = (res.hasOwnProperty(SystematicAbsencesParser) ? res[SystematicAbsencesParser][0].absences.slice() : []);
	this.films = res[RefinementParser][0].films;
//	this.films.maxValue = res[RefinementParser][0].maxValue;
//	this.films.minValue = res[RefinementParser][0].minValue;
}
ScalepackLog.prototype.toCSV = function() {
	var lines = [], items, shell;
	lines.push('"Lower","Upper","<I>","<sig(I)>","<I>/<sig(I)>","chi2","Redundancy","Rmerge","Rmerge(sq)","Completeness","Count"');
	for(var i=0;i<=this.shells.length;i++){
		items = [];
		if(i === this.shells.length){ shell = this.shells.total; items.push("All", ""); }
		else{ shell = this.shells[i]; items.push(shell.lowerLimit.toFixed(2), shell.upperLimit.toFixed(2)); }
		items.push(shell.meanI.toFixed(1), shell.meanSigma.toFixed(1), (shell.meanI / shell.meanSigma).toFixed(1));
		items.push(shell.chi2.toFixed(3), shell.redundancy.toFixed(1), shell.Rmerge.toFixed(3));
		items.push(shell.RmergeSq.toFixed(3), shell.completeness.toFixed(1), shell.count);
		lines.push(items.join(","));
	};
	return lines;
};

// Parsers
// for counting reflections
function ObservationsBlockParser() { this.shells = []; }
ObservationsBlockParser.headLine = "  Lower Upper      No. of reflections with given No. of observations";
ObservationsBlockParser.prototype.addLine = function(line) {
	if(line.indexOf(ObservationsBlockParser.headLine) === 0){ return true; }
	if(line.indexOf("  limit limit     0     1     2     3     4") === 0){ return true; }
	if(line.indexOf(" All hkl") === 0){
		this.shells.total = line.trim().split(/\s+/)[12] * 1;
		return false;
	}
	this.shells.push(line.trim().split(/\s+/)[12] * 1);
	return true;
};

// for get redundancies
function RedundancyBlockParser() { this.shells = []; }
RedundancyBlockParser.headLine = "     Shell       Average Redundancy Per Shell";
RedundancyBlockParser.prototype.addLine = function(line) {
	if(line.indexOf(RedundancyBlockParser.headLine) === 0){ return true; }
	if(line.indexOf("  Lower Upper") === 0 || line.indexOf("  limit limit") === 0){ return true; }
	if(line.indexOf("  All hkl") === 0){
		this.shells.total = line.trim().split(/\s+/)[2] * 1;
		return false;
	}
	this.shells.push(line.trim().split(/\s+/)[2] * 1);
	return true;
};

// for completeness
function CompletenessBlockParser() { this.shells = []; }
CompletenessBlockParser.headLine = "  Lower Upper      % of of reflections with I / Sigma less than";
CompletenessBlockParser.prototype.addLine = function(line) {
	if(line.indexOf(CompletenessBlockParser.headLine) === 0){ return true; }
	if(line.indexOf("  limit limit") === 0){ return true; }
	if(line.indexOf(" All hkl") === 0){
		this.shells.total = line.trim().split(/\s+/)[10] * 1;
		return false;
	}
	this.shells.push(line.trim().split(/\s+/)[10] * 1);
	return true;
};

// for summary
function SummaryBlockParser() { this.shells = []; }
SummaryBlockParser.headLine = " Shell Lower Upper Average      Average     Norm. Linear Square";
SummaryBlockParser.prototype.addLine = function(line) {
	if(line.indexOf(SummaryBlockParser.headLine) === 0){ return true; }
	if(line.indexOf(" limit    Angstrom       I   error   stat. Chi**2  R-fac  R-fac") === 0){ return true; }
	if(line.indexOf("  All reflections") === 0){
		this.shells.total = line.trim().split(/\s+/).map(function(x){ return x * 1; });
		return false;
	}
	this.shells.push(line.trim().split(/\s+/).map(function(x){ return x * 1; }));
	return true;
};

// for total observations
function TotalObservationsParser() { this.all = this.over1 = -1; }
TotalObservationsParser.headLine = " All films";
TotalObservationsParser.prototype.addLine = function(line) {
	var items = line.trim().split(/\s+/);
	this.all = items[2] * 1;
	this.over1 = items[3] * 1;
	return false;
};

// for systematic absences
function SystematicAbsencesParser() { this.absences = []; this._chk = false; }
SystematicAbsencesParser.headLine = "     Intensities of systematic absences";
SystematicAbsencesParser.prototype.addLine = function(line) {
	if(line.indexOf(SystematicAbsencesParser.headLine) === 0){ return true; }
	if(line.indexOf("      h   k   l  Intensity     Sigma   I/Sigma") === 0){ return true; }
	if(line.trim() === ""){ this._chk = !this._chk; return this._chk; }
	this.absences.push(line.trim());
	return true;
};

// for cell and mosaicity ...
function RefinementParser() { this.films = new FilmArray(); }
RefinementParser.headLine = " Film #       a       b       c   alpha    beta   gamma    crysz    crysy    crysx mosaicity";
RefinementParser.prototype.addLine = function(line) {
	if(line.indexOf(RefinementParser.headLine) === 0){ return true; }
	if(line.indexOf(" Unit cell volume") === 0){ return false; }
	var film = FilmParameter.fromScalepack(line);
	this.films.push(film);
	return true;
}

function FilmParameter() {}
FilmParameter.fromScalepack = function(line) {
	var items = line.trim().split(/\s+/);
	var obj = new FilmParameter();
	obj.no			= items[0] * 1;
	obj.a			= items[1] * 1;
	obj.b			= items[2] * 1;
	obj.c			= items[3] * 1;
	obj.alpha		= items[4] * 1;
	obj.beta		= items[5] * 1;
	obj.gamma		= items[6] * 1;
	obj.crystalZ	= items[7] * 1;
	obj.crystalY	= items[8] * 1;
	obj.crystalX	= items[9] * 1;
	obj.mosaicity	= items[10] * 1;
	return obj;
};

function FilmArray() { this.clearCache(); }
FilmArray.prototype = new ExtArray();
(function() {
	var ns = ["no", "a", "b", "c", "alpha", "beta", "gamma", "crystalZ", "crystalY", "crystalX", "mosaicity"];
	for(var j=0;j<ns.length;j++){
		var name = ns[j];
		Object.defineProperty(FilmArray.prototype, "max" + name[0].toUpperCase() + name.slice(1),
			{get: (function(n) { return function() { return Math.max.apply({}, this.getArray(n)); }; })(name)}
		);
		Object.defineProperty(FilmArray.prototype, "min" + name[0].toUpperCase() + name.slice(1),
			{get: (function(n) { return function() { return Math.min.apply({}, this.getArray(n)); }; })(name)}
		);
		Object.defineProperty(FilmArray.prototype, "mean" + name[0].toUpperCase() + name.slice(1),
			{get: (function(n) { return function() { return this.mean(n); }; })(name)}
		);
	}
})();

function ShellRange() {}
(function() {
	var a = [
		"lowerLimit", "upperLimit", "meanI", "meanSigma", "meanIoverSigma",
		"count", "redundancy", "completeness", "chi2", "Rmerge", "RmergeSq"
	];
	for(var i=0;i<a.length;i++){
		Object.defineProperty(ShellRange.prototype, a[i], {value:null, writable:true, enumerable:true});
	}
})();
Object.defineProperty(ShellRange.prototype, "resolution", {get: function() { return (this.lowerLimit + this.upperLimit) / 2; }});

// ResolutionShells
function ScalepackShellArray(res) {
	var summaries = res[SummaryBlockParser][0].shells;
	var n;
	for(var i=0;i<=summaries.length;i++){
		if(i === summaries.length){ n = "total"; this.total = new ShellRange(); }
		else{ n = i; this.push(new ShellRange()); }
		this[n].lowerLimit	= summaries[n][0];
		this[n].upperLimit	= summaries[n][1];
		this[n].meanI		= summaries[n][2];
		this[n].meanSigma	= summaries[n][3];
		this[n].chi2		= summaries[n][5];
		this[n].Rmerge		= summaries[n][6];
		this[n].RmergeSq	= summaries[n][7];
		this[n].count		= res[ObservationsBlockParser][0].shells[n];
		this[n].redundancy	= res[RedundancyBlockParser][0].shells[n];
		this[n].completeness= res[CompletenessBlockParser][0].shells[n];
	}
}
ScalepackShellArray.prototype = new Array();	// inheriting Array
