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
  for (let i=1; i <= peaSeq.length; i++) {
    stepState = peaSeq.slice(0, i).sort((d1, d2) => d1.color > d2.color ? 1 : -1)
    stepState = stepState.map((p, j) => ({
      ind: j, color: p.color, step: i,
      xCoef: xCoef
    }));
    expandedSeq = expandedSeq.concat(stepState);
    xCoef += 1 / (i * 2) + 1 / ((i + 1) * 2);
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
    this.peaGroup
        .selectAll('circle')
        .data(peaStepSeq, (d, i) => i)
        .enter().append('circle')
          .attr('fill', d => d.color)
          .attr('r', d => this.svgHeight / d.step/ 2)
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
    const numPeasInculeded = stepSlice(stepNum).start;
    this.drawPeas(peaStepSeq.slice(0, numPeasInculeded));
  }

  transitionStep() {
    // move from prev step to the next with same peas
    // clear a space for a new pea
    // add a new pea
  }
}


let peaSeqSteps = expandPeaSeq(getRandomPeaSeq(145));
let peasPic = new RandomPeas(1115, 200, 'white', '#017A57');
let steps = 0;
d3.select('#add-a-pea')
  .on('click', function() {
    steps += 1;
    peasPic.drawStepsTill(peaSeqSteps, steps);
  });
peasPic.drawMiddleLine();
