'use strict';

function getRandomPea() {
  const options = ['#A9CF46', '#FFCC2A'];
  return Math.random() > .5? options[0] : options[1];
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
 * from sequence of peas to expanded list with state of
 * peaSeq at each step
 */
function expandPeaSeq(peaSeq) {
  let expandedSeq = [], stepState, xCoef=0.5;
  for (let i=1; i <= peaSeq.length; i++) {
    stepState = peaSeq.slice(0, i).map(p => ({
      ind: p.ind, color: p.color, step: i,
      xCoef: xCoef,
    }));
    expandedSeq = expandedSeq.concat(stepState);
    xCoef += 1 / (i * 2) + 1 / ((i + 1) * 2);
  };
  return expandedSeq;
}

const width = 1000,
      height = 200;
let peaSeqSteps = expandPeaSeq(getRandomPeaSeq(85));

let svg = d3.select('#pea-probability')
            .append('svg')
              .attr('height', height)
              .attr('width', width);
svg.append('rect')
   .attr('width', '100%')
   .attr('height', '100%')
   .attr('fill', '#017A57');

svg.append('g').selectAll('circle')
   .data(peaSeqSteps)
   .enter().append('circle')
   .attr('fill', d => d.color)
   .attr('r', d => height / d.step/ 2)
   .attr('cx', d => d.xCoef * height)
   .attr('cy', d => (height / d.step / 2)  * 2 * (d.ind + .5));
