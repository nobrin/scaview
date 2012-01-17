// Table decrators -- 2011-12-28
// MyTableDcorator
function MyTableDecorator(tbl) { this.tbl = tbl; }
MyTableDecorator.prototype.clear = function() {
	while(this.tbl.tBodies[0].childNodes.length){ this.tbl.tBodies[0].removeChild(this.tbl.tBodies[0].childNodes[0]); }
	while(this.tbl.tFoot.childNodes.length){ this.tbl.tFoot.removeChild(this.tbl.tFoot.childNodes[0]); }
};

// ResultTableDecorator
function ResultTableDecorator(tbl) { this.tbl = tbl; }
ResultTableDecorator.prototype = new MyTableDecorator();
ResultTableDecorator.prototype.addShell = function(shell) {
	var tr = document.createElement("tr");
	for(var i=0;i<7;i++){ tr.appendChild(document.createElement("td")); }
	tr.childNodes[0].textContent = shell.getLowerLimit().toFixed(2);
	tr.childNodes[1].textContent = shell.getUpperLimit().toFixed(2);
	tr.childNodes[2].textContent = shell.getAverageIntensity().toFixed(1);
	tr.childNodes[3].textContent = shell.getAverageSigma().toFixed(1);
	tr.childNodes[4].textContent = (shell.getAverageIntensity() / shell.getAverageSigma()).toFixed(1);
	tr.childNodes[5].textContent = shell.getIoverSigma().toFixed(1);
	tr.childNodes[6].textContent = shell.reflections.length;
	this.tbl.tBodies[0].appendChild(tr);
};
ResultTableDecorator.prototype.addTotal = function(sca) {
	var tr = document.createElement("tr");
	for(var i=0;i<7;i++){ tr.appendChild(document.createElement("td")); }
	tr.childNodes[0].textContent = "All";
	tr.childNodes[2].textContent = sca.getAverageIntensity().toFixed(1);
	tr.childNodes[3].textContent = sca.getAverageSigma().toFixed(1);
	tr.childNodes[4].textContent = (sca.getAverageIntensity() / sca.getAverageSigma()).toFixed(1);
	tr.childNodes[5].textContent = sca.getAverageIoverSigma().toFixed(1);
	tr.childNodes[6].textContent = sca.reflections.length;
	this.tbl.tFoot.appendChild(tr);
};

// LogTableDecorator
function LogTableDecorator(tbl) { this.tbl = tbl; }
LogTableDecorator.prototype = new MyTableDecorator();
LogTableDecorator.prototype.addShell = function(shell, calcShell) {
	var tr = document.createElement("tr");
	for(var i=0;i<13;i++){ tr.appendChild(document.createElement("td")); }
	tr.childNodes[0].textContent = shell.lowerLimit;
	tr.childNodes[1].textContent = shell.upperLimit;
	tr.childNodes[2].textContent = shell.intensity;
	tr.childNodes[4].textContent = shell.sigma;
	tr.childNodes[6].textContent = (shell.intensity / shell.sigma).toFixed(1);
	tr.childNodes[8].textContent = shell.redundancy.toFixed(1);
	tr.childNodes[9].textContent = shell.rmerge;
	tr.childNodes[10].textContent = shell.rSq;
	tr.childNodes[11].textContent = shell.completeness.toFixed(1);
	tr.childNodes[12].textContent = shell.count;

	// Calculating difference with calculated results
	var intensity = shell.intensity * 1 - calcShell.getAverageIntensity();
	if(Math.abs(intensity) < 0.05){ intensity = 0; }
	var sigma = shell.sigma * 1 - calcShell.getAverageSigma();
	if(Math.abs(sigma) < 0.05){ sigma = 0; }
	var ios = (shell.intensity / shell.sigma) - (calcShell.getAverageIntensity() / calcShell.getAverageSigma());
	if(Math.abs(ios) < 0.05){ ios = 0; }
	tr.childNodes[3].textContent = intensity === 0 ? "" : intensity.toFixed(1);
	tr.childNodes[5].textContent = sigma === 0 ? "" : sigma.toFixed(1);
	tr.childNodes[7].textContent = ios === 0 ? "" : ios.toFixed(1);
	this.tbl.tBodies[0].appendChild(tr);
};
LogTableDecorator.prototype.addTotal = function(shell, sca) {
	var tr = document.createElement("tr");
	for(var i=0;i<13;i++){ tr.appendChild(document.createElement("td")); }
	tr.childNodes[0].textContent = "All";
	tr.childNodes[2].textContent = shell.intensity;
	tr.childNodes[4].textContent = shell.sigma;
	tr.childNodes[6].textContent = (shell.intensity / shell.sigma).toFixed(1);
	tr.childNodes[8].textContent = shell.redundancy.toFixed(1);
	tr.childNodes[9].textContent = shell.rmerge;
	tr.childNodes[10].textContent = shell.rSq;
	tr.childNodes[11].textContent = shell.completeness.toFixed(1);
	tr.childNodes[12].textContent = shell.count;

	// Calculating difference with calculated results
	var intensity = shell.intensity * 1 - sca.getAverageIntensity();
	if(Math.abs(intensity) < 0.05){ intensity = 0; }
	var sigma = shell.sigma * 1 - sca.getAverageSigma();
	if(Math.abs(sigma) < 0.05){ sigma = 0; }
	var ios = (shell.intensity / shell.sigma) - (sca.getAverageIntensity() / sca.getAverageSigma());
	if(Math.abs(ios) < 0.05){ ios = 0; }
	tr.childNodes[3].textContent = intensity === 0 ? "" : intensity.toFixed(1);
	tr.childNodes[5].textContent = sigma === 0 ? "" : sigma.toFixed(1);
	tr.childNodes[7].textContent = ios === 0 ? "" : ios.toFixed(1);
	this.tbl.tFoot.appendChild(tr);
};

