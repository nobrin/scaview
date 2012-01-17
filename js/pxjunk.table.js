// Table decrators -- 2011-12-28
// MyTableDcorator
function MyTableDecorator(tbl) { this.tbl = tbl; }
MyTableDecorator.prototype.clear = function() {
	while(this.tbl.tBodies[0].childNodes.length){ this.tbl.tBodies[0].removeChild(this.tbl.tBodies[0].childNodes[0]); }
	while(this.tbl.tFoot.childNodes.length){ this.tbl.tFoot.removeChild(this.tbl.tFoot.childNodes[0]); }
};
MyTableDecorator.prototype.addRow = function(isFoot) {
	var cnt = 0;
	var cells = this.tbl.tHead.rows[0].cells;
	for(var i=0;i<cells.length;i++){ cnt += cells[i].colSpan; }
	var tr = (isFoot ? this.tbl.tFoot.insertRow(-1) : this.tbl.tBodies[0].insertRow(-1));
	for(var i=0;i<cnt;i++){ tr.insertCell(-1); }
	return tr;
};

function LogTableDecorator(tbl) { this.tbl = tbl; }
LogTableDecorator.prototype = new MyTableDecorator();
LogTableDecorator.prototype.addShell = function(rng, isTotal) {
	var tr = this.addRow(isTotal);
	if(isTotal){
		tr.cells[0].textContent = "All";
		tr.cells[1].textContent = "";
	}else{
		tr.cells[0].textContent  = rng.lowerLimit.toFixed(2);
		tr.cells[1].textContent  = rng.upperLimit.toFixed(2);
	}
	tr.cells[2].textContent  = rng.meanI.toFixed(1);
	tr.cells[3].textContent  = rng.meanSigma.toFixed(1);
	tr.cells[4].textContent  = (rng.meanI / rng.meanSigma).toFixed(1);
	tr.cells[5].textContent  = rng.chi2.toFixed(3);
	tr.cells[6].textContent  = rng.redundancy.toFixed(1);
	tr.cells[7].textContent  = rng.Rmerge.toFixed(3);
	tr.cells[8].textContent  = rng.RmergeSq.toFixed(3);
	tr.cells[9].textContent  = rng.completeness.toFixed(1);
	tr.cells[10].textContent = rng.count;
};

function ScaTableDecorator(tbl) { this.tbl = tbl; }
ScaTableDecorator.prototype = new MyTableDecorator();
ScaTableDecorator.prototype.addShell = function(rng, refRng, isTotal) {
	var tr = this.addRow(isTotal);
	if(isTotal){
		tr.cells[0].textContent = "All";
		tr.cells[1].textContent = "";
	}else{
		tr.cells[0].textContent = rng.lowerLimit.toFixed(2);
		tr.cells[1].textContent = rng.upperLimit.toFixed(2);
	}
	tr.cells[2].textContent = rng.meanI.toFixed(1);
	tr.cells[4].textContent = rng.meanSigma.toFixed(1);
	tr.cells[6].textContent = (rng.meanI / rng.meanSigma).toFixed(1);
	tr.cells[8].textContent = rng.meanIoverSigma.toFixed(1);
	tr.cells[9].textContent = rng.length;

	// Calculating difference with calculated results
	var meanI = rng.meanI - refRng.meanI;
	if(Math.abs(meanI) < 0.05){ meanI = 0; }
	var sigma = rng.meanSigma - refRng.meanSigma;
	if(Math.abs(sigma) < 0.05){ sigma = 0; }
	var ios = (rng.meanI / rng.meanSigma) - (refRng.meanI / refRng.meanSigma);
	if(Math.abs(ios) < 0.05){ ios = 0; }
	tr.cells[3].textContent = (meanI === 0 ? "" : meanI.toFixed(1));
	tr.cells[5].textContent = (sigma === 0 ? "" : sigma.toFixed(1));
	tr.cells[7].textContent = (ios === 0 ? "" : ios.toFixed(1));
};
