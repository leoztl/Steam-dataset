// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/force-directed-graph
function ForceGraph({
    nodes, // an iterable of node objects (typically [{id}, …])
    links // an iterable of link objects (typically [{source, target}, …])
}, {
    nodeId = d => d.id, // given d in nodes, returns a unique identifier (string)
    nodeGroup, // given d in nodes, returns an (ordinal) value for color
    nodeGroups, // an array of ordinal values representing the node groups
    nodeTitle, // given d in nodes, a title string
    nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)
    nodeStroke = "#fff", // node stroke color
    nodeStrokeWidth = 1.5, // node stroke width, in pixels
    nodeStrokeOpacity = 1, // node stroke opacity
    nodeRadius = 10, // node radius, in pixels
    nodeStrength,
    linkSource = ({ source }) => source, // given d in links, returns a node identifier string
    linkTarget = ({ target }) => target, // given d in links, returns a node identifier string
    linkStroke = "#999", // link stroke color
    linkStrokeOpacity = 0.1, // link stroke opacity
    linkStrokeWidth = 2, // given d in links, returns a stroke width in pixels
    linkStrokeLinecap = "round", // link stroke linecap
    linkStrength,
    colors = d3.schemeTableau10, // an array of color strings, for the node groups
    width = 1000, // outer width, in pixels
    height = 1000, // outer height, in pixels
    invalidation // when this promise resolves, stop the simulation
} = {}) {
    let real_links = links;
    // Compute values.
    const N = d3.map(nodes, nodeId).map(intern);
    const LS = d3.map(links, linkSource).map(intern);
    const LT = d3.map(links, linkTarget).map(intern);
    if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
    const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
    const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
    const W = typeof linkStrokeWidth !== "function" ? null : d3.map(links, linkStrokeWidth);
    const L = typeof linkStroke !== "function" ? null : d3.map(links, linkStroke);

    // Replace the input nodes and links with mutable objects for the simulation.
    nodes = d3.map(nodes, (_, i) => ({ id: N[i] }));
    links = d3.map(links, (_, i) => ({ source: LS[i], target: LT[i] }));

    // Compute default domains.
    if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);

    // Construct the scales.
    const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

    // Construct the forces.
    const forceNode = d3.forceManyBody();
    const forceLink = d3.forceLink(links).id(({ index: i }) => N[i]);
    if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
    if (linkStrength !== undefined) forceLink.strength(linkStrength);

    const simulation = d3.forceSimulation(nodes)
        .force("link", forceLink)
        .force("charge", forceNode)
        .force("center", d3.forceCenter())
        .on("tick", ticked);

    const svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    const link = svg.append("g")
        .attr("stroke", typeof linkStroke !== "function" ? linkStroke : null)
        .attr("stroke-opacity", linkStrokeOpacity)
        .attr("stroke-width", typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null)
        .attr("stroke-linecap", linkStrokeLinecap)
        .selectAll("line")
        .data(links)
        .join("line");

    const node = svg.append("g")
        .attr("fill", nodeFill)
        .attr("stroke", nodeStroke)
        .attr("stroke-opacity", nodeStrokeOpacity)
        .attr("stroke-width", nodeStrokeWidth)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", nodeRadius)
        .call(drag(simulation))
        .on("click", start);

    const text = svg.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .text(function (d) { return d.id; })
        .call(drag(simulation));
    let tooltip = d3.select("#menu").append("div")
        .attr("id", "tooltip")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("background", "white");
    tooltip.append("span").attr("id", "node");
    tooltip.append("span").attr("id", "nodevalue");
    tooltip.append("g").attr("id", "display2");
    function start(event, d) {
        console.log(d)
        console.log(nodes)
        let index = d.index;
        connection = [];
        for (let i = 0; i < real_links.length; i++) {
            if (real_links[i].source == d.id) {
                let target = real_links[i].target;
                let value = real_links[i].value;
                let target_idx = 0;
                for(let j = 0; j < nodes.length;j++){
                    if(nodes[j].id == target){
                        target_idx = nodes[j].index;
                    }
                }
                connection.push({ "target": target, "value": value, "target_idx":target_idx})
            }
        }
        console.log(connection)
        tooltip
            /* .style("position", "absolute")
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 40) + "px") */
            .style("opacity", .9);
        tooltip.select("#node").text("Node name: ").style("font-size", "14px")
        tooltip.select("#nodevalue").text(d.id)
            .style("font-size", "14px")
            .style("color", color(G[index]))
            .append("br")
        let sub = tooltip.select("#display2")
            .selectAll("span")
            .data(connection)
            .join("span")
            .attr("dy", function (d, i) {
                return 500 * i;
            })
            .attr("dx", 0)
        sub.append("span").text("Connected to ").style("font-size", "14px")
        sub.append("span").text(function(d){return d.target}).style("font-size", "14px").style("color", function(d){return color(G[d.target_idx])})
        sub.append("span").text(" ; Value: ").style("font-size", "14px")
        sub.append("span").text(function(d){return d.value}).style("font-size", "14px").style("color", function(d){return color(G[d.target_idx])})
            .append('br');
    }
    if (W) link.attr("stroke-width", ({ index: i }) => W[i]);
    if (L) link.attr("stroke", ({ index: i }) => L[i]);
    if (G) node.attr("fill", ({ index: i }) => color(G[i]));
    if (G) text.attr("fill", ({ index: i }) => color(G[i]));
    if (T) node.append("title").text(({ index: i }) => T[i]);
    if (invalidation != null) invalidation.then(() => simulation.stop());

    function intern(value) {
        return value !== null && typeof value === "object" ? value.valueOf() : value;
    }

    function ticked() {
        factor = 4
        link
            .attr("x1", d => factor * d.source.x)
            .attr("y1", d => factor * d.source.y)
            .attr("x2", d => factor * d.target.x)
            .attr("y2", d => factor * d.target.y);

        node
            .attr("cx", d => factor * d.x)
            .attr("cy", d => factor * d.y);

        text
            .attr("x", d => factor * d.x)
            .attr("y", d => factor * d.y)
            .attr("dx", -20)
            .attr("dy", 20);
    }

    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    return Object.assign(svg.node(), { scales: { color } });
};
d3.json("vis1.json").then(data => {
    chart = ForceGraph(data, {
        nodeId: (d) => d.id,
        nodeGroup: (d) => d.group,
        linkStrokeWidth: (l) => Math.sqrt(l.value),
        width: 1400,
        height: 1400,
    })
});