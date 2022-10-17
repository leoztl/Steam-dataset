color = function () {
  let r = Math.floor(Math.random() * 10);
  return d3.schemeTableau10[r];
}
let number = 0.1291754;
console.log(number.toFixed(2))
function draw(filename) {
  d3.text(filename).then(text => {
    size = group => group.length; // Given a grouping of words, returns the size factor for that word
    word = d => d; // Given an item of the data array, returns the word
    marginTop = 0; // top margin, in pixels
    marginRight = 0; // right margin, in pixels
    marginBottom = 0; // bottom margin, in pixels
    marginLeft = 0; // left margin, in pixels
    width = 1000; // outer width, in pixels
    height = 600; // outer height, in pixels
    maxWords = 200; // maximum number of words to extract from the text
    fontFamily = "sans-serif"; // font family
    fontScale = 22; // base font size
    padding = 2; // amount of padding between the words (in pixels)
    rotate = d3.randomInt(-30, 30); // a constant or function to rotate the words

    const words = typeof text === "string" ? text.split(/\W+/g) : Array.from(text);

    const data = d3.rollups(words, size, w => w)
      .sort(([, a], [, b]) => d3.descending(a, b))
      .slice(0, maxWords)
      .map(([key, size]) => ({ text: word(key), size }));

    let total = 0;
    for (let i = 0; i < data.length; i++) {
      total += +data[i].size;
    }
    let curr_font = 0;
    const svg = d3.select("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("font-family", fontFamily)
      .attr("text-anchor", "middle")
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    const g = svg.append("g").attr("transform", `translate(${marginLeft},${marginTop})`);

    var cloud = d3.layout.cloud()
      .size([width - marginLeft - marginRight, height - marginTop - marginBottom])
      .words(data)
      .padding(padding)
      .rotate(rotate)
      .font(fontFamily)
      .fontSize(d => Math.sqrt(d.size) * fontScale)
      .on("word", ({ size, x, y, rotate, text }) => {
        g.append("text")
          .attr("font-size", size)
          .attr("transform", `translate(${x},${y}) rotate(${rotate})`)
          .text(text)
          .attr("stroke", "none")
          .attr("fill", color)
          .on("mouseover", function (event) {
            curr_font = + d3.select(this).attr("font-size");
            d3.select(this).transition().attr("font-size", curr_font + 2);
            d3.select(this).attr("opacity", 0.8);
            let val = (curr_font / total * 100).toFixed(2) + "%";
            tooltip.text(val).style("font-size", "20px").style("stroke-width",2);
            tooltip
              .style("position", "absolute")
              .style("background", "lightsteelblue")
              .style("left", (event.pageX) + "px")
              .style("top", (event.pageY - 20) + "px")
              .style("opacity", .8);
          })
          .on("mousemove", function (event) {
            let val = (curr_font / total * 100).toFixed(2) + "%";
            tooltip.text(val);
            tooltip
              .style("position", "absolute")
              .style("background", "lightsteelblue")
              .style("left", (event.pageX) + "px")
              .style("top", (event.pageY - 20) + "px")
              .style("opacity", .8);
          })
          .on("mouseout", function () {
            let curr_font = +d3.select(this).attr("font-size");
            d3.select(this).transition().attr("font-size", curr_font - 2);
            d3.select(this).attr("opacity", 1);
            tooltip.style("opacity", 0);
          });
      });

    cloud.start();
  });
}

draw("WordCloud_2006.txt");

let years = [];
for (let i = 2006; i < 2023; i++) {
  years.push(i)
}
let menu = document.createElement("div");
menu.id = "menu";
document.body.appendChild(menu);
let x = 0;
let pad = 10;
let y = 1000;
menu.style.position = "absolute";
menu.style.top = y;

let tooltip = d3.select('body').append("div")
  .attr("id", "tooltip")
  .attr("class", "tooltip")
  .style("opacity", 0);

d3.select("body").append('svg').attr("transform", "translate(20,100)")

for (let i = 0; i < years.length; i++) {
  let bt = document.createElement("button");
  menu.appendChild(bt);
  bt.style.width = 50 + 'px';
  bt.style.position = "absolute";
  bt.style.left = x + 'px';
  bt.className = "bt";
  bt.id = years[i];
  x += 50 + pad;
  bt.innerHTML = years[i];
  bt.addEventListener("click", update);
}
function update() {
  /* let filename = "WordCloud_" + this.id + ".txt";
  d3.text(filename).then(data => {
    cloud.words(data)
  }); */
  d3.select('svg').selectAll('*').remove();
  let filename = "WordCloud_" + this.id + ".txt";
  draw(filename);
};