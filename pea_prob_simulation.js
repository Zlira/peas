'use strict';

// todo make a class for data
class peaTrialsData {
  constructor (trialsNum, peasPerTrial, classOneProb) {
    if (!classOneProb) {
      classOneProb = .5;
    };
    this.trialsNum = trialsNum;
    this.peasPerTrial = peasPerTrial;
    this.classOneProb = classOneProb;
    this.classOne = 'green';
    this.classTwo = 'yellow';
    this.classes = [this.classOne, this.classTwo];
    this.data = undefined;
    this._longFormData = undefined;
  }

  _randomPea() {
    return Math.random() < this.classOneProb? this.classOne : this.classTwo;
  }

  _randomTrial() {
    const peas = [];
    for (let i = 0; i < this.peasPerTrial; i++) {
      peas.push(this._randomPea(this.classOneProb));
    }
    return peas;
  }

  _randomTrials() {
    const trials = [];
    for (let i=0; i < this.trialsNum; i++) {
      trials.push(this._randomTrial());
    }
    return trials;
  }

  get longFormData() {
    this._longFormData = [];
    for (let trialIndex=0; trialIndex < this.data.length; trialIndex++) {
      for (let peaIndex=0; peaIndex < this.data[trialIndex].length; peaIndex++) {
        this._longFormData.push({
          'trialIndex': trialIndex, 'peaIndex': peaIndex,
          'color': this.data[trialIndex][peaIndex]
        });
      };
    };
    return this._longFormData;
  }

  reloadData() {
    this.data = this._randomTrials();
    this._longFormData = undefined;
  }
}

class PeaTrialVis {
  constructor (svgWidth, svgHeight) {
    this.svgWidth = svgWidth;
    this.svgHeight = svgHeight;
    // todo fine tune this parameters
    this.peaRadius = 10;
    this.verticalPad = 10;
    this.horizontalPad = 3;
    this.initSvg();
  }

  initSvg() {
    this.svg = d3.select('#pea-prob-simulation')
                 .append('svg')
                   .attr('width', this.svgWidth)
                   .attr('height', this.svgHeight);
    this.padding = {
      'top': 10, 'right': 10, 'bottom': 10, 'left': 10,
    };
    this.width = this.svgWidth - this.padding.left - this.padding.right;
    this.height = this.svgHeight - this.padding.top - this.padding.bottom;
    this.container = this.svg.append('g')
                             .attr('id', 'pea-prob-svg-group')
                             .attr('transform',
                                   `translate(${this.padding.left}, ${this.padding.top})`);
  }

  reloadData(trialsNum, peasPerTrial, classOneProb) {
    this.peaTrials = new peaTrialsData(trialsNum, peasPerTrial, classOneProb);
    this.peaTrials.reloadData();
    this.data = this.peaTrials.longFormData;
  }

  reload(trialsNum, peasPerTrial, classOneProb) {
    if (!trialsNum) {trialsNum = this.peaTrials.trialsNum};
    if (!peasPerTrial) {peasPerTrial = this.peaTrials.peasPerTrial};
    if (!classOneProb) {classOneProb = this.peaTrials.classOneProb};
    this.reloadData(trialsNum, peasPerTrial, classOneProb);
    this.container.selectAll('circle').remove();
    this.drawPeas();
  }

  drawPeas() {
    this.container.selectAll('circle')
                  .data(this.data)
                  .enter()
                  .append('circle')
                    .attr('class', d => d.color + '-pea')
                    .attr('cx', d => (2*d.peaIndex + 1) * this.peaRadius + d.peaIndex * this.horizontalPad)
                    .attr('cy', d => (2*d.trialIndex + 1) * this.peaRadius + d.trialIndex * this.verticalPad)
                    .attr('r', this.peaRadius);
  }

  sortPeasByColor() {
    this.container.selectAll('circle')
                  .sort((d1, d2) => d1.trialIndex == d2.trialIndex? d1.color > d2.color: false)
                  .transition()
                  .duration(1000)
                  .delay((d, i) => i * 10)
                  .attr('cx', (d, i) => {let ind = i % this.peaTrials.peasPerTrial;
                                         return (2 * ind + 1) * this.peaRadius + ind * this.horizontalPad});
  }

  sortTrialsByProportion() {

  }
}

let vis = new PeaTrialVis(950, 450);
vis.reloadData(10, 6, .5);
vis.drawPeas();
