let singlePeaResultBtn = d3.select('#single-pea-ready');
singlePeaResultBtn.on("click", e => showSinglePeaResult());

function showSinglePeaResult() {
  let beret_color = document.querySelector('input[name="beret"]:checked').value;
  let other_color = beret_color === "yellow"? "green" : "yellow";
  let guessed = Math.random() > .5;
  let file_path;
  if (guessed) {
    file_path = `imgs/glad_${beret_color}_pea.png`;
  }
  else {
    file_path = `imgs/sad_${other_color}_pea.png`;
  }
  let resNode = d3.select("#single-pea-result");
  resNode.html('')
  setTimeout(() => {
    resNode.html('')
    resNode.append("img").attr("src", file_path);
    resNode.append('span').html(" " + (guessed? "Успіх!" : "Невдача"));
  }, 200);
  let totRes = d3.select(guessed? "#tot-results-guessed" : "#tot-results-not-guessed");
  totRes.html(parseInt(totRes.html()) + 1);
}
