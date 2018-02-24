'use strict';

function getRandomPea() {
  const options = ['#A9CF46', '#FFCC2A'];
  return Math.random() >= .5? options[0] : options[1];
}

function getRandomPeaSeq(count) {
  const peaSeq = [];
  for (let i = 0; i < count; i++) {
    peaSeq.push({
      'ind': i,
      'color': getRandomPea(),
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
        // todo this hardcoded color is no good
        if (pea.color !== '#A9CF46') {
          sortedStepState.push(pea);
        } else {
          sortedStepState.unshift(pea);
        }
    };
    stepState = sortedStepState.map((p, j) => ({
      ind: j, color: p.color, step: step,
      xCoef: xCoef, isNew: p.ind === step - 1,
      id: step + '.' + p.ind,
    }));
    expandedSeq = expandedSeq.concat(stepState);
    xCoef += 1 / (step * 2) + 1 / ((step + 1) * 2);
  };
  return expandedSeq;
}

class RandomPeas {
  constructor (svgWidth, svgHeight, middleLineColor, backgroundColor,) {
    this.svgWidth = svgWidth;
    this.svgHeight = svgHeight;
    this.backgroundColor = backgroundColor;
    this.middleLineColor = middleLineColor;
    this.svg = d3.select('#pea-probability')
                 .append('svg')
                   .attr('height', this.svgHeight)
                   .attr('width', this.svgWidth);
    this.addBackground();
    this.peaGroup = this.svg.append('g').attr('id', 'pea-group');
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
           .transition('new-pea').duration(0)
           .attr('id', d => d.id)
           .attr('fill', d => d.color)
           .attr('r', d => this.svgHeight / d.step / 2)
           .attr('cx', d => d.xCoef * this.svgHeight)
           .attr('cy', d => (this.svgHeight / d.step / 2)  * 2 * (d.ind + .5));
  }

  drawMiddleLine() {
    this.svg.append('line')
            .attr('x1', 0).attr('y1', this.svgHeight / 2)
            .attr('x2', this.svgWidth).attr('y2', this.svgHeight / 2)
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
      ind: d.color == '#FFCC2A'? d.ind -1 : d.ind,
      color: d.color,
      step: d.step - 1,
      isNew: d.isNew,
      id: d.id,
      // todo make a function for this shit beacause i don't understand it
      xCoef: d.xCoef - 1 / ((stepNum - 1) * 2) - 1 / (stepNum * 2)
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
                 .attr('cx', d => d.xCoef * this.svgHeight)
               .transition().duration(500)
                 .attr('r', d => this.svgHeight / d.step / 2)
                 .attr('cy', d => (this.svgHeight / d.step / 2)  * 2 * (d.ind + .5));
    // todo chain transitions
    updateGroup.enter().append('circle')
          .attr('id', d => d.totalInd)
          .attr('fill', d => d.color)
          .classed('new', d => d.isNew)
          .attr('r', 0)
          .attr('id', d => d.id)
          .attr('cx', d => d.xCoef * self.svgHeight)
          .attr('cy', d => (self.svgHeight / d.step / 2)  * 2 * (d.ind + .5))
          .transition(newPeaTransition).transition().duration(900)
          .attr('r', d => self.svgHeight / d.step / 2);
  }

  transitionStep() {
    // move from prev step to the next with same peas
    // clear a space for a new pea
    // add a new pea
  }
}


let peaSeqSteps = expandPeaSeq(getRandomPeaSeq(145));
let peasPic = new RandomPeas(1115, 200, '#017A57', 'white');
let steps = 0;
d3.select('#add-a-pea')
  .on('click', function() {
    steps += 1;
    peasPic.drawStepsTill(peaSeqSteps, steps);
  });
peasPic.drawMiddleLine();
