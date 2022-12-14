(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("d3-scale")) :
    typeof define === "function" && define.amd ? define(["exports", "d3-scale"], factory) :
      (factory(global.d3 = global.d3 || {}, global.d3));
}(this, function (exports, d3Scale) {
  'use strict';

  function square(x) {
    return x * x;
  }

  function radial() {
    var linear = d3Scale.scaleLinear();

    function scale(x) {
      return Math.sqrt(linear(x));
    }

    scale.domain = function (_) {
      return arguments.length ? (linear.domain(_), scale) : linear.domain();
    };

    scale.nice = function (count) {
      return (linear.nice(count), scale);
    };

    scale.range = function (_) {
      return arguments.length ? (linear.range(_.map(square)), scale) : linear.range().map(Math.sqrt);
    };

    scale.ticks = linear.ticks;
    scale.tickFormat = linear.tickFormat;

    return scale;
  }

  exports.scaleRadial = radial;

  Object.defineProperty(exports, '__esModule', { value: true });
}));

var svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height"),
  innerRadius = 180,
  outerRadius = Math.min(width, height) / 2,
  g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var x = d3.scaleBand()
  .range([0, 2 * Math.PI])
  .align(0);

var y = d3.scaleRadial()
  .range([innerRadius, outerRadius]);

var z = d3.scaleOrdinal(d3.schemeTableau10)
/* .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]); */

d3.csv("new.csv", function (d, i, columns) {
  for (i = 1, t = 0; i < columns.length; ++i) t += d[columns[i]] = +d[columns[i]];
  d.total = t;
  console.log(t);
  return d;
}, function (error, data) {
  if (error) throw error;
  x.domain(data.map(function (d) { return d.Year; }));
  y.domain([0, d3.max(data, function (d) { return d.total; })]);
  z.domain(data.columns.slice(1));
  console.log(d3.stack().keys(data.columns.slice(1))(data))
  g.append("g")
    .selectAll("g")
    .data(d3.stack().keys(data.columns.slice(1))(data))
    .enter().append("g")
    .attr("fill", function (d) { console.log(d); return z(d.key); })
    .selectAll("path")
    .data(function (d) { return d; })
    .enter().append("path")
    .attr("d", d3.arc()
      .innerRadius(function (d) { return y(d[0]); })
      .outerRadius(function (d) { return y(d[1]); })
      .startAngle(function (d) { return x(d.data.Year); })
      .endAngle(function (d) { return x(d.data.Year) + x.bandwidth(); })
      .padAngle(0.01)
      .padRadius(innerRadius));

  var label = g.append("g")
    .selectAll("g")
    .data(data)
    .enter().append("g")
    .attr("text-anchor", "middle")
    .attr("transform", function (d) { return "rotate(" + ((x(d.Year) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")translate(" + innerRadius + ",0)"; });

  label.append("line")
    .attr("x2", -5)
    .attr("stroke", "#000");

  label.append("text")
    .attr("transform", function (d) { return (x(d.Year) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI ? "rotate(90)translate(0,16)" : "rotate(-90)translate(0,-9)"; })
    .text(function (d) { return d.Year; });

  var yAxis = g.append("g")
    .attr("text-anchor", "middle");

  var yTick = yAxis
    .selectAll("g")
    .data(y.ticks(5).slice(1))
    .enter().append("g");

  yTick.append("circle")
    .attr("fill", "none")
    .attr("stroke", "#000")
    .attr("r", y);

  yTick.append("text")
    .attr("y", function (d) { return -y(d); })
    .attr("dy", "0.35em")
    .attr("fill", "none")
    .attr("stroke", "#fff")
    .attr("stroke-width", 5)
    .text(y.tickFormat(5, "s"));

  yTick.append("text")
    .attr("y", function (d) { return -y(d); })
    .attr("dy", "0.35em")
    .text(y.tickFormat(5, "s"));



  var legend = g.append("g")
    .selectAll("g")
    .data(data.columns.slice(1).reverse())
    .enter().append("g")
    .attr("transform", function (d, i) { return "translate(400," + (i - (data.columns.length - 1) / 2) * 20 + ")"; });

  legend.append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", z);

  legend.append("text")
    .attr("x", 24)
    .attr("y", 9)
    .attr("dy", "0.35em")
    .text(function (d) { return d; });
});