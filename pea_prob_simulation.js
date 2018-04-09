'use strict';

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

  trialClassOneProportion(trialInd) {
      return d3.mean(this.data[trialInd].map(e => e === this.classOne));
  }

  reloadData() {
    this.data = this._randomTrials();
    this._longFormData = undefined;
  }
}

class PeaTrialVis {
  constructor (svgWidth, svgHeight) {
    // todo declare all of the expected attributes here
    this.svgWidth = svgWidth;
    this.svgHeight = svgHeight;
    // todo fine tune this parameters
    this.peaRadius = 16;
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
    this.container.selectAll('image').remove();
    this.drawPeas();
  }

  drawPeas() {
    this.container.selectAll('image')
                  .data(this.data)
                  .enter()
                  .append('svg:image')
                    .attr('x', d => (2*d.peaIndex + 1) * this.peaRadius + d.peaIndex * this.horizontalPad)
                    .attr('y', d => (2*d.trialIndex + 1) * this.peaRadius + d.trialIndex * this.verticalPad)
                    .attr('height', this.peaRadius * 2)
                    .attr('width', this.peaRadius * 2)
                    .attr('shape-rendering', 'crispEdges')
                    .attr('xlink:href', d => d.color == this.peaTrials.classOne?
                          './imgs/calm_green_pea.png' : './imgs/calm_yellow_pea.png')
  }

  sortPeasByColor() {
    this.container.selectAll('image')
                  .sort((d1, d2) => d1.trialIndex == d2.trialIndex? d1.color > d2.color: false)
                  .transition('color-sort')
                  .duration(1000)
                  .delay((d, i) => i % this.peaTrials.peasPerTrial * 20)
                  .attr('x', (d, i) => {let ind = i % this.peaTrials.peasPerTrial;
                                        return (2 * ind + 1) * this.peaRadius + ind * this.horizontalPad});
  }

  sortTrialsByProportion() {
    const transition = this.container.selectAll('image')
                  .sort((d1, d2) => d1.trialIndex == d2.trialIndex?
                                    false :
                                    this.peaTrials.trialClassOneProportion(d1.trialIndex) >
                                    this.peaTrials.trialClassOneProportion(d2.trialIndex))
                  .transition('prop-sort')
                  .duration(1000)
                  .delay((d, i) => Math.floor(i / this.peaTrials.peasPerTrial) * 20)
                  .attr('y', (d, i) => {let ind = Math.floor(i / this.peaTrials.peasPerTrial);
                                         return (2 * ind + 1) * this.peaRadius + ind * this.verticalPad;});
    return transition;
  }

  // todo at the moment olny works after 'sortPeasByColor' was applied
  showUnmatched(transition) {
    let classOneInTrial, unmatched, counter = 0,
        expectedClassOne = this.peaTrials.classOneProb * this.peaTrials.peasPerTrial;
    transition.transition()
              .delay((d, i) => 30 * (i % this.peaTrials.peasPerTrial))
              .attr('xlink:href',
                    (d, i) => {
                      classOneInTrial = (this.peaTrials.trialClassOneProportion(d.trialIndex) *
                                         this.peaTrials.peasPerTrial);
                      unmatched = classOneInTrial - expectedClassOne;
                      if (d.color == this.peaTrials.classOne) {
                        return i % this.peaTrials.peasPerTrial + 1 > expectedClassOne?
                               './imgs/sad_green_pea.png' : './imgs/glad_green_pea.png';
                      } else {
                        return i % this.peaTrials.peasPerTrial - expectedClassOne < 0?
                               './imgs/sad_yellow_pea.png' : './imgs/glad_yellow_pea.png';
                      };
                    })
  }
}

let vis = new PeaTrialVis(950, 450);
vis.reloadData(10, 16, .5);
vis.drawPeas();

// todo use dispatcher
d3.select('#reload-pea-simulation').on('click', e => vis.reload());
d3.select('#sort-by-color').on('click', e => vis.sortPeasByColor());
d3.select('#sort-by-prop').on('click', e => {
  const trans = vis.sortTrialsByProportion();
  vis.showUnmatched(trans);
});
