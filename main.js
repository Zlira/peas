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
                             .attr('transform',
                                   'translate('+ this.padding.left + ','
                                   + this.padding.top + ')');
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

  drawMiddleLine() {
    this.container
            .append('line')
              .attr('x1', 0).attr('y1', this.height / 2)
              .attr('x2', this.width).attr('y2', this.height / 2)
              .attr('stroke', this.middleLineColor).attr('stroke-width', '1px');
  }

  bindPeaData(peaData, selection) {
    return selection.data(peaData, d => d.id);
  }

  setPeaClassesAndId(peaSelection) {
    return peaSelection.attr('id', d => d.id)
                       .classed('new', d => d.isNew)
                       // todo there's a shorter way to do this
                       .classed('green-pea', d => d.peaType === 'green')
                       .classed('yellow-pea', d => d.peaType === 'yellow');
  }

  setPeaAttrs(peaSelection, overrides={}) {
    const self = this;
    // todo cycle throught attrs didn't work for some reason
    return peaSelection.attr('cx', overrides['cx'] ||
                                   (d => d.xCoef * self.height))
                       .attr('cy', overrides['cy'] ||
                                   (d => self.height / d.step * (d.ind + .5)))
                       .attr('r', overrides['r'] ||
                                  (d => self.height / d.step / 2 - .5));
  }

  drawPeas(peaStepSeq) {
    const circles = this.bindPeaData(
      peaStepSeq, this.peaGroup.selectAll('circle')
    );
    let peaSelection = circles.enter().append('circle').merge(circles);
    peaSelection = this.setPeaClassesAndId(peaSelection);
    this.setPeaAttrs(peaSelection.transition('new-pea').duration(0));
  }

  drawStepsTill(peaStepSeq, stepNum) {
    const self = this;
    const stepBounds = stepSlice(stepNum);
    const currStep = peaStepSeq.slice(stepBounds.start, stepBounds.end);
    // todo is this stupid? think about it
    const newPea = currStep.filter(d => d.isNew)[0];
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
    this.drawPeas(toDraw);

    // transition existing peas from the previous step to the next
    const newPeaTransition = this.peaGroup.transition('new-pea');
    let updateGroup = this.bindPeaData(
      peaStepSeq.slice(0, stepBounds.end), this.peaGroup.selectAll('circle')
    );
    updateGroup = this.setPeaClassesAndId(updateGroup);
    this.setPeaAttrs(updateGroup.transition(newPeaTransition).duration(700))
        .on('interrupt', d=> {
          if (d.step === stepNum && d.ind === 0) {
            dispatcher.call('new-pea', this, newPea);
          };
        });

    // add a new pea
    let newPeas = updateGroup.enter().append('circle');
    newPeas = this.setPeaClassesAndId(newPeas);
    newPeas = this.setPeaAttrs(newPeas, {r: (d => 0)});
    newPeas.transition(newPeaTransition).transition().duration(300)
           .transition().duration(300)
           .attr('r', d => self.height / d.step / 2 - .5)
           .on('end interrupt', d => dispatcher.call('new-pea', this, d));
    ;
  }

  drawRemainingSteps(peaStepSeq) {
    // todo use call method to chain calls
    let peaCircles = this.peaGroup.selectAll('circle');
    peaCircles = this.bindPeaData(peaStepSeq, peaCircles);
    peaCircles = peaCircles.enter().append('circle');
    peaCircles = this.setPeaClassesAndId(peaCircles);
    peaCircles = this.setPeaAttrs(
      peaCircles.transition('new-pea').duration(0).delay(d => d.step * 40)
    );
    peaCircles.on('end', el => {
      if (el.isNew) {
        dispatcher.call('new-pea', this, el)
      }
    });
  }
}

class PeasCounter {
  constructor(svgWidth, svgHeight) {
    this.svgWidth = svgWidth;
    this.svgHeight = svgHeight;
    this.svg = d3.select('#pea-prob-counters')
                 .append('svg')
                   .attr('width', svgWidth)
                   .attr('height', svgHeight);
    this.addCounters();
  }

  addCounters() {
    this.counterData = [
      {'peaType': 'yellow', 'text': 0, 'yCoef': 3/4},
      {'peaType': 'green', 'text': 0, 'yCoef': 1/4},
    ]
    const groups = this.svg.selectAll('g')
                           .data(this.counterData)
                           .enter().append('g');
   groups.append('circle')
         .attr('class', d => d.peaType + '-pea')
         .classed('counter-pea', true)
         .attr('r', 50)
         .attr('cx', this.svgWidth / 2)
         .attr('cy', d => this.svgHeight * d.yCoef);
    groups.append('text')
          .attr('class', d => 'counter-text-' + d.peaType)
          .classed('counter-text', true)
          .attr('x', this.svgWidth / 2)
          .attr('y', d => this.svgHeight * d.yCoef + 3)
          .text(d => d.text + '%');
  }

  updateCounters(pea) {
    if (!pea) {return};
    for (let c of this.counterData) {
      if (c.peaType === pea.peaType) {c['text'] += 1;}
    };
    this.svg.selectAll('text.counter-text')
            .data(this.counterData)
            .transition().text(d => Math.round(d.text / pea.step * 100) + '%');
  }
}

const peas = getRandomPeaSeq(60);
const peaSeqSteps = expandPeaSeq(peas);
const peasPic = new RandomPeas(955, 220, '#017A57', 'white');
const countersPic = new PeasCounter(130, 220);
const dispatcher = d3.dispatch('new-pea')
// global steps not good
let steps = 0;
d3.select('#add-a-pea').on('click', function() {
  steps += 1;
  peasPic.drawStepsTill(peaSeqSteps, steps);
});
d3.select('#add-all-peas').on('click', function () {
  steps = peaSeqSteps.length;
  peasPic.drawRemainingSteps(peaSeqSteps);
});
dispatcher.on('new-pea', (pea) => {
  if (pea) {
    countersPic.updateCounters(pea);
    d3.select("#pea-probability")
      .node().scrollLeft = pea.xCoef * 220 - 600; // todo remove hardcode
  }
});
// peasPic.drawMiddleLine();
