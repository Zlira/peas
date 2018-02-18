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
 * from sequence of peas to expanded list with state of
 * peaSeq at each step
 */
function expandPeaSeq(peaSeq) {
  let expandedSeq = [], stepState, xCoef=0.5;
  for (let i=1; i <= peaSeq.length; i++) {
    stepState = peaSeq.slice(0, i).sort((d1, d2) => d1.color > d2.color ? 1 : -1)
    stepState = stepState.map((p, j) => ({
      ind: j, color: p.color, step: i,
      xCoef: xCoef,
    }));
    expandedSeq = expandedSeq.concat(stepState);
    xCoef += 1 / (i * 2) + 1 / ((i + 1) * 2);
  };
  return expandedSeq;
}

function drawRandomPeas(peaSeqSteps, shape='circle') {
  const width = 1115,
        height = 200;
  let svg = d3.select('#pea-probability')
              .append('svg')
                .attr('height', height)
                .attr('width', width);
  //svg.append('rect')
   //   .attr('width', '100%')
   //   .attr('fill', '#017A57');
   //   .attr('height', '100%')

  if (shape === 'circle') {
    svg.append('g').selectAll('circle')
       .data(peaSeqSteps)
       .enter().append('circle')
       .attr('fill', d => d.color)
       .attr('r', d => height / d.step/ 2)
       .attr('cx', d => d.xCoef * height)
       .attr('cy', d => (height / d.step / 2)  * 2 * (d.ind + .5));
  } else if (shape === 'rect') {
    svg.append('g').selectAll('rect')
       .data(peaSeqSteps)
       .enter().append('rect')
       .attr('fill', d => d.color)
       .attr('stroke', 'white')
       .attr('stroke-width', .5)
       .attr('width', d => height / d.step)
       .attr('height', d => height / d.step)
       .attr('x', d => d.xCoef * height - height / d.step / 2)
       .attr('y', d => (height / d.step / 2)  * 2 * (d.ind + .5) - height / d.step / 2);
  }


  svg.append('line').attr('x1', 0).attr('y1', height / 2)
                    .attr('x2', width).attr('y2', height / 2)
                    .attr('stroke', 'grey').attr('stroke-width', '1px');
}

let peaSeqSteps = expandPeaSeq(getRandomPeaSeq(145));
drawRandomPeas(peaSeqSteps);
drawRandomPeas(peaSeqSteps, 'rect');
