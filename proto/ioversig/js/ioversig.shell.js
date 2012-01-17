// Shell object -- 2011-12-28
function ShellRange() {
	this.reflections = [];
	this.fromLog = { redundancy:-1, count:-1 };
}
ShellRange.prototype.getLowerLimit = function() { return this.reflections[this.reflections.length - 1].resolution; };
ShellRange.prototype.getUpperLimit = function() { return this.reflections[0].resolution; };
ShellRange.prototype.getResolution = function() { return (this.getLowerLimit() + this.getUpperLimit()) / 2; };
ShellRange.prototype.getAverageIntensity = function() {
	var intensity = 0;
	for(var i=0;i<this.reflections.length;i++){ intensity += this.reflections[i].intensity; }
	return intensity / this.reflections.length;
};
ShellRange.prototype.getAverageSigma = function() {
	var sigma = 0;
	for(var i=0;i<this.reflections.length;i++){ sigma += this.reflections[i].sigma; }
	return sigma / this.reflections.length;
};
ShellRange.prototype.getIoverSigma = function() {
	var ios = 0;
	for(var i=0;i<this.reflections.length;i++){ ios += this.reflections[i].iOverSigma; }
	return ios / this.reflections.length;
};
ShellRange.prototype.toCSV = function(digits) {
	var cols = [];
	digits = (digits === undefined ? 3 : digits);
	cols.push(this.getLowerLimit().toFixed(2));
	cols.push(this.getUpperLimit().toFixed(2));
	cols.push(this.getAverageIntensity().toFixed(digits));
	cols.push(this.getAverageSigma().toFixed(digits));
	cols.push((this.getAverageIntensity() / this.getAverageSigma()).toFixed(digits));
	cols.push(this.getIoverSigma().toFixed(digits));
	cols.push(this.reflections.length);
	return cols.join(",");
};

// Parsers
// for counting reflections
function ObservationsBlockParser() { this.shells = [], this.total = -1; }
ObservationsBlockParser.headLine = "  Lower Upper      No. of reflections with given No. of observations";
ObservationsBlockParser.prototype.addLine = function(line) {
	if(line.indexOf(ObservationsBlockParser.headLine) === 0){ return true; }
	if(line.indexOf("  limit limit     0     1     2     3     4") === 0){ return true; }
	if(line.indexOf(" All hkl") === 0){
		this.total = line.trim().split(/\s+/)[12] * 1;
		return false;
	}
	this.shells.push(line.trim().split(/\s+/)[12] * 1);
	return true;
};

// for get redundancies
function RedundancyBlockParser() { this.shells = [], this.total = -1; }
RedundancyBlockParser.headLine = "     Shell       Average Redundancy Per Shell";
RedundancyBlockParser.prototype.addLine = function(line) {
	if(line.indexOf(RedundancyBlockParser.headLine) === 0){ return true; }
	if(line.indexOf("  Lower Upper") === 0 || line.indexOf("  limit limit") === 0){ return true; }
	if(line.indexOf("  All hkl") === 0){
		this.total = line.trim().split(/\s+/)[2] * 1;
		return false;
	}
	this.shells.push(line.trim().split(/\s+/)[2] * 1);
	return true;
};

// for completeness
function CompletenessBlockParser() { this.shells = [], this.total = -1; }
CompletenessBlockParser.headLine = "  Lower Upper      % of of reflections with I / Sigma less than";
CompletenessBlockParser.prototype.addLine = function(line) {
	if(line.indexOf(CompletenessBlockParser.headLine) === 0){ return true; }
	if(line.indexOf("  limit limit") === 0){ return true; }
	if(line.indexOf(" All hkl") === 0){
		this.total = line.trim().split(/\s+/)[10] * 1;
		return false;
	}
	this.shells.push(line.trim().split(/\s+/)[10] * 1);
	return true;
};

