'use strict';

function getRandomPea() {
  // todo make this work for any number of types
  const types = ['green', 'yellow'];
  return Math.random() >= .5? types[0] : types[1];
}

function getRandomPeaSeq(count) {
  const peaSeq = [];
  for (let i = 0; i < count; i++) {
    peaSeq.push({
      'ind': i,
      'peaType': getRandomPea(),
    });
  };
  return peaSeq;
}

/**
 * given the index of a step returns it's start and end
 * in a sequence where each step is one pea longer than the previous
 */
function stepSlice(stepNum) {
  const start = (stepNum - 1) * stepNum / 2;
  return {
    start: start,
    end: start + stepNum,
  };
}

/**
 * x positions of the circles follow something like the harmonic numbers pattern
 * this function allows to compute the next or the previous value given
 * the current value and the step index.
 */
function getXCoeficient(stepInd, currVal, stepOffset=1) {
  if (Math.abs(stepOffset) != 1) {
    throw "At this time function only supports 1 or -1 as stepOffset value";
  }
  return currVal + 1 / (stepInd * 2) * stepOffset
                 + 1 / ((stepInd + 1) * 2) * stepOffset;
}


/**
 * from sequence of peas to expanded list with state of
 * peaSeq at each step
 */
function expandPeaSeq(peaSeq) {
  let expandedSeq = [], stepState, xCoef=0.5;
  let sortedStepState = [];
  for (let step=1; step <= peaSeq.length; step++) {
    sortedStepState = [];
    stepState = peaSeq.slice(0, step).reverse();
    for (let pea of stepState) {
        // todo this hardcoded peaType is no good
        if (pea.peaType !== 'green') {
          sortedStepState.push(pea);
        } else {
          sortedStepState.unshift(pea);
        }
    };
    stepState = sortedStepState.map((p, j) => ({
      ind: j,
      peaType: p.peaType,
      step: step,
      xCoef: xCoef,
      isNew: p.ind === step - 1,
      id: step + '.' + p.ind,
    }));
    expandedSeq = expandedSeq.concat(stepState);
    xCoef = getXCoeficient(step, xCoef);
  };
  return expandedSeq;
}

class RandomPeas {
  constructor (svgWidth, svgHeight, middleLineColor, backgroundColor,) {
    this.svgWidth = svgWidth;
    this.svgHeight = svgHeight;
    this.padding = {'top': 10, 'right': 0, 'bottom': 10, 'left': 10};
    this.width = this.svgWidth - this.padding.right - this.padding.left;
    this.height = this.svgHeight - this.padding.top - this.padding.bottom;
    this.backgroundColor = backgroundColor;
    this.middleLineColor = middleLineColor;
    this.svg = d3.select('#pea-probability')
                 .append('svg')
                   .attr('height', this.svgHeight)
                   .attr('width', this.svgWidth);
    this.addBackground();
    this.container = this.svg.append('g')
                             .attr('id', 'pea-group')
                             .attr('transform', 'translate('+ this.padding.left + ',' + this.padding.top + ')');
    this.peaGroup = this.container.append('g').attr('id', 'pea-group');
  }

  addBackground() {
    if (this.backgroundColor) {
      this.svg.append('rect')
              .attr('width', '100%')
              .attr('height', '100%')
              .attr('fill', this.backgroundColor);
    }
  }

  drawPeas(peaStepSeq) {
    const circles = this.peaGroup
                        .selectAll('circle')
                        .data(peaStepSeq, d => d.id);
    circles.enter().append('circle')
           .merge(circles)
           .classed('new', d => d.isNew)
           .classed('green-pea', d => d.peaType === 'green')
           .classed('yellow-pea', d => d.peaType === 'yellow')
           .transition('new-pea').duration(0)
           .attr('id', d => d.id)
           .attr('r', d => this.height / d.step / 2 - 1)
           .attr('cx', d => d.xCoef * this.height)
           .attr('cy', d => (this.height / d.step / 2)  * 2 * (d.ind + .5));
  }

  drawMiddleLine() {
    this.container
            .append('line')
              .attr('x1', 0).attr('y1', this.height / 2)
              .attr('x2', this.width).attr('y2', this.height / 2)
              .attr('stroke', this.middleLineColor).attr('stroke-width', '1px');
  }

  drawStepsTill(peaStepSeq, stepNum) {
    const self = this;
    const stepBounds = stepSlice(stepNum);
    const currStep = peaStepSeq.slice(stepBounds.start, stepBounds.end);
    // todo is this stupid? think about it
    const shiftedCurrStep = currStep
    .filter(d => !d.isNew)
    .map(d => ({
      ind: d.peaType === 'yellow'? d.ind -1 : d.ind,
      peaType: d.peaType,
      step: d.step - 1,
      isNew: d.isNew,
      id: d.id,
      xCoef: getXCoeficient(stepNum - 1, d.xCoef, -1),
    }));
    const toDraw = peaStepSeq.slice(0, stepBounds.start).concat(shiftedCurrStep);
    //console.log(stepNum);
    //console.log(shiftedCurrStep);
    this.drawPeas(toDraw);
    const newPeaTransition = this.peaGroup.transition('new-pea');
    let updateGroup = this.peaGroup.selectAll('circle')
                          .data(peaStepSeq.slice(0, stepBounds.end), d => d.id)
    const tr = updateGroup.classed('new', d => d.isNew)
                 .attr('id', d => d.id)
               .transition(newPeaTransition).duration(500)
                 .attr('cx', d => d.xCoef * this.height)
               .transition().duration(500)
                 .attr('r', d => this.height / d.step / 2 - 1)
                 .attr('cy', d => (this.height / d.step / 2)  * 2 * (d.ind + .5));
    // todo chain transitions
    updateGroup.enter().append('circle')
          .classed('green-pea', d => d.peaType === 'green')
          .classed('yellow-pea', d => d.peaType === 'yellow')
          .attr('id', d => d.totalInd)
          .classed('new', d => d.isNew)
          .attr('r', 0)
          .attr('id', d => d.id)
          .attr('cx', d => d.xCoef * self.height)
          .attr('cy', d => (self.height / d.step / 2)  * 2 * (d.ind + .5))
          .transition(newPeaTransition).transition().duration(900)
          .attr('r', d => self.height / d.step / 2 - 1);
  }
}


let peaSeqSteps = expandPeaSeq(getRandomPeaSeq(145));
let peasPic = new RandomPeas(1125, 220, '#017A57', 'white');
let steps = 0;
d3.select('#add-a-pea')
  .on('click', function() {
    steps += 1;
    peasPic.drawStepsTill(peaSeqSteps, steps);
  });
peasPic.drawMiddleLine();
