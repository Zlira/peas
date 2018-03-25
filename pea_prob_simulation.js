'use strict';

// todo make a class for data
function randomPea(classOneProb) {
  if (!classOneProb) {
    classOneProb = .5;
  };
  const classes = ['green', 'yellow'];
  return Math.random() < classOneProb? classes[0] : classes[1];
}

function randomTrial(peaNum, classOneProb) {
  const peas = [];
  for (let i = 0; i < peaNum; i++) {
    peas.push(randomPea(classOneProb));
  }
  return peas;
}

function randomTrials(trialNum, peasPerTrial, classOneProb) {
  const trials = [];
  for (let i=0; i < trialNum; i++) {
    trials.push(randomTrial(peasPerTrial, classOneProb));
  }
  return trials;
}

function toLongForm(trials) {
  const longFormTrials = [];
  for (let trialIndex=0; trialIndex < trials.length; trialIndex++) {
    for (let peaIndex=0; peaIndex < trials[trialIndex].length; peaIndex++) {
      longFormTrials.push({
        'trialIndex': trialIndex, 'peaIndex': peaIndex,
        'color': trials[trialIndex][peaIndex]
      });
    };
  };
  return longFormTrials;
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
    this.trialsNum = trialsNum;
    this.peasPerTrial = peasPerTrial;
    this.classOneProb = classOneProb;
    this.data = toLongForm(randomTrials(trialsNum, peasPerTrial, classOneProb));
  }

  reload() {
    this.reloadData(this.trialsNum, this.peasPerTrial, this.classOneProb);
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
                  .attr('cx', (d, i) => {let ind = i % this.peasPerTrial;
                                         return (2 * ind + 1) * this.peaRadius + ind * this.horizontalPad});
  }

  sortTrialsByProportion() {

  }
}

let vis = new PeaTrialVis(950, 450);
vis.reloadData(10, 6, .5);
vis.drawPeas();