// for summary
function SummaryBlockParser() { this.shells = [], this.total = []; }
SummaryBlockParser.headLine = " Shell Lower Upper Average      Average     Norm. Linear Square";
SummaryBlockParser.prototype.addLine = function(line) {
	if(line.indexOf(SummaryBlockParser.headLine) === 0){ return true; }
	if(line.indexOf(" limit    Angstrom       I   error   stat. Chi**2  R-fac  R-fac") === 0){ return true; }
	if(line.indexOf("  All reflections") === 0){ this.total = line.trim().split(/\s+/); return false; }
	this.shells.push(line.trim().split(/\s+/));
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
SystematicAbsencesParser.headLine = "     Intensities of systematic absences"
SystematicAbsencesParser.prototype.addLine = function(line) {
	if(line.indexOf(SystematicAbsencesParser.headLine) === 0){ return true; }
	if(line.indexOf("      h   k   l  Intensity     Sigma   I/Sigma") === 0){ return true; }
	if(line.trim() === ""){ this._chk = !this._chk; return this._chk; }
	this.absences.push(line.trim());
	return true;
};
	
// Shell results from SCALEPACK log
function LogShellRange(res, idx, isTotal) {
	var summary;
	if(isTotal){
		summary = res[SummaryBlockParser].total.slice();
		summary[0] = res[SummaryBlockParser].shells[0][0];
		summary[1] = res[SummaryBlockParser].shells[res[SummaryBlockParser].shells.length - 1][1];
		Object.defineProperties(this, {
			count		: {value:res[ObservationsBlockParser].total, writable:false},
			redundancy	: {value:res[RedundancyBlockParser].total, writable:false},
			completeness: {value:res[CompletenessBlockParser].total, writable:false}
		});
	}else{
		summary = res[SummaryBlockParser].shells[idx];
		Object.defineProperties(this, {
			count		: {value:res[ObservationsBlockParser].shells[idx], writable:false},
			redundancy	: {value:res[RedundancyBlockParser].shells[idx], writable:false},
			completeness: {value:res[CompletenessBlockParser].shells[idx], writable:false}
		});
	}
	Object.defineProperties(this, {
		lowerLimit	: {value:summary[0], writable:false},
		upperLimit	: {value:summary[1], writable:false},
		intensity	: {value:summary[2], writable:false},
		sigma		: {value:summary[3], writable:false},
		chi2		: {value:summary[5], writable:false},
		rmerge		: {value:summary[6], writable:false},
		rSq			: {value:summary[7], writable:false}
	});
	Object.defineProperties(this, {
		resolution	: {value:(this.lowerLimit * 1 + this.upperLimit * 1) / 2, writable:false},
		iOverSigma	: {value:this.intensity / this.sigma, writable:false}
	});
}

// ResolutionShells
function LogShells() {}
LogShells.prototype = new Array();	// inherit Array
LogShells.fromScalepack = function(logLines) {
	var chk = 0, parser = null, res = {},
		parserClasses = [
			ObservationsBlockParser, RedundancyBlockParser, CompletenessBlockParser,
			SummaryBlockParser, TotalObservationsParser, SystematicAbsencesParser
		];
	
	for(var i=0;i<logLines.length;i++){	// parsing scalepack log
		var line = logLines[i];
		if(parser){
			if(!parser.addLine(line)){ res[parser.constructor] = parser; parser = null; }
		}else{
			for(var j=0;j<parserClasses.length;j++){
				if(line.indexOf(parserClasses[j].headLine) === 0){
					parser = new parserClasses[j]();
					if(!parser.addLine(line)){ res[parser.constructor] = parser; parser = null; }
					break;
				}
			}
		}
	}

	var obj = new LogShells();
	for(var i=0;i<res[SummaryBlockParser].shells.length;i++){ obj.unshift(new LogShellRange(res, i, false)); }
	obj.total = new LogShellRange(res, 0, true);
	obj.allObservations = res[TotalObservationsParser].all;
	obj.observationsOver1 = res[TotalObservationsParser].over1;
	obj.absenceLines = (res.hasOwnProperty(SystematicAbsencesParser) ? res[SystematicAbsencesParser].absences.slice() : []);
	return obj;
};

function ResolutionShells() {}
ResolutionShells.prototype = new Array();
ResolutionShells.fromSca = function(sca, logShells) {
	var obj = new ResolutionShells(),
		n = 0, cnt;
	for(var i=0;i<logShells.length;i++){
		cnt = logShells[i].count;
		obj.push(new ShellRange());
		while(cnt > 0){
			obj[obj.length-1].reflections.push(sca.reflections[n]);
			cnt--; n++;
		}
	}
	return obj;
};
